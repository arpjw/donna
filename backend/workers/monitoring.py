"""
Ingestion health monitoring.
Checks that all active regulatory sources have been ingested recently.
Runs every hour via Celery Beat.
"""
import logging

from workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="workers.monitoring.check_ingestion_health",
    bind=True,
    max_retries=0,
    ignore_result=True,
)
def check_ingestion_health(self):
    import asyncio
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(_check_ingestion_health())
        finally:
            loop.close()
    except Exception as exc:
        # Health check itself must never raise — log and swallow
        logger.error("check_ingestion_health task failed unexpectedly: %s", exc)


async def _check_ingestion_health() -> None:
    try:
        from sqlalchemy import select, text
        from app.db.session import AsyncSessionLocal
        from app.models.regulatory_source import RegulatorySource
        from app.services.audit import write as audit_write

        async with AsyncSessionLocal() as session:
            # Find sources that are active but haven't been checked in 6+ hours
            result = await session.execute(
                select(RegulatorySource).where(
                    RegulatorySource.is_active.is_(True),
                    (RegulatorySource.last_checked_at < text("NOW() - INTERVAL '6 hours'"))
                    | RegulatorySource.last_checked_at.is_(None),
                )
            )
            stale_sources = result.scalars().all()

        for source in stale_sources:
            last_checked_str = (
                source.last_checked_at.isoformat() if source.last_checked_at else "never"
            )
            logger.error(
                "Ingestion health check FAILED: %s has not been checked in 6+ hours "
                "(last_checked_at=%s, slug=%s)",
                source.name,
                last_checked_str,
                source.slug,
            )

            # Fire-and-forget audit log write — never raises
            await audit_write(
                user_id=None,
                event_type="ingestion_stale",
                entity_type="regulatory_source",
                entity_id=source.id,
                entity_title=source.name,
                metadata={
                    "last_checked_at": last_checked_str,
                    "source_slug": source.slug,
                },
            )

        if not stale_sources:
            logger.info("Ingestion health check passed — all sources are current")

    except Exception as exc:
        logger.error("_check_ingestion_health inner logic failed (non-fatal): %s", exc)
