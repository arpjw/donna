"""
Seed regulatory_sources with Federal Register, SEC EDGAR, CFPB,
and state-level regulatory sources.
"""
import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal

# Import all models to register relationships
from app.models.regulatory_source import RegulatorySource
from app.models.raw_document import RawDocument  # noqa: F401
from app.models.processed_document import ProcessedDocument  # noqa: F401
from app.models.regulatory_change import RegulatoryChange  # noqa: F401
from app.models.user_profile import UserProfile  # noqa: F401
from app.models.relevance_mapping import RelevanceMapping  # noqa: F401
from app.models.alert import Alert  # noqa: F401
from app.models.digest import Digest  # noqa: F401

SOURCES = [
    # Federal sources
    {
        "name": "Federal Register",
        "slug": "federal-register",
        "base_url": "https://www.federalregister.gov",
        "feed_url": "https://www.federalregister.gov/api/v1/documents",
        "scrape_cadence_minutes": 240,
        "jurisdiction": "federal",
        "category": "rulemaking",
    },
    {
        "name": "SEC EDGAR",
        "slug": "sec-edgar",
        "base_url": "https://www.sec.gov",
        "feed_url": "https://efts.sec.gov/LATEST/search-index",
        "scrape_cadence_minutes": 120,
        "jurisdiction": "federal",
        "category": "securities",
    },
    {
        "name": "CFPB",
        "slug": "cfpb",
        "base_url": "https://www.consumerfinance.gov",
        "feed_url": "https://www.consumerfinance.gov/rules-policy/final-rules/",
        "scrape_cadence_minutes": 720,
        "jurisdiction": "federal",
        "category": "consumer_finance",
    },
    {
        "name": "FDIC",
        "slug": "fdic",
        "base_url": "https://www.fdic.gov",
        "feed_url": "https://www.fdic.gov/news/financial-institution-letters/",
        "scrape_cadence_minutes": 480,
        "jurisdiction": "federal",
        "category": "banking",
    },
    {
        "name": "OCC",
        "slug": "occ",
        "base_url": "https://www.occ.gov",
        "feed_url": "https://www.occ.gov/news-issuances/bulletins/",
        "scrape_cadence_minutes": 480,
        "jurisdiction": "federal",
        "category": "banking",
    },
    {
        "name": "FTC",
        "slug": "ftc",
        "base_url": "https://www.ftc.gov",
        "feed_url": "https://www.ftc.gov/news-events/news/press-releases",
        "scrape_cadence_minutes": 240,
        "jurisdiction": "federal",
        "category": "antitrust_consumer",
    },
    # State-level sources
    {
        "name": "California DFPI",
        "slug": "ca-dfpi",
        "base_url": "https://dfpi.ca.gov",
        "feed_url": "https://dfpi.ca.gov/newsroom/",
        "scrape_cadence_minutes": 1440,
        "jurisdiction": "CA",
        "category": "financial_regulation",
    },
    {
        "name": "New York DFS",
        "slug": "ny-dfs",
        "base_url": "https://www.dfs.ny.gov",
        "feed_url": "https://www.dfs.ny.gov/reports_and_publications",
        "scrape_cadence_minutes": 1440,
        "jurisdiction": "NY",
        "category": "financial_regulation",
    },
    {
        "name": "Texas Department of Banking",
        "slug": "tx-dob",
        "base_url": "https://www.dob.texas.gov",
        "feed_url": "https://www.dob.texas.gov/public/news",
        "scrape_cadence_minutes": 1440,
        "jurisdiction": "TX",
        "category": "banking",
    },
    {
        "name": "Illinois IDFPR",
        "slug": "il-idfpr",
        "base_url": "https://idfpr.illinois.gov",
        "feed_url": "https://idfpr.illinois.gov/newsroom/",
        "scrape_cadence_minutes": 2880,
        "jurisdiction": "IL",
        "category": "financial_regulation",
    },
    {
        "name": "Massachusetts Division of Banks",
        "slug": "ma-dob",
        "base_url": "https://www.mass.gov/orgs/division-of-banks",
        "feed_url": "https://www.mass.gov/orgs/division-of-banks/news",
        "scrape_cadence_minutes": 2880,
        "jurisdiction": "MA",
        "category": "banking",
    },
]


async def seed_sources() -> None:
    async with AsyncSessionLocal() as session:
        inserted = 0
        skipped = 0
        for source_data in SOURCES:
            result = await session.execute(
                select(RegulatorySource).where(RegulatorySource.slug == source_data["slug"])
            )
            existing = result.scalar_one_or_none()
            if existing:
                skipped += 1
                continue

            source = RegulatorySource(**source_data)
            session.add(source)
            inserted += 1

        await session.commit()
        print(f"Seeded {inserted} sources, skipped {skipped} existing.")


if __name__ == "__main__":
    asyncio.run(seed_sources())
