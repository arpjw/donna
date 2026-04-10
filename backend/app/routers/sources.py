from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.regulatory_source import RegulatorySource
from app.rate_limit import limiter
from app.schemas.responses import RegulatorySourceOut

router = APIRouter(prefix="/api/sources", tags=["sources"])


@router.get("", response_model=list[RegulatorySourceOut])
@limiter.limit("120/minute")
async def list_sources(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RegulatorySource).where(RegulatorySource.is_active == True).order_by(RegulatorySource.jurisdiction, RegulatorySource.name)
    )
    sources = result.scalars().all()
    return [RegulatorySourceOut.model_validate(s) for s in sources]
