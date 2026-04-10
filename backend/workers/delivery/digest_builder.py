"""
Digest assembly and delivery worker.
"""
import logging
from workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="workers.delivery.digest_builder.send_daily_digests", bind=True)
def send_daily_digests(self):
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(_send_digests(cadence="daily"))
    finally:
        loop.close()


@celery_app.task(name="workers.delivery.digest_builder.send_weekly_digests", bind=True)
def send_weekly_digests(self):
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(_send_digests(cadence="weekly"))
    finally:
        loop.close()


async def _send_digests(cadence: str) -> None:
    from sqlalchemy import select
    from datetime import datetime, timezone, timedelta

    from app.db.session import AsyncSessionLocal
    from app.models.user_profile import UserProfile
    from app.models.relevance_mapping import RelevanceMapping
    from app.models.regulatory_change import RegulatoryChange
    from app.models.processed_document import ProcessedDocument
    from app.models.alert import Alert
    from app.models.digest import Digest
    from app.services.llm import assemble_digest
    from app.services.email import send_email

    now = datetime.now(timezone.utc)

    async with AsyncSessionLocal() as session:
        # Load users with matching cadence
        users_result = await session.execute(
            select(UserProfile).where(UserProfile.digest_cadence == cadence)
        )
        users = users_result.scalars().all()

        period_end = now
        period_start = now - (timedelta(days=1) if cadence == "daily" else timedelta(days=7))

        digests_sent: list[tuple] = []  # (user, change_count, period_start, period_end, success)
        for user in users:
            # Pull relevance mappings in period, excluding already-alerted changes
            alerted_ids_result = await session.execute(
                select(Alert.regulatory_change_id).where(
                    Alert.user_id == user.id,
                    Alert.sent_at >= period_start,
                )
            )
            alerted_ids = {row[0] for row in alerted_ids_result.fetchall()}

            rm_result = await session.execute(
                select(RelevanceMapping).where(
                    RelevanceMapping.user_id == user.id,
                    RelevanceMapping.created_at >= period_start,
                    RelevanceMapping.created_at < period_end,
                    ~RelevanceMapping.regulatory_change_id.in_(alerted_ids),
                ).order_by(RelevanceMapping.relevance_score.desc()).limit(10)
            )
            mappings = rm_result.scalars().all()

            if not mappings:
                logger.info(f"No digest content for user {user.id}")
                continue

            # Load changes and processed docs
            changes_data = []
            for rm in mappings:
                change_result = await session.execute(
                    select(RegulatoryChange).where(RegulatoryChange.id == rm.regulatory_change_id)
                )
                change = change_result.scalar_one_or_none()
                if not change:
                    continue

                proc_result = await session.execute(
                    select(ProcessedDocument).where(ProcessedDocument.id == change.processed_document_id)
                )
                proc = proc_result.scalar_one_or_none()
                if not proc:
                    continue

                changes_data.append({
                    "headline": change.headline,
                    "plain_summary": proc.plain_summary,
                    "recommended_actions": proc.recommended_actions or "",
                    "key_dates": proc.key_dates or [],
                    "impact_level": change.impact_level,
                })

            if not changes_data:
                continue

            # Assemble via Claude
            try:
                assembled = await assemble_digest(
                    full_name=user.full_name or user.email,
                    company_name=user.company_name or "your company",
                    industries=user.industries or [],
                    changes=changes_data,
                )
            except Exception as e:
                logger.error(f"Digest assembly failed for user {user.id}: {e}")
                continue

            period_label = "weekly" if cadence == "weekly" else "daily"
            headline = f"Your {period_label} regulatory briefing — {now.strftime('%B %d, %Y')}"

            # Send
            success = await send_email(
                to=user.email,
                subject=f"[Donna] {headline}",
                html=assembled["html"],
                text=assembled["text"],
            )

            # Write digest record
            digest = Digest(
                user_id=user.id,
                period_start=period_start,
                period_end=period_end,
                headline=headline,
                assembled_html=assembled["html"],
                assembled_text=assembled["text"],
                change_ids=[rm.regulatory_change_id for rm in mappings],
                sent_at=now if success else None,
                status="sent" if success else "failed",
            )
            session.add(digest)
            digests_sent.append((user, len(mappings), period_start, period_end, success))

        await session.commit()

        # Audit log after commit (standalone sessions, never raises)
        from app.services.audit import write as audit_write
        for user, change_count, p_start, p_end, sent in digests_sent:
            if sent:
                await audit_write(
                    user_id=user.id,
                    event_type="digest_sent",
                    entity_type="digest",
                    metadata={
                        "period_start": p_start.isoformat(),
                        "period_end": p_end.isoformat(),
                        "change_count": change_count,
                        "cadence": cadence,
                    },
                )
