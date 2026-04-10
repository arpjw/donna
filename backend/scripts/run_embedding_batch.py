"""
Generate embeddings for all processed documents that don't have one yet.
Usage: python -m scripts.run_embedding_batch [--limit N]
"""
import asyncio
import sys
import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")
logger = logging.getLogger(__name__)


async def run_batch(limit: int = 50) -> None:
    from sqlalchemy import select, func, text
    import app.models  # noqa
    from app.db.session import AsyncSessionLocal
    from app.models.processed_document import ProcessedDocument
    from workers.processing.embedding import _generate_embedding

    async with AsyncSessionLocal() as session:
        # Get docs without embeddings
        result = await session.execute(
            select(ProcessedDocument)
            .where(ProcessedDocument.embedding == None)
            .limit(limit)
        )
        docs = result.scalars().all()
        doc_ids = [str(d.id) for d in docs]

    logger.info(f"Generating embeddings for {len(doc_ids)} documents (rate limited to 3 RPM)...")
    success = 0
    for i, doc_id in enumerate(doc_ids, 1):
        try:
            await _generate_embedding(doc_id)
            success += 1
            logger.info(f"[{i}/{len(doc_ids)}] Generated embedding for {doc_id}")
        except Exception as e:
            logger.error(f"[{i}] Failed {doc_id}: {e}")
        # Voyage AI free tier: 3 RPM — wait 21s between calls
        if i < len(doc_ids):
            await asyncio.sleep(21)

    logger.info(f"Done: {success}/{len(doc_ids)} embeddings generated")

    # Verify
    async with AsyncSessionLocal() as session:
        count_result = await session.execute(
            select(func.count()).select_from(ProcessedDocument).where(
                ProcessedDocument.embedding != None
            )
        )
        with_embeddings = count_result.scalar()
        logger.info(f"Total documents with embeddings: {with_embeddings}")


if __name__ == "__main__":
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 50
    asyncio.run(run_batch(limit))
