import logging
from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert

from app.db.session import AsyncSessionLocal
import app.models  # noqa: F401 — registers all ORM mappers
from app.models.regulatory_source import RegulatorySource
from app.models.raw_document import RawDocument
from app.schemas.documents import RawDocumentCreate

logger = logging.getLogger(__name__)


class BaseIngester:
    source_slug: str

    async def fetch_new_documents(self, since: datetime | None) -> list[RawDocumentCreate]:
        raise NotImplementedError

    async def run(self) -> int:
        """
        Full ingestion cycle:
        1. Load source record from DB
        2. Call fetch_new_documents()
        3. Upsert each doc into raw_documents (skip if URL already exists)
        4. Update source.last_checked_at
        5. Return count of newly inserted docs
        """
        async with AsyncSessionLocal() as session:
            # 1. Load source
            result = await session.execute(
                select(RegulatorySource).where(RegulatorySource.slug == self.source_slug)
            )
            source = result.scalar_one_or_none()
            if not source:
                logger.error(f"Source '{self.source_slug}' not found in DB")
                return 0

            logger.info(f"[{self.source_slug}] Starting ingestion. Last checked: {source.last_checked_at}")

            # 2. Fetch
            try:
                documents = await self.fetch_new_documents(since=source.last_checked_at)
            except Exception as e:
                logger.error(f"[{self.source_slug}] fetch_new_documents failed: {e}")
                return 0

            logger.info(f"[{self.source_slug}] Fetched {len(documents)} documents")

            # 3. Upsert
            inserted = 0
            new_doc_ids = []
            for doc in documents:
                stmt = (
                    insert(RawDocument)
                    .values(
                        source_id=source.id,
                        external_id=doc.external_id,
                        title=doc.title,
                        full_text=doc.full_text,
                        document_url=doc.document_url,
                        document_type=doc.document_type,
                        published_at=doc.published_at,
                        is_processed=False,
                        raw_metadata=doc.raw_metadata,
                    )
                    .on_conflict_do_nothing(constraint="uq_raw_documents_source_url")
                    .returning(RawDocument.id)
                )
                result = await session.execute(stmt)
                row = result.fetchone()
                if row:
                    new_doc_ids.append(row[0])
                    inserted += 1

            # 4. Update last_checked_at
            await session.execute(
                update(RegulatorySource)
                .where(RegulatorySource.id == source.id)
                .values(last_checked_at=datetime.now(timezone.utc))
            )
            await session.commit()

            logger.info(f"[{self.source_slug}] Inserted {inserted} new documents")

            # 5. Enqueue processing for each new doc
            if new_doc_ids:
                from workers.processing.enrichment import enrich_document
                for doc_id in new_doc_ids:
                    enrich_document.delay(str(doc_id))
                logger.info(f"[{self.source_slug}] Enqueued {len(new_doc_ids)} enrichment jobs")

            return inserted
