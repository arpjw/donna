"""
Run LLM enrichment on a batch of unprocessed raw documents.
Usage: python -m scripts.run_enrichment_batch [--limit N]
"""
import asyncio
import sys
import os
import logging

sys.path.insert(0, "/app")
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://donna:donna@postgres:5432/donna")

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")
logger = logging.getLogger(__name__)


async def run_batch(limit: int = 10) -> None:
    from sqlalchemy import select
    import app.models  # noqa: registers all models
    from app.db.session import AsyncSessionLocal
    from app.models.raw_document import RawDocument
    from workers.processing.enrichment import _enrich_document

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(RawDocument)
            .where(RawDocument.is_processed == False)
            .order_by(RawDocument.published_at.desc().nullslast())
            .limit(limit)
        )
        docs = result.scalars().all()
        doc_ids = [str(d.id) for d in docs]

    logger.info(f"Enriching {len(doc_ids)} documents...")
    for i, doc_id in enumerate(doc_ids, 1):
        logger.info(f"[{i}/{len(doc_ids)}] Processing {doc_id}")
        try:
            await _enrich_document(doc_id)
        except Exception as e:
            logger.error(f"Failed: {e}")
            continue

    # Summary
    from sqlalchemy import func
    async with AsyncSessionLocal() as session:
        count = await session.execute(
            select(func.count()).select_from(
                __import__('app.models.processed_document', fromlist=['ProcessedDocument']).ProcessedDocument
            )
        )
        total = count.scalar()
        logger.info(f"Total processed_documents: {total}")


if __name__ == "__main__":
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    asyncio.run(run_batch(limit))
