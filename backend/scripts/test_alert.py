"""
Test alert sending for the test user.
Sends one real alert email via Resend.
Run with: docker exec donna-backend-1 python3 scripts/test_alert.py
"""
import asyncio
import sys
import os
sys.path.insert(0, "/app")
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://donna:donna@postgres:5432/donna")

import app.models  # noqa


async def main():
    from sqlalchemy import select
    from app.db.session import AsyncSessionLocal
    from app.models.user_profile import UserProfile
    from app.models.relevance_mapping import RelevanceMapping
    from app.models.regulatory_change import RegulatoryChange
    from workers.delivery.alert_sender import _send_alert

    async with AsyncSessionLocal() as db:
        user = (await db.execute(
            select(UserProfile).where(UserProfile.clerk_user_id == "test_user_001")
        )).scalar_one_or_none()

        if not user:
            print("Test user not found. Run create_test_user.py first.")
            return

        print(f"Sending test alert to: {user.email}")

        # Get the highest-relevance change for this user
        rm = (await db.execute(
            select(RelevanceMapping)
            .where(RelevanceMapping.user_id == user.id)
            .order_by(RelevanceMapping.relevance_score.desc())
            .limit(1)
        )).scalar_one_or_none()

        if not rm:
            print("No relevance mappings found. Run run_relevance_batch.py first.")
            return

        change = (await db.execute(
            select(RegulatoryChange).where(RegulatoryChange.id == rm.regulatory_change_id)
        )).scalar_one_or_none()

        print(f"Using change: {change.headline[:80]}...")
        print(f"Relevance score: {rm.relevance_score:.3f}")

    # Run alert sender
    await _send_alert(str(user.id), str(rm.regulatory_change_id))
    print("Alert send attempted. Check logs above for status.")


asyncio.run(main())
