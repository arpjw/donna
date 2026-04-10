"""
Test digest assembly and sending for the test user.
Run with: docker exec donna-backend-1 python3 scripts/test_digest.py
"""
import asyncio
import sys
import os
sys.path.insert(0, "/app")
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://donna:donna@postgres:5432/donna")

import app.models  # noqa


async def main():
    from sqlalchemy import select
    from datetime import datetime, timezone, timedelta
    from app.db.session import AsyncSessionLocal
    from app.models.user_profile import UserProfile
    from app.models.relevance_mapping import RelevanceMapping
    from app.models.regulatory_change import RegulatoryChange
    from app.models.processed_document import ProcessedDocument
    from app.models.digest import Digest
    from app.services.llm import assemble_digest
    from app.services.email import send_email

    async with AsyncSessionLocal() as db:
        user = (await db.execute(
            select(UserProfile).where(UserProfile.clerk_user_id == "test_user_001")
        )).scalar_one_or_none()

        if not user:
            print("Test user not found. Run create_test_user.py first.")
            return

        print(f"Assembling digest for: {user.full_name} ({user.email})")

        # Get top 5 relevance mappings
        mappings = (await db.execute(
            select(RelevanceMapping)
            .where(RelevanceMapping.user_id == user.id)
            .order_by(RelevanceMapping.relevance_score.desc())
            .limit(5)
        )).scalars().all()

        print(f"Using {len(mappings)} changes for digest...")

        # Load changes and docs
        changes_data = []
        for rm in mappings:
            change = (await db.execute(
                select(RegulatoryChange).where(RegulatoryChange.id == rm.regulatory_change_id)
            )).scalar_one_or_none()
            if not change:
                continue
            proc = (await db.execute(
                select(ProcessedDocument).where(ProcessedDocument.id == change.processed_document_id)
            )).scalar_one_or_none()
            if not proc:
                continue
            changes_data.append({
                "headline": change.headline,
                "plain_summary": proc.plain_summary,
                "recommended_actions": proc.recommended_actions or "",
                "key_dates": proc.key_dates or [],
                "impact_level": change.impact_level,
            })

        print("Calling Claude to assemble digest...")
        try:
            assembled = await assemble_digest(
                full_name=user.full_name or "Alex",
                company_name=user.company_name or "Apex Financial Technologies",
                industries=user.industries or [],
                changes=changes_data,
            )
            print("Digest assembled successfully!")
            print(f"Text preview: {assembled['text'][:200]}...")
        except Exception as e:
            print(f"Digest assembly failed (likely API key issue): {e}")
            # Use fallback
            text = f"Weekly digest for {user.company_name}\n\n"
            for cd in changes_data[:3]:
                text += f"- {cd['headline']}\n  {cd['plain_summary']}\n\n"
            assembled = {"text": text, "html": f"<pre>{text}</pre>"}
            print("Using fallback digest content.")

        now = datetime.now(timezone.utc)
        period_start = now - timedelta(days=7)

        success = await send_email(
            to=user.email,
            subject=f"[Donna] Your weekly regulatory briefing — {now.strftime('%B %d, %Y')}",
            html=assembled["html"],
            text=assembled["text"],
        )

        digest = Digest(
            user_id=user.id,
            period_start=period_start,
            period_end=now,
            headline=f"Your weekly regulatory briefing — {now.strftime('%B %d, %Y')}",
            assembled_html=assembled["html"],
            assembled_text=assembled["text"],
            change_ids=[rm.regulatory_change_id for rm in mappings],
            sent_at=now if success else None,
            status="sent" if success else "failed",
        )
        db.add(digest)
        await db.commit()

        print(f"Digest {'sent' if success else 'failed'} and saved to DB (id: {digest.id})")


asyncio.run(main())
