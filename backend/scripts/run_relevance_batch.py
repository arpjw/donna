"""
Run relevance scoring for all regulatory changes against all users.
Run with: docker exec donna-backend-1 python3 scripts/run_relevance_batch.py
"""
import asyncio
import sys
import os
sys.path.insert(0, "/app")
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://donna:donna@postgres:5432/donna")

import app.models  # noqa


async def main():
    from sqlalchemy import select, func
    from sqlalchemy.dialects.postgresql import insert as pg_insert
    from app.db.session import AsyncSessionLocal
    from app.models.regulatory_change import RegulatoryChange
    from app.models.processed_document import ProcessedDocument
    from app.models.user_profile import UserProfile
    from app.models.relevance_mapping import RelevanceMapping
    from workers.relevance.scorer import _compute_relevance
    from app.services.embeddings import embed_text

    async with AsyncSessionLocal() as db:
        # Load all users
        users = (await db.execute(select(UserProfile))).scalars().all()
        if not users:
            print("No users found. Run create_test_user.py first.")
            return

        print(f"Scoring for {len(users)} user(s)...")

        # Load all changes with their processed docs
        changes_result = await db.execute(
            select(RegulatoryChange, ProcessedDocument)
            .join(ProcessedDocument, ProcessedDocument.id == RegulatoryChange.processed_document_id)
            .order_by(RegulatoryChange.created_at.desc())
        )
        rows = changes_result.all()
        print(f"Scoring {len(rows)} changes...")

        total_mappings = 0
        batch = []

        for i, (change, proc) in enumerate(rows):
            for user in users:
                score, reasoning, signals = await _compute_relevance(user, change, proc, embed_text)
                if score >= 0.5:
                    batch.append({
                        "user_id": user.id,
                        "regulatory_change_id": change.id,
                        "relevance_score": score,
                        "relevance_reasoning": reasoning,
                        "match_signals": signals,
                    })
                    total_mappings += 1

            # Commit in batches of 100
            if len(batch) >= 100:
                stmt = pg_insert(RelevanceMapping).values(batch).on_conflict_do_update(
                    constraint="uq_relevance_mappings_user_change",
                    set_={
                        "relevance_score": pg_insert(RelevanceMapping).excluded.relevance_score,
                        "relevance_reasoning": pg_insert(RelevanceMapping).excluded.relevance_reasoning,
                        "match_signals": pg_insert(RelevanceMapping).excluded.match_signals,
                    },
                )
                await db.execute(stmt)
                await db.commit()
                batch = []

            if (i + 1) % 50 == 0:
                print(f"  Processed {i + 1}/{len(rows)} changes, {total_mappings} mappings so far...")

        # Final batch
        if batch:
            stmt = pg_insert(RelevanceMapping).values(batch).on_conflict_do_update(
                constraint="uq_relevance_mappings_user_change",
                set_={
                    "relevance_score": pg_insert(RelevanceMapping).excluded.relevance_score,
                    "relevance_reasoning": pg_insert(RelevanceMapping).excluded.relevance_reasoning,
                    "match_signals": pg_insert(RelevanceMapping).excluded.match_signals,
                },
            )
            await db.execute(stmt)
            await db.commit()

        final_count = (await db.execute(
            select(func.count()).select_from(RelevanceMapping)
        )).scalar()
        print(f"\nDone. Total relevance_mappings in DB: {final_count}")
        print(f"Relevant changes for users: {total_mappings}")


asyncio.run(main())
