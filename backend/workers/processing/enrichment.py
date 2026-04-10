"""
LLM enrichment pipeline.
Processes raw_documents through Claude, writes to processed_documents and regulatory_changes.
"""
import json
import logging
from uuid import UUID

from tenacity import retry, stop_after_attempt, wait_exponential

from workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="workers.processing.enrichment.enrich_document",
    bind=True,
    max_retries=3,
    default_retry_delay=120,
)
def enrich_document(self, raw_document_id: str):
    import asyncio
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(_enrich_document(raw_document_id))
        finally:
            loop.close()
    except Exception as exc:
        logger.error(f"Enrichment failed for {raw_document_id}: {exc}")
        raise self.retry(exc=exc)


async def _enrich_document(raw_document_id: str) -> None:
    from sqlalchemy import select, update
    from app.db.session import AsyncSessionLocal
    from app.models.raw_document import RawDocument
    from app.models.processed_document import ProcessedDocument
    from app.models.regulatory_change import RegulatoryChange
    from app.models.regulatory_source import RegulatorySource
    from app.services.llm import extract_document_enrichment

    async with AsyncSessionLocal() as session:
        # Load raw document with source
        result = await session.execute(
            select(RawDocument).where(RawDocument.id == UUID(raw_document_id))
        )
        raw_doc = result.scalar_one_or_none()
        if not raw_doc:
            logger.error(f"RawDocument {raw_document_id} not found")
            return

        if raw_doc.is_processed:
            logger.info(f"RawDocument {raw_document_id} already processed, skipping")
            return

        # Load source name
        source_name = "Unknown"
        if raw_doc.source_id:
            src_result = await session.execute(
                select(RegulatorySource).where(RegulatorySource.id == raw_doc.source_id)
            )
            src = src_result.scalar_one_or_none()
            if src:
                source_name = src.name

        logger.info(f"Enriching document: {raw_doc.title[:80]}")

        # Call Claude
        try:
            enrichment = await extract_document_enrichment(
                title=raw_doc.title,
                document_type=raw_doc.document_type,
                source_name=source_name,
                published_at=raw_doc.published_at,
                full_text=raw_doc.full_text or raw_doc.title,
            )
        except Exception as e:
            logger.warning(f"LLM call failed for {raw_document_id}, using fallback: {e}")
            from app.services.llm import _fallback_enrichment
            enrichment = _fallback_enrichment(raw_doc.title, raw_doc.document_type)

        # Parse key_dates effective/comment dates for the change record
        effective_date = None
        comment_deadline = None
        for kd in enrichment.get("key_dates", []):
            label = kd.get("label", "").lower()
            date_str = kd.get("date")
            if not date_str:
                continue
            from datetime import datetime, timezone
            try:
                dt = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                if "effective" in label:
                    effective_date = dt
                elif "comment" in label:
                    comment_deadline = dt
            except ValueError:
                pass

        # Also pull from raw_metadata if available
        if raw_doc.raw_metadata:
            meta = raw_doc.raw_metadata
            if not effective_date and meta.get("effective_on"):
                from datetime import datetime, timezone
                try:
                    effective_date = datetime.strptime(meta["effective_on"], "%Y-%m-%d").replace(
                        tzinfo=timezone.utc
                    )
                except (ValueError, TypeError):
                    pass
            if not comment_deadline and meta.get("comment_date"):
                from datetime import datetime, timezone
                try:
                    comment_deadline = datetime.strptime(meta["comment_date"], "%Y-%m-%d").replace(
                        tzinfo=timezone.utc
                    )
                except (ValueError, TypeError):
                    pass

        # Write processed_document
        processed = ProcessedDocument(
            raw_document_id=raw_doc.id,
            plain_summary=enrichment["plain_summary"],
            detailed_summary=enrichment["detailed_summary"],
            affected_industries=enrichment.get("affected_industries", []),
            affected_jurisdictions=enrichment.get("affected_jurisdictions", []),
            key_dates=enrichment.get("key_dates", []),
            document_type=enrichment.get("change_type", raw_doc.document_type),
            significance_score=enrichment.get("significance_score"),
            significance_reasoning=enrichment.get("significance_reasoning"),
            taxonomy_tags=enrichment.get("taxonomy_tags", []),
            recommended_actions=enrichment.get("recommended_actions"),
            llm_model_version="claude-sonnet-4-6",
            prompt_version="v1",
        )
        session.add(processed)
        await session.flush()

        # Write regulatory_change
        change = RegulatoryChange(
            processed_document_id=processed.id,
            change_type=enrichment.get("change_type", "guidance_update"),
            headline=enrichment.get("headline", raw_doc.title[:200]),
            impact_level=enrichment.get("impact_level", "medium"),
            effective_date=effective_date,
            comment_deadline=comment_deadline,
            source_id=raw_doc.source_id,
        )
        session.add(change)

        # Mark raw_document as processed
        await session.execute(
            update(RawDocument)
            .where(RawDocument.id == raw_doc.id)
            .values(is_processed=True)
        )

        await session.commit()
        logger.info(f"Enriched document {raw_document_id}: {enrichment.get('headline', '')[:80]}")

        # Enqueue embedding generation
        from workers.processing.embedding import generate_embedding
        generate_embedding.delay(str(processed.id))

        # Enqueue relevance scoring
        from workers.relevance.scorer import score_change
        score_change.delay(str(change.id))
