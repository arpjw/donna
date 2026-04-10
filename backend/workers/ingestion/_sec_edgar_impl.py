"""
SEC EDGAR ingester implementation.
Targets enforcement releases, press releases, and key form types.
"""
import logging
from datetime import datetime, timezone, timedelta
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

from workers.ingestion.base import BaseIngester
from app.schemas.documents import RawDocumentCreate

logger = logging.getLogger(__name__)

SEC_BASE = "https://www.sec.gov"
EDGAR_SEARCH_URL = "https://efts.sec.gov/LATEST/search-index"
SEC_LITIGATION_URL = "https://www.sec.gov/litigation/litreleases/"

HEADERS = {"User-Agent": "donna-platform contact@donnaplatform.dev"}

# Key form types to monitor
FORM_TYPES = ["8-K", "6-K", "10-K", "S-1"]


class SECEdgarIngester(BaseIngester):
    source_slug = "sec-edgar"

    async def fetch_new_documents(self, since: datetime | None = None) -> list[RawDocumentCreate]:
        documents = []
        if since and since.tzinfo is None:
            since = since.replace(tzinfo=timezone.utc)
        cutoff = since if since else datetime.now(timezone.utc) - timedelta(days=14)

        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            # 1. Fetch key EDGAR filings via full-text search
            filing_docs = await self._fetch_edgar_filings(client, cutoff)
            documents.extend(filing_docs)

            # 2. Scrape litigation releases page
            lit_docs = await self._scrape_litigation_releases(client, cutoff)
            documents.extend(lit_docs)

        logger.info(f"SEC EDGAR: found {len(documents)} documents")
        return documents

    async def _fetch_edgar_filings(
        self, client: httpx.AsyncClient, cutoff: datetime
    ) -> list[RawDocumentCreate]:
        """Fetch recent 8-K and other filings from EDGAR full-text search."""
        docs = []
        try:
            start_dt = cutoff.strftime("%Y-%m-%d")
            end_dt = datetime.now(timezone.utc).strftime("%Y-%m-%d")

            resp = await client.get(
                EDGAR_SEARCH_URL,
                params={
                    "q": "regulation compliance enforcement",
                    "dateRange": "custom",
                    "startdt": start_dt,
                    "enddt": end_dt,
                    "forms": "8-K",
                },
                headers=HEADERS,
            )
            if resp.status_code != 200:
                logger.warning(f"EDGAR search returned {resp.status_code}")
                return docs

            data = resp.json()
            hits = data.get("hits", {}).get("hits", [])

            for item in hits[:30]:
                source = item.get("_source", {})
                adsh = source.get("adsh", "")
                file_date = source.get("file_date", "")
                ciks = source.get("ciks", [])
                display_names = source.get("display_names", [])
                form = source.get("form", "8-K")

                if not adsh or not ciks:
                    continue

                try:
                    pub_at = datetime.strptime(file_date, "%Y-%m-%d").replace(tzinfo=timezone.utc) if file_date else None
                except ValueError:
                    pub_at = None

                if pub_at and pub_at < cutoff:
                    continue

                # Build EDGAR filing index URL
                cik = ciks[0].lstrip("0")
                adsh_clean = adsh.replace("-", "")
                url = f"{SEC_BASE}/Archives/edgar/data/{cik}/{adsh_clean}/{adsh}-index.htm"

                entity = display_names[0].split("(")[0].strip() if display_names else "SEC Registrant"
                title = f"{entity} — {form} Filing ({file_date})"

                docs.append(RawDocumentCreate(
                    external_id=adsh,
                    title=title[:500],
                    full_text=f"{form} filing by {entity}. Filed: {file_date}.",
                    document_url=url,
                    document_type="guidance",
                    published_at=pub_at,
                    raw_metadata={
                        "source": "sec_edgar",
                        "form": form,
                        "adsh": adsh,
                        "entity": entity,
                        "cik": cik,
                    },
                ))

        except Exception as e:
            logger.error(f"EDGAR filings fetch failed: {e}")

        return docs

    async def _scrape_litigation_releases(
        self, client: httpx.AsyncClient, cutoff: datetime
    ) -> list[RawDocumentCreate]:
        """Scrape SEC litigation releases page for enforcement actions."""
        docs = []
        try:
            resp = await client.get(SEC_LITIGATION_URL, headers=HEADERS)
            if resp.status_code != 200:
                logger.warning(f"SEC litigation releases returned {resp.status_code}")
                return docs

            soup = BeautifulSoup(resp.text, "lxml")
            rows = soup.select("table tr")[1:]  # skip header row

            for row in rows[:50]:
                cols = row.find_all("td")
                if len(cols) < 2:
                    continue

                date_text = cols[0].get_text(strip=True)
                content_col = cols[1]
                links = content_col.find_all("a")
                raw_title = content_col.get_text(strip=True)

                # Parse date
                pub_at = None
                try:
                    pub_at = datetime.strptime(date_text, "%B %d, %Y").replace(tzinfo=timezone.utc)
                except ValueError:
                    try:
                        pub_at = datetime.strptime(date_text, "%B %Y").replace(tzinfo=timezone.utc)
                    except ValueError:
                        pass

                if pub_at and pub_at < cutoff:
                    break  # Releases are newest-first; stop when we hit the cutoff

                # Get the main link
                href = links[0].get("href", "") if links else ""
                url = urljoin(SEC_BASE, href) if href else ""
                if not url:
                    continue

                # Extract release number and clean title
                title = raw_title
                # Try to get just the respondent name before "Release No."
                if "Release No." in raw_title:
                    title = raw_title.split("Release No.")[0].strip()
                    release_no = raw_title.split("Release No.")[1].split("See")[0].strip()
                    title = f"SEC Litigation Release: {title} ({release_no.strip()})"
                else:
                    title = f"SEC Litigation Release: {title[:200]}"

                docs.append(RawDocumentCreate(
                    title=title[:500],
                    full_text=raw_title,
                    document_url=url,
                    document_type="enforcement_action",
                    published_at=pub_at,
                    raw_metadata={
                        "source": "sec_litigation_releases",
                        "date": date_text,
                    },
                ))

        except Exception as e:
            logger.error(f"SEC litigation releases scrape failed: {e}")

        return docs
