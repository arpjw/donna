"""
CFPB ingester — implemented in Step 19.
"""
import logging
from workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="workers.ingestion.cfpb.run",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def run(self):
    import asyncio
    from workers.ingestion._cfpb_impl import CFPBIngester
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            count = loop.run_until_complete(CFPBIngester().run())
        finally:
            loop.close()
        return {"inserted": count}
    except Exception as exc:
        logger.error(f"CFPB ingestion failed: {exc}")
        raise self.retry(exc=exc)
