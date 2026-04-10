from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.rate_limit import limiter
from app.db.session import get_db
from app.models.digest import Digest
from app.models.user_profile import UserProfile
from app.schemas.responses import DigestOut, PaginatedResponse
from app.auth import get_current_clerk_user_id

router = APIRouter(prefix="/api/digests", tags=["digests"])


@router.get("", response_model=PaginatedResponse[DigestOut])
@limiter.limit("120/minute")
async def list_digests(
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

    total = (await db.execute(
        select(func.count()).select_from(Digest).where(Digest.user_id == user.id)
    )).scalar() or 0

    result = await db.execute(
        select(Digest)
        .where(Digest.user_id == user.id)
        .order_by(Digest.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = result.scalars().all()

    return PaginatedResponse(
        items=[DigestOut.model_validate(d) for d in items],
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total,
    )


@router.get("/{digest_id}", response_model=DigestOut)
@limiter.limit("120/minute")
async def get_digest(
    request: Request,
    digest_id: UUID,
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    user_result = await db.execute(
        select(UserProfile).where(UserProfile.clerk_user_id == clerk_user_id)
    )
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")

    result = await db.execute(
        select(Digest).where(Digest.id == digest_id, Digest.user_id == user.id)
    )
    digest = result.scalar_one_or_none()
    if not digest:
        raise HTTPException(status_code=404, detail="Digest not found")

    return DigestOut.model_validate(digest)
