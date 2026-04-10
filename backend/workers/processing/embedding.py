"""
Embedding generation worker.
Generates Voyage AI embeddings for processed documents and stores in pgvector.
"""
import logging
from uuid import UUID

from workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="workers.processing.embedding.generate_embedding",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def generate_embedding(self, processed_document_id: str):
    import asyncio
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(_generate_embedding(processed_document_id))
        finally:
            loop.close()
    except Exception as exc:
        logger.error(f"Embedding failed for {processed_document_id}: {exc}")
        raise self.retry(exc=exc)


async def _generate_embedding(processed_document_id: str) -> None:
    from sqlalchemy import select, update
    from app.db.session import AsyncSessionLocal
    from app.models.processed_document import ProcessedDocument
    from app.services.embeddings import embed_text

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(ProcessedDocument).where(ProcessedDocument.id == UUID(processed_document_id))
        )
        doc = result.scalar_one_or_none()
        if not doc:
            logger.error(f"ProcessedDocument {processed_document_id} not found")
            return

        # Build embedding input string
        tags_str = ", ".join(doc.taxonomy_tags) if doc.taxonomy_tags else ""
        industries_str = ", ".join(doc.affected_industries) if doc.affected_industries else ""
        jurisdictions_str = ", ".join(doc.affected_jurisdictions) if doc.affected_jurisdictions else ""

        # Get headline from regulatory_change
        from app.models.regulatory_change import RegulatoryChange
        change_result = await session.execute(
            select(RegulatoryChange).where(RegulatoryChange.processed_document_id == doc.id)
        )
        change = change_result.scalar_one_or_none()
        headline = change.headline if change else ""

        embed_input = f"{headline}. {doc.plain_summary}"
        if tags_str:
            embed_input += f" Tags: {tags_str}."
        if industries_str:
            embed_input += f" Industries: {industries_str}."
        if jurisdictions_str:
            embed_input += f" Jurisdictions: {jurisdictions_str}."

        # Generate embedding
        vector = await embed_text(embed_input)
        if not vector:
            logger.error(f"Failed to generate embedding for {processed_document_id}")
            return

        # Store — use raw SQL to handle pgvector type
        await session.execute(
            update(ProcessedDocument)
            .where(ProcessedDocument.id == doc.id)
            .values(embedding=vector)
        )
        await session.commit()
        logger.info(f"Generated embedding for ProcessedDocument {processed_document_id}")
