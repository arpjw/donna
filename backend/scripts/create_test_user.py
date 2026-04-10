"""
Create a test user profile for relevance scoring and feed testing.
Run with: docker exec donna-backend-1 python3 scripts/create_test_user.py
"""
import asyncio
import sys
import os
sys.path.insert(0, "/app")
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://donna:donna@postgres:5432/donna")

import app.models  # noqa


async def main():
    from sqlalchemy import select
    from sqlalchemy.dialects.postgresql import insert as pg_insert
    from app.db.session import AsyncSessionLocal
    from app.models.user_profile import UserProfile

    async with AsyncSessionLocal() as db:
        # Check if test user already exists
        existing = (await db.execute(
            select(UserProfile).where(UserProfile.clerk_user_id == "test_user_001")
        )).scalar_one_or_none()

        if existing:
            print(f"Test user already exists: {existing.id}")
            print(f"  Industries: {existing.industries}")
            print(f"  Jurisdictions: {existing.jurisdictions}")
            print(f"  Onboarded: {existing.onboarded_at}")
            return

        from datetime import datetime, timezone
        stmt = pg_insert(UserProfile).values(
            clerk_user_id="test_user_001",
            email="test@donnaplatform.dev",
            full_name="Alex Chen",
            company_name="Apex Financial Technologies",
            industries=["fintech", "financial_services"],
            jurisdictions=["federal", "CA", "NY", "TX"],
            alert_threshold="medium",
            digest_cadence="weekly",
            onboarded_at=datetime.now(timezone.utc),
        ).on_conflict_do_nothing(index_elements=["clerk_user_id"])
        await db.execute(stmt)
        await db.commit()

        user = (await db.execute(
            select(UserProfile).where(UserProfile.clerk_user_id == "test_user_001")
        )).scalar_one()
        print(f"Created test user: {user.id}")
        print(f"  Name: {user.full_name} @ {user.company_name}")
        print(f"  Industries: {user.industries}")
        print(f"  Jurisdictions: {user.jurisdictions}")


asyncio.run(main())
