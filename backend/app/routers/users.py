from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.rate_limit import limiter
from app.db.session import get_db
from app.models.user_profile import UserProfile
from app.schemas.responses import UserProfileOut, UserProfileUpdate, UserOnboardRequest
from app.auth import get_current_clerk_user_id
from app.services import audit

router = APIRouter(prefix="/api/users", tags=["users"])


async def get_user_profile(clerk_user_id: str, db: AsyncSession) -> UserProfile:
    result = await db.execute(
        select(UserProfile).where(UserProfile.clerk_user_id == clerk_user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    return profile


@router.get("/me", response_model=UserProfileOut)
@limiter.limit("120/minute")
async def get_me(
    request: Request,
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    return await get_user_profile(clerk_user_id, db)


@router.put("/me", response_model=UserProfileOut)
@limiter.limit("120/minute")
async def update_me(
    request: Request,
    body: UserProfileUpdate,
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    profile = await get_user_profile(clerk_user_id, db)

    update_data = body.model_dump(exclude_none=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
    profile.updated_at = datetime.now(timezone.utc)

    audit.add_to_session(
        db,
        user_id=profile.id,
        event_type="settings_updated",
        entity_type="user_profile",
        entity_id=profile.id,
        metadata={"fields_changed": list(update_data.keys())},
    )
    await db.commit()
    await db.refresh(profile)
    return profile


@router.post("/me/onboard", response_model=UserProfileOut)
@limiter.limit("120/minute")
async def onboard(
    request: Request,
    body: UserOnboardRequest,
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserProfile).where(UserProfile.clerk_user_id == clerk_user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        # Profile doesn't exist yet (webhook may not have fired) — create it now
        profile = UserProfile(
            clerk_user_id=clerk_user_id,
            email="",  # Will be updated by next webhook event
        )
        db.add(profile)

    update_data = body.model_dump(exclude_none=True)
    for key, value in update_data.items():
        setattr(profile, key, value)

    profile.onboarded_at = datetime.now(timezone.utc)
    profile.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(profile)

    # Trigger relevance scoring for this new user in the background
    try:
        from workers.relevance.scorer import score_change
        from sqlalchemy import select as sel
        from app.models.regulatory_change import RegulatoryChange
        changes_result = await db.execute(sel(RegulatoryChange.id).limit(50))
        for (change_id,) in changes_result.fetchall():
            score_change.delay(str(change_id))
    except Exception:
        pass  # Don't fail onboarding if scoring fails to enqueue

    return profile
