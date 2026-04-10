"""
Relevance scoring worker.
Scores each new regulatory change against all active user profiles.
"""
import logging
from uuid import UUID

from workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="workers.relevance.scorer.score_change",
    bind=True,
    max_retries=2,
    default_retry_delay=60,
)
def score_change(self, regulatory_change_id: str):
    import asyncio
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(_score_change(regulatory_change_id))
        finally:
            loop.close()
    except Exception as exc:
        logger.error(f"Relevance scoring failed for {regulatory_change_id}: {exc}")
        raise self.retry(exc=exc)


async def _score_change(regulatory_change_id: str) -> None:
    from sqlalchemy import select
    from sqlalchemy.dialects.postgresql import insert as pg_insert
    from app.db.session import AsyncSessionLocal
    from app.models.regulatory_change import RegulatoryChange
    from app.models.processed_document import ProcessedDocument
    from app.models.user_profile import UserProfile
    from app.models.relevance_mapping import RelevanceMapping
    from app.services.embeddings import embed_text

    async with AsyncSessionLocal() as session:
        # Load change and its processed doc
        change_result = await session.execute(
            select(RegulatoryChange).where(RegulatoryChange.id == UUID(regulatory_change_id))
        )
        change = change_result.scalar_one_or_none()
        if not change:
            return

        proc_result = await session.execute(
            select(ProcessedDocument).where(ProcessedDocument.id == change.processed_document_id)
        )
        proc = proc_result.scalar_one_or_none()
        if not proc:
            return

        # Load all active users
        users_result = await session.execute(select(UserProfile))
        users = users_result.scalars().all()

        flagged: list[tuple] = []  # (user, score) for audit logging after commit
        for user in users:
            score, reasoning, signals = await _compute_relevance(user, change, proc, embed_text)
            if score < 0.5:
                continue

            # Upsert relevance mapping
            stmt = (
                pg_insert(RelevanceMapping)
                .values(
                    user_id=user.id,
                    regulatory_change_id=change.id,
                    relevance_score=score,
                    relevance_reasoning=reasoning,
                    match_signals=signals,
                )
                .on_conflict_do_update(
                    constraint="uq_relevance_mappings_user_change",
                    set_={"relevance_score": score, "relevance_reasoning": reasoning, "match_signals": signals},
                )
            )
            await session.execute(stmt)

            flagged.append((user, score))

            # Trigger alert if warranted
            if (
                change.impact_level == "high"
                and user.alert_threshold in ["high", "medium", "all"]
            ) or (
                change.impact_level == "medium"
                and user.alert_threshold in ["medium", "all"]
            ):
                from workers.delivery.alert_sender import send_alert
                send_alert.delay(str(user.id), str(change.id))

        await session.commit()

        # Auto-populate calendar events for flagged users
        if flagged:
            import datetime as dt_module
            from app.models.calendar_event import CalendarEvent
            for user, score in flagged:
                for kd in (proc.key_dates or []):
                    label = (kd.get("label") or "").lower()
                    date_str = kd.get("date")
                    if not date_str:
                        continue
                    try:
                        event_date = dt_module.date.fromisoformat(date_str)
                    except ValueError:
                        continue
                    if "comment" in label:
                        event_type = "comment_deadline"
                    elif "effective" in label:
                        event_type = "effective_date"
                    elif "filing" in label:
                        event_type = "filing_deadline"
                    else:
                        event_type = "review_date"
                    try:
                        existing = await session.execute(
                            select(CalendarEvent).where(
                                CalendarEvent.user_id == user.id,
                                CalendarEvent.processed_document_id == change.processed_document_id,
                                CalendarEvent.event_type == event_type,
                                CalendarEvent.date == event_date,
                            )
                        )
                        if not existing.scalar_one_or_none():
                            session.add(CalendarEvent(
                                user_id=user.id,
                                regulatory_change_id=change.id,
                                processed_document_id=change.processed_document_id,
                                title=f"{kd.get('label', 'Key Date')}: {change.headline[:100]}",
                                event_type=event_type,
                                date=event_date,
                                is_user_created=False,
                            ))
                    except Exception as cal_exc:
                        logger.warning(f"Calendar event creation failed: {cal_exc}")
            await session.commit()

        # Audit log each flagged user (standalone session, never raises)
        from app.services.audit import write as audit_write
        for user, score in flagged:
            await audit_write(
                user_id=user.id,
                event_type="donna_flagged_change",
                entity_type="regulatory_change",
                entity_id=change.id,
                entity_title=change.headline,
                metadata={
                    "source_id": str(change.source_id) if change.source_id else None,
                    "impact_level": change.impact_level,
                    "change_type": change.change_type,
                    "relevance_score": round(score, 3),
                },
            )


async def _compute_relevance(user, change, proc, embed_text_fn):
    """Compute relevance score using hard filters + semantic similarity + significance boost."""
    signals = {}

    # Step 1: Hard filters
    change_industries = set(proc.affected_industries or [])
    change_jurisdictions = set(proc.affected_jurisdictions or [])
    user_industries = set(user.industries or [])
    user_jurisdictions = set(user.jurisdictions or [])

    industry_match = bool(
        user_industries & change_industries
        or "federal" in change_jurisdictions
    )
    jurisdiction_match = bool(
        user_jurisdictions & change_jurisdictions
        or "federal" in change_jurisdictions
    )
    source_match = (
        not user.watched_source_ids
        or change.source_id in (user.watched_source_ids or [])
    )

    signals["industry_match"] = industry_match
    signals["jurisdiction_match"] = jurisdiction_match
    signals["source_match"] = source_match

    if not (industry_match and jurisdiction_match and source_match):
        return 0.0, "Did not pass hard filters", signals

    # Step 2: Semantic similarity (if embedding exists)
    semantic_score = 0.0  # no embedding means no semantic signal
    if proc.embedding is not None:
        try:
            industries_str = ", ".join(user_industries) if user_industries else "general"
            jurisdictions_str = ", ".join(user_jurisdictions) if user_jurisdictions else "federal"
            user_text = (
                f"{user.company_name or 'A company'} is a {industries_str} company "
                f"operating in {jurisdictions_str}. "
                f"Key compliance concerns: {industries_str} regulations in {jurisdictions_str}."
            )
            user_embedding = await embed_text_fn(user_text)
            if user_embedding and proc.embedding:
                semantic_score = _cosine_similarity(user_embedding, proc.embedding)
        except Exception:
            semantic_score = 0.65

    signals["semantic_score"] = semantic_score

    if semantic_score < 0.65:
        return 0.0, "Semantic similarity below threshold", signals

    # Step 3: Significance boost
    significance = proc.significance_score or 0.5
    impact_multiplier = {"high": 1.0, "medium": 0.7, "low": 0.4}.get(change.impact_level, 0.7)

    # Weighted final score: 30% semantic, 30% significance, 40% hard filter pass (binary)
    final_score = (
        0.40 * semantic_score
        + 0.30 * significance
        + 0.30 * impact_multiplier
    )
    signals["significance_score"] = significance
    signals["impact_multiplier"] = impact_multiplier
    signals["final_score"] = final_score

    # Build reasoning
    matched_industries = list(user_industries & change_industries)
    matched_jurisdictions = list(user_jurisdictions & change_jurisdictions)
    reasoning_parts = []
    if matched_industries:
        reasoning_parts.append(f"affects your {', '.join(matched_industries)} industry")
    if matched_jurisdictions:
        reasoning_parts.append(f"covers {', '.join(matched_jurisdictions)} jurisdiction(s)")
    if change.impact_level == "high":
        reasoning_parts.append("rated HIGH impact")
    reasoning = "Flagged because this change " + " and ".join(reasoning_parts) if reasoning_parts else "Relevant to your compliance profile"

    return min(final_score, 1.0), reasoning, signals


def _cosine_similarity(a: list[float], b) -> float:
    """Compute cosine similarity between two vectors."""
    import math
    if hasattr(b, "tolist"):
        b = b.tolist()
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)
