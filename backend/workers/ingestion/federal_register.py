"""
Federal Register ingester.
Uses the Federal Register REST API at https://www.federalregister.gov/api/v1/
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.schemas.documents import RawDocumentCreate
from workers.celery_app import celery_app
from workers.ingestion.base import BaseIngester

logger = logging.getLogger(__name__)

API_BASE = "https://www.federalregister.gov/api/v1"
DOCUMENT_TYPES = ["RULE", "PRORULE", "NOTICE", "PRESDOCU"]

DOC_TYPE_MAP = {
    "RULE": "final_rule",
    "PRORULE": "proposed_rule",
    "PROPOSED RULE": "proposed_rule",
    "NOTICE": "guidance",
    "PRESDOCU": "guidance",
    "PRESIDENTIAL DOCUMENT": "guidance",
}

FIELDS = [
    "document_number",
    "title",
    "type",
    "publication_date",
    "html_url",
    "abstract",
    "action",
    "agencies",
    "effective_on",
    "comments_close_on",
    "full_text_xml_url",
    "body_html_url",
]


class FederalRegisterIngester(BaseIngester):
    source_slug = "federal-register"

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=30))
    async def _fetch_page(
        self,
        client: httpx.AsyncClient,
        page: int,
        since_date: str,
    ) -> dict[str, Any]:
        # Build params as list of tuples to handle multi-value keys correctly
        params: list[tuple[str, str]] = [
            ("per_page", "100"),
            ("page", str(page)),
            ("order", "newest"),
            ("conditions[publication_date][gte]", since_date),
        ]
        for field in FIELDS:
            params.append(("fields[]", field))
        for doc_type in DOCUMENT_TYPES:
            params.append(("conditions[type][]", doc_type))

        response = await client.get(f"{API_BASE}/documents.json", params=params, timeout=30)
        response.raise_for_status()
        return response.json()

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=15))
    async def _fetch_full_text(self, client: httpx.AsyncClient, url: str) -> str | None:
        try:
            response = await client.get(url, timeout=30)
            if response.status_code == 200:
                return response.text[:50000]  # cap at 50k chars
        except Exception as e:
            logger.debug(f"Failed to fetch full text from {url}: {e}")
        return None

    async def fetch_new_documents(self, since: datetime | None) -> list[RawDocumentCreate]:
        # Default: go back 7 days if no last_checked_at
        if since is None:
            since = datetime.now(timezone.utc) - timedelta(days=7)

        since_date = since.strftime("%Y-%m-%d")
        documents: list[RawDocumentCreate] = []

        async with httpx.AsyncClient(
            headers={"User-Agent": "Donna-Regulatory-Intelligence/1.0 (contact@donnaplatform.com)"},
            follow_redirects=True,
        ) as client:
            page = 1
            while True:
                try:
                    data = await self._fetch_page(client, page, since_date)
                except Exception as e:
                    logger.error(f"Failed to fetch page {page}: {e}")
                    break

                results = data.get("results", [])
                if not results:
                    break

                for item in results:
                    doc_url = item.get("html_url", "")
                    if not doc_url:
                        continue

                    # Try to get full text
                    full_text = item.get("abstract", "")
                    xml_url = item.get("full_text_xml_url")
                    if xml_url and not full_text:
                        fetched = await self._fetch_full_text(client, xml_url)
                        if fetched:
                            full_text = fetched

                    # Parse published_at
                    published_at = None
                    pub_date_str = item.get("publication_date")
                    if pub_date_str:
                        try:
                            published_at = datetime.strptime(pub_date_str, "%Y-%m-%d").replace(
                                tzinfo=timezone.utc
                            )
                        except ValueError:
                            pass

                    raw_type = item.get("type", "NOTICE")
                    doc_type = DOC_TYPE_MAP.get(raw_type.upper(), "guidance")

                    metadata: dict[str, Any] = {
                        "document_number": item.get("document_number"),
                        "type": raw_type,
                        "agencies": item.get("agencies", []),
                        "action": item.get("action"),
                        "effective_on": item.get("effective_on"),
                        "comment_date": item.get("comments_close_on"),
                        "body_html_url": item.get("body_html_url"),
                    }

                    documents.append(
                        RawDocumentCreate(
                            source_id=None,  # filled by base.run()
                            external_id=item.get("document_number"),
                            title=item.get("title", "Untitled"),
                            full_text=full_text or None,
                            document_url=doc_url,
                            document_type=doc_type,
                            published_at=published_at,
                            raw_metadata=metadata,
                        )
                    )

                # Check pagination
                total_pages = data.get("total_pages", 1)
                if page >= total_pages or page >= 10:  # cap at 10 pages per run
                    break
                page += 1

        logger.info(f"Federal Register: collected {len(documents)} documents since {since_date}")
        return documents


# Celery task
ingester = FederalRegisterIngester()


@celery_app.task(
    name="workers.ingestion.federal_register.run",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def run(self):
    import asyncio
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(_run_with_health_check())
        finally:
            loop.close()
        return result
    except Exception as exc:
        logger.error(f"Federal Register ingestion failed: {exc}")
        raise self.retry(exc=exc)


async def _run_with_health_check() -> dict:
    from sqlalchemy import select
    from app.db.session import AsyncSessionLocal
    from app.models.regulatory_source import RegulatorySource

    # Snapshot last_checked_at before the run so we can compare afterwards
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(RegulatorySource).where(RegulatorySource.slug == ingester.source_slug)
        )
        source = result.scalar_one_or_none()
        last_checked_before = source.last_checked_at if source else None

    count = await ingester.run()

    # Warn if no new documents were found and the source was already stale for 6+ hours
    if count == 0 and last_checked_before is not None:
        stale_threshold = datetime.now(timezone.utc) - timedelta(hours=6)
        if last_checked_before < stale_threshold:
            logger.warning(
                "Federal Register: No new documents in 6+ hours "
                "(last_checked_at=%s, threshold=%s)",
                last_checked_before.isoformat(),
                stale_threshold.isoformat(),
            )

    return {"inserted": count}
