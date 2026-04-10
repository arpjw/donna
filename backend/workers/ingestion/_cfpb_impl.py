"""
CFPB ingester implementation.
Scrapes CFPB rules, enforcement actions, and newsroom.
"""
import logging
from datetime import datetime, timezone, timedelta
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

from workers.ingestion.base import BaseIngester
from app.schemas.documents import RawDocumentCreate

logger = logging.getLogger(__name__)

CFPB_BASE = "https://www.consumerfinance.gov"
CFPB_RULES_FINAL = "/rules-policy/final-rules/"
CFPB_RULES_PROPOSED = "/rules-policy/rules-under-development/"
CFPB_NEWSROOM = "/about-us/newsroom/"

HEADERS = {
    "User-Agent": "donna-platform contact@donnaplatform.dev",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


class CFPBIngester(BaseIngester):
    source_slug = "cfpb"

    async def fetch_new_documents(self, since: datetime | None = None) -> list[RawDocumentCreate]:
        documents = []
        if since and since.tzinfo is None:
            since = since.replace(tzinfo=timezone.utc)
        cutoff = since if since else datetime.now(timezone.utc) - timedelta(days=90)

        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            # 1. Final rules
            final_rules = await self._scrape_rules_page(client, CFPB_RULES_FINAL, "final_rule", cutoff)
            documents.extend(final_rules)

            # 2. Rules under development (proposed)
            proposed_rules = await self._scrape_rules_page(client, CFPB_RULES_PROPOSED, "proposed_rule", cutoff)
            documents.extend(proposed_rules)

            # 3. Newsroom
            newsroom_items = await self._scrape_newsroom(client, cutoff)
            documents.extend(newsroom_items)

        logger.info(f"CFPB: found {len(documents)} documents")
        return documents

    async def _scrape_rules_page(
        self,
        client: httpx.AsyncClient,
        path: str,
        doc_type: str,
        cutoff: datetime,
    ) -> list[RawDocumentCreate]:
        docs = []
        try:
            resp = await client.get(f"{CFPB_BASE}{path}", headers=HEADERS)
            if resp.status_code != 200:
                logger.warning(f"CFPB {path} returned {resp.status_code}")
                return docs

            soup = BeautifulSoup(resp.text, "lxml")
            # CFPB uses various list structures; try common patterns
            items = (
                soup.select("article.o-post-preview") or
                soup.select(".o-filterable-list-item") or
                soup.select("li.o-post-preview") or
                soup.select("div[class*='preview']")
            )

            for item in items[:30]:
                title_el = item.select_one("h2, h3, .o-post-preview__content-title, a[class*='title']")
                link_el = item.select_one("a[href]")
                date_el = item.select_one("time, .o-post-preview__content-date, [class*='date']")
                excerpt_el = item.select_one("p, .o-post-preview__content-description")

                title = title_el.get_text(strip=True) if title_el else "CFPB Rule"
                href = link_el.get("href", "") if link_el else ""
                url = urljoin(CFPB_BASE, href) if href else ""
                excerpt = excerpt_el.get_text(strip=True) if excerpt_el else ""

                if not url:
                    continue

                pub_at = None
                if date_el:
                    date_str = date_el.get("datetime") or date_el.get_text(strip=True)
                    try:
                        pub_at = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                    except ValueError:
                        try:
                            from dateutil import parser as dateparser
                            pub_at = dateparser.parse(date_str)
                            if pub_at and pub_at.tzinfo is None:
                                pub_at = pub_at.replace(tzinfo=timezone.utc)
                        except Exception:
                            pass

                if pub_at and pub_at.tzinfo is None:
                    pub_at = pub_at.replace(tzinfo=timezone.utc)
                if pub_at and pub_at < cutoff:
                    continue

                docs.append(RawDocumentCreate(
                    title=title[:500],
                    full_text=excerpt,
                    document_url=url,
                    document_type=doc_type,
                    published_at=pub_at,
                    raw_metadata={"source": "cfpb_rules", "path": path},
                ))

        except Exception as e:
            logger.error(f"CFPB rules scrape failed for {path}: {e}")

        return docs

    async def _scrape_newsroom(
        self,
        client: httpx.AsyncClient,
        cutoff: datetime,
    ) -> list[RawDocumentCreate]:
        docs = []
        try:
            resp = await client.get(f"{CFPB_BASE}{CFPB_NEWSROOM}", headers=HEADERS)
            if resp.status_code != 200:
                logger.warning(f"CFPB newsroom returned {resp.status_code}")
                return docs

            soup = BeautifulSoup(resp.text, "lxml")
            items = (
                soup.select("article.o-post-preview") or
                soup.select(".o-filterable-list-item") or
                soup.select("li.o-post-preview")
            )

            for item in items[:30]:
                title_el = item.select_one("h2, h3, .o-post-preview__content-title")
                link_el = item.select_one("a[href]")
                date_el = item.select_one("time, .o-post-preview__content-date")
                excerpt_el = item.select_one("p, .o-post-preview__content-description")

                title = title_el.get_text(strip=True) if title_el else "CFPB News"
                href = link_el.get("href", "") if link_el else ""
                url = urljoin(CFPB_BASE, href) if href else ""
                excerpt = excerpt_el.get_text(strip=True) if excerpt_el else ""

                if not url:
                    continue

                pub_at = None
                if date_el:
                    date_str = date_el.get("datetime") or date_el.get_text(strip=True)
                    try:
                        pub_at = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                    except ValueError:
                        try:
                            from dateutil import parser as dateparser
                            pub_at = dateparser.parse(date_str)
                            if pub_at and pub_at.tzinfo is None:
                                pub_at = pub_at.replace(tzinfo=timezone.utc)
                        except Exception:
                            pass

                if pub_at and pub_at.tzinfo is None:
                    pub_at = pub_at.replace(tzinfo=timezone.utc)
                if pub_at and pub_at < cutoff:
                    continue

                # Classify based on content
                title_lower = title.lower()
                if any(w in title_lower for w in ["enforcement", "action", "fine", "penalty", "charges"]):
                    doc_type = "enforcement_action"
                elif any(w in title_lower for w in ["rule", "regulation", "rulemaking"]):
                    doc_type = "guidance_update"
                else:
                    doc_type = "guidance"

                docs.append(RawDocumentCreate(
                    title=title[:500],
                    full_text=excerpt,
                    document_url=url,
                    document_type=doc_type,
                    published_at=pub_at,
                    raw_metadata={"source": "cfpb_newsroom"},
                ))

        except Exception as e:
            logger.error(f"CFPB newsroom scrape failed: {e}")

        return docs
