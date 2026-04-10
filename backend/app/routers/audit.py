"""
Audit trail API.
Provides paginated access to the user's audit log and a CSV export endpoint.
"""
import csv
import io
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_clerk_user_id
from app.rate_limit import limiter
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.user_profile import UserProfile
from app.schemas.responses import AuditLogOut, PaginatedResponse

router = APIRouter(prefix="/api/audit", tags=["audit"])


async def _get_user_id(clerk_user_id: str, db: AsyncSession) -> UUID:
    result = await db.execute(
        select(UserProfile.id).where(UserProfile.clerk_user_id == clerk_user_id)
    )
    user_id = result.scalar_one_or_none()
    if not user_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User profile not found")
    return user_id


@router.get("", response_model=PaginatedResponse[AuditLogOut])
@limiter.limit("120/minute")
async def list_audit_log(
    request: Request,
    event_type: str | None = Query(None),
    entity_type: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    user_id = await _get_user_id(clerk_user_id, db)

    filters = [AuditLog.user_id == user_id]
    if event_type:
        filters.append(AuditLog.event_type == event_type)
    if entity_type:
        filters.append(AuditLog.entity_type == entity_type)

    total_result = await db.execute(
        select(func.count()).select_from(AuditLog).where(and_(*filters))
    )
    total = total_result.scalar() or 0

    result = await db.execute(
        select(AuditLog)
        .where(and_(*filters))
        .order_by(AuditLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = result.scalars().all()

    return PaginatedResponse(
        items=[AuditLogOut.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total,
    )


@router.get("/export/csv")
@limiter.limit("120/minute")
async def export_audit_csv(
    request: Request,
    event_type: str | None = Query(None),
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Export the full audit log as a CSV file."""
    user_id = await _get_user_id(clerk_user_id, db)

    filters = [AuditLog.user_id == user_id]
    if event_type:
        filters.append(AuditLog.event_type == event_type)

    result = await db.execute(
        select(AuditLog)
        .where(and_(*filters))
        .order_by(AuditLog.created_at.desc())
        .limit(10_000)  # Safety cap
    )
    rows = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "event_type", "entity_type", "entity_id", "entity_title", "metadata", "created_at"])
    for row in rows:
        writer.writerow([
            str(row.id),
            row.event_type,
            row.entity_type or "",
            str(row.entity_id) if row.entity_id else "",
            row.entity_title or "",
            str(row.event_metadata),
            row.created_at.isoformat() if row.created_at else "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=donna_audit_log.csv"},
    )
