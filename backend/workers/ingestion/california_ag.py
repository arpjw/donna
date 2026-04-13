"""
California Attorney General ingester.
Scrapes press releases from https://oag.ca.gov/news using httpx + BeautifulSoup.
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import Any

import httpx
from bs4 import BeautifulSoup
from tenacity import retry, stop_after_attempt, wait_exponential

from app.schemas.documents import RawDocumentCreate
from workers.celery_app import celery_app
from workers.ingestion.base import BaseIngester

logger = logging.getLogger(__name__)

SOURCE_URL = "https://oag.ca.gov/news"
DEFAULT_LOOKBACK_DAYS = 30

# Date formats seen on the CA AG news page
DATE_FORMATS = [
    "%B %d, %Y",   # January 15, 2026
    "%b %d, %Y",   # Jan 15, 2026
    "%m/%d/%Y",    # 01/15/2026
    "%Y-%m-%d",    # 2026-01-15
]


def _parse_date(date_str: str) -> datetime | None:
    """Try multiple date formats; return UTC datetime or None."""
    if not date_str:
        return None
    date_str = date_str.strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(date_str, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


class CaliforniaAGIngester(BaseIngester):
    source_slug = "california-ag"

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=30))
    async def _fetch_page(self, client: httpx.AsyncClient, page: int = 0) -> str:
        params = {"page": page} if page > 0 else {}
        response = await client.get(SOURCE_URL, params=params, timeout=30)
        response.raise_for_status()
        return response.text

    async def fetch_new_documents(self, since: datetime | None) -> list[RawDocumentCreate]:
        if since is None:
            since = datetime.now(timezone.utc) - timedelta(days=DEFAULT_LOOKBACK_DAYS)

        documents: list[RawDocumentCreate] = []
        seen_urls: set[str] = set()

        async with httpx.AsyncClient(
            headers={
                "User-Agent": "Donna-Regulatory-Intelligence/1.0 (contact@donnaplatform.com)",
                "Accept": "text/html,application/xhtml+xml",
            },
            follow_redirects=True,
        ) as client:
            page = 0
            while True:
                try:
                    html = await self._fetch_page(client, page)
                except Exception as e:
                    logger.error(f"California AG: failed to fetch page {page}: {e}")
                    break

                soup = BeautifulSoup(html, "lxml")
                page_docs, stop_early = self._parse_press_releases(soup, since, seen_urls)
                documents.extend(page_docs)

                if stop_early or not page_docs:
                    break

                # Check for a "next page" link; stop if none found
                next_link = soup.find("a", string=lambda t: t and "next" in t.lower())
                if not next_link:
                    # Try pagination nav
                    pager_next = soup.select_one("li.pager__item--next a, .next a")
                    if not pager_next:
                        break

                page += 1
                if page > 20:  # safety cap
                    break

        logger.info(f"California AG: collected {len(documents)} documents since {since.date()}")
        return documents

    def _parse_press_releases(
        self,
        soup: BeautifulSoup,
        since: datetime,
        seen_urls: set[str],
    ) -> tuple[list[RawDocumentCreate], bool]:
        """Parse press release items from a news page. Returns (docs, stop_early)."""
        documents: list[RawDocumentCreate] = []
        stop_early = False

        # CA AG news page uses article elements or list items with view-rows
        items = (
            soup.select("article")
            or soup.select(".views-row")
            or soup.select(".view-content .views-row")
            or soup.select("li.views-row")
        )

        if not items:
            # Fallback: look for any <a> links inside the main content area
            content = soup.select_one("main, #main-content, .view-content, #content")
            if content:
                items = content.find_all("li") or content.find_all("div", class_=lambda c: c and "row" in c)

        for item in items:
            # Extract link and title
            link_el = item.find("a", href=True)
            if not link_el:
                continue

            href = link_el.get("href", "").strip()
            if not href:
                continue
            if href.startswith("/"):
                href = f"https://oag.ca.gov{href}"
            if not href.startswith("http"):
                continue
            if href in seen_urls:
                continue

            title = link_el.get_text(strip=True) or "Untitled"

            # Extract date — look for <time>, a date field, or text near the link
            published_at: datetime | None = None
            time_el = item.find("time")
            if time_el:
                dt_attr = time_el.get("datetime", "")
                published_at = _parse_date(dt_attr) or _parse_date(time_el.get_text(strip=True))

            if not published_at:
                # Look for spans/divs that often carry dates
                for cls in ["date-display-single", "field--name-field-date", "views-field-created", "date"]:
                    date_el = item.find(class_=cls)
                    if date_el:
                        published_at = _parse_date(date_el.get_text(strip=True))
                        if published_at:
                            break

            # Skip docs older than `since`
            if published_at and published_at < since:
                stop_early = True
                continue

            seen_urls.add(href)

            metadata: dict[str, Any] = {
                "source_page": SOURCE_URL,
                "scraped_title": title,
            }
            if published_at:
                metadata["raw_date"] = published_at.isoformat()

            documents.append(
                RawDocumentCreate(
                    source_id=None,
                    external_id=None,
                    title=title,
                    full_text=None,
                    document_url=href,
                    document_type="enforcement_action",
                    published_at=published_at,
                    raw_metadata=metadata,
                )
            )

        return documents, stop_early


# Celery task
ingester = CaliforniaAGIngester()


@celery_app.task(
    name="workers.ingestion.california_ag.run",
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
            count = loop.run_until_complete(ingester.run())
        finally:
            loop.close()
        return {"inserted": count}
    except Exception as exc:
        logger.error(f"California AG ingestion failed: {exc}")
        raise self.retry(exc=exc)
