from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.rate_limit import limiter
from app.db.session import get_db
from app.models.alert import Alert
from app.models.relevance_mapping import RelevanceMapping
from app.models.user_profile import UserProfile
from app.models.regulatory_change import RegulatoryChange
from app.schemas.responses import AlertOut, AlertFeedbackRequest, PaginatedResponse, RegulatoryChangeOut
from app.auth import get_current_clerk_user_id
from app.services import audit

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=PaginatedResponse[AlertOut])
@limiter.limit("120/minute")
async def list_alerts(
    request: Request,
    page: int = 1,
    page_size: int = 20,
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    user_result = await db.execute(
        select(UserProfile).where(UserProfile.clerk_user_id == clerk_user_id)
    )
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")

    total_result = await db.execute(
        select(func.count()).select_from(Alert).where(Alert.user_id == user.id)
    )
    total = total_result.scalar() or 0

    result = await db.execute(
        select(Alert, RegulatoryChange)
        .join(RegulatoryChange, Alert.regulatory_change_id == RegulatoryChange.id, isouter=True)
        .where(Alert.user_id == user.id)
        .order_by(Alert.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = result.all()

    items = []
    for alert, change in rows:
        alert_out = AlertOut.model_validate(alert)
        if change:
            alert_out.change = RegulatoryChangeOut.model_validate(change)
        items.append(alert_out)

    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, has_more=(page * page_size) < total)


@router.patch("/{alert_id}/feedback")
@limiter.limit("120/minute")
async def submit_feedback(
    request: Request,
    alert_id: UUID,
    body: AlertFeedbackRequest,
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    user_result = await db.execute(
        select(UserProfile).where(UserProfile.clerk_user_id == clerk_user_id)
    )
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")

    alert_result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.user_id == user.id)
    )
    alert = alert_result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    # Write feedback to relevance_mapping
    rm_result = await db.execute(
        select(RelevanceMapping).where(
            RelevanceMapping.user_id == user.id,
            RelevanceMapping.regulatory_change_id == alert.regulatory_change_id,
        )
    )
    rm = rm_result.scalar_one_or_none()
    if rm:
        rm.user_feedback = body.feedback
        audit.add_to_session(
            db,
            user_id=user.id,
            event_type="feedback_given",
            entity_type="regulatory_change",
            entity_id=alert.regulatory_change_id,
            metadata={"feedback_value": body.feedback},
        )
        await db.commit()

    return {"status": "ok"}
