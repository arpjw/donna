"""
Compliance calendar API.

Returns calendar events for the authenticated user, combining:
1. User-created manual events (from calendar_events table)
2. Auto-derived events from key_dates on relevant processed documents

The auto-derived events are upserted into calendar_events when the feed is loaded,
so the frontend only needs to hit this endpoint.
"""
from datetime import date, datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_clerk_user_id
from app.rate_limit import limiter
from app.db.session import get_db
from app.models.calendar_event import CalendarEvent
from app.models.processed_document import ProcessedDocument
from app.models.regulatory_change import RegulatoryChange
from app.models.relevance_mapping import RelevanceMapping
from app.models.user_profile import UserProfile
from app.schemas.responses import (
    CalendarEventCreateRequest,
    CalendarEventOut,
    CalendarEventUpdateRequest,
    RegulatoryChangeOut,
)

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


async def _get_user(clerk_user_id: str, db: AsyncSession) -> UserProfile:
    result = await db.execute(
        select(UserProfile).where(UserProfile.clerk_user_id == clerk_user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")
    return user


async def _sync_key_dates(user: UserProfile, db: AsyncSession) -> None:
    """
    Walk the user's relevance mappings and upsert calendar events for each
    key_date found in the corresponding processed document. Non-fatal.
    """
    try:
        rm_result = await db.execute(
            select(RelevanceMapping).where(RelevanceMapping.user_id == user.id)
        )
        mappings = rm_result.scalars().all()

        for rm in mappings:
            change_result = await db.execute(
                select(RegulatoryChange).where(RegulatoryChange.id == rm.regulatory_change_id)
            )
            change = change_result.scalar_one_or_none()
            if not change:
                continue

            proc_result = await db.execute(
                select(ProcessedDocument).where(ProcessedDocument.id == change.processed_document_id)
            )
            proc = proc_result.scalar_one_or_none()
            if not proc or not proc.key_dates:
                continue

            for kd in proc.key_dates:
                label = kd.get("label", "")
                raw_date = kd.get("date", "")
                if not raw_date:
                    continue
                try:
                    event_date = date.fromisoformat(raw_date)
                except ValueError:
                    continue

                # Derive event_type from label
                label_lower = label.lower()
                if "comment" in label_lower or "deadline" in label_lower:
                    event_type = "comment_deadline"
                elif "effective" in label_lower:
                    event_type = "effective_date"
                elif "compliance" in label_lower:
                    event_type = "compliance_deadline"
                else:
                    event_type = "key_date"

                # Upsert: skip if already exists for this user+doc+label
                existing = await db.execute(
                    select(CalendarEvent).where(
                        CalendarEvent.user_id == user.id,
                        CalendarEvent.processed_document_id == proc.id,
                        CalendarEvent.title == f"{label}: {change.headline}",
                        CalendarEvent.is_user_created == False,  # noqa: E712
                    )
                )
                if existing.scalar_one_or_none():
                    continue

                event = CalendarEvent(
                    user_id=user.id,
                    regulatory_change_id=change.id,
                    processed_document_id=proc.id,
                    title=f"{label}: {change.headline}",
                    event_type=event_type,
                    date=event_date,
                    description=proc.recommended_actions,
                    is_user_created=False,
                )
                db.add(event)

        await db.commit()
    except Exception:
        await db.rollback()


@router.get("", response_model=list[CalendarEventOut])
@limiter.limit("30/minute")
async def list_calendar_events(
    request: Request,
    from_date: date | None = Query(None),
    to_date: date | None = Query(None),
    event_type: str | None = Query(None),
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user(clerk_user_id, db)

    # Sync key_dates from relevant documents into calendar_events
    await _sync_key_dates(user, db)

    filters = [CalendarEvent.user_id == user.id]
    if from_date:
        filters.append(CalendarEvent.date >= from_date)
    if to_date:
        filters.append(CalendarEvent.date <= to_date)
    if event_type:
        filters.append(CalendarEvent.event_type == event_type)

    result = await db.execute(
        select(CalendarEvent, RegulatoryChange)
        .join(RegulatoryChange, CalendarEvent.regulatory_change_id == RegulatoryChange.id, isouter=True)
        .where(and_(*filters))
        .order_by(CalendarEvent.date.asc())
    )
    rows = result.all()

    items = []
    for event, change in rows:
        out = CalendarEventOut.model_validate(event)
        if change:
            out.change = RegulatoryChangeOut.model_validate(change)
        items.append(out)
    return items


@router.post("", response_model=CalendarEventOut, status_code=201)
@limiter.limit("30/minute")
async def create_calendar_event(
    request: Request,
    body: CalendarEventCreateRequest,
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user(clerk_user_id, db)

    event = CalendarEvent(
        user_id=user.id,
        regulatory_change_id=body.regulatory_change_id,
        processed_document_id=body.processed_document_id,
        title=body.title,
        event_type=body.event_type,
        date=body.date,
        description=body.description,
        is_user_created=True,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)

    out = CalendarEventOut.model_validate(event)
    if event.regulatory_change_id:
        change_result = await db.execute(
            select(RegulatoryChange).where(RegulatoryChange.id == event.regulatory_change_id)
        )
        change = change_result.scalar_one_or_none()
        if change:
            out.change = RegulatoryChangeOut.model_validate(change)
    return out


@router.patch("/{event_id}", response_model=CalendarEventOut)
@limiter.limit("30/minute")
async def update_calendar_event(
    request: Request,
    event_id: UUID,
    body: CalendarEventUpdateRequest,
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user(clerk_user_id, db)

    result = await db.execute(
        select(CalendarEvent).where(
            CalendarEvent.id == event_id,
            CalendarEvent.user_id == user.id,
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")

    if body.title is not None:
        event.title = body.title
    if body.event_date is not None:
        event.date = body.event_date
    if body.description is not None:
        event.description = body.description
    if body.event_type is not None:
        event.event_type = body.event_type

    await db.commit()
    await db.refresh(event)

    out = CalendarEventOut.model_validate(event)
    if event.regulatory_change_id:
        change_result = await db.execute(
            select(RegulatoryChange).where(RegulatoryChange.id == event.regulatory_change_id)
        )
        change = change_result.scalar_one_or_none()
        if change:
            out.change = RegulatoryChangeOut.model_validate(change)
    return out


@router.delete("/{event_id}", status_code=204)
@limiter.limit("30/minute")
async def delete_calendar_event(
    request: Request,
    event_id: UUID,
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user(clerk_user_id, db)

    result = await db.execute(
        select(CalendarEvent).where(
            CalendarEvent.id == event_id,
            CalendarEvent.user_id == user.id,
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")

    await db.delete(event)
    await db.commit()
