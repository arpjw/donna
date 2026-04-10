import asyncio
import datetime
import logging
from sqlalchemy import select, and_
from app.db.session import AsyncSessionLocal
from app.models.relevance_mapping import RelevanceMapping
from app.models.regulatory_change import RegulatoryChange
from app.models.processed_document import ProcessedDocument
from app.models.calendar_event import CalendarEvent
import app.models  # noqa

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backfill_calendar")

LABEL_MAP = {
    "comment": "comment_deadline",
    "effective": "effective_date",
    "filing": "filing_deadline",
}

async def backfill():
    async with AsyncSessionLocal() as session:
        mappings_result = await session.execute(select(RelevanceMapping))
        mappings = mappings_result.scalars().all()
        logger.info(f"Processing {len(mappings)} relevance mappings")

        created = 0
        skipped = 0

        for mapping in mappings:
            change_result = await session.execute(
                select(RegulatoryChange).where(RegulatoryChange.id == mapping.regulatory_change_id)
            )
            change = change_result.scalar_one_or_none()
            if not change:
                continue

            proc_result = await session.execute(
                select(ProcessedDocument).where(ProcessedDocument.id == change.processed_document_id)
            )
            proc = proc_result.scalar_one_or_none()
            if not proc or not proc.key_dates:
                continue

            for kd in proc.key_dates:
                label = (kd.get("label") or "").lower()
                date_str = kd.get("date")
                if not date_str:
                    continue
                try:
                    event_date = datetime.date.fromisoformat(date_str)
                except ValueError:
                    continue

                event_type = next((v for k, v in LABEL_MAP.items() if k in label), "review_date")

                existing = await session.execute(
                    select(CalendarEvent).where(and_(
                        CalendarEvent.user_id == mapping.user_id,
                        CalendarEvent.processed_document_id == change.processed_document_id,
                        CalendarEvent.event_type == event_type,
                        CalendarEvent.date == event_date,
                    ))
                )
                if existing.scalar_one_or_none():
                    skipped += 1
                    continue

                session.add(CalendarEvent(
                    user_id=mapping.user_id,
                    regulatory_change_id=change.id,
                    processed_document_id=change.processed_document_id,
                    title=f"{kd.get('label', 'Key Date')}: {change.headline[:100]}",
                    event_type=event_type,
                    date=event_date,
                    is_user_created=False,
                ))
                created += 1

        await session.commit()
        logger.info(f"Done — created {created} calendar events, skipped {skipped} duplicates")

if __name__ == "__main__":
    asyncio.run(backfill())
