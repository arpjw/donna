from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.rate_limit import limiter
from app.db.session import get_db
from app.models.regulatory_change import RegulatoryChange
from app.models.processed_document import ProcessedDocument
from app.models.regulatory_source import RegulatorySource
from app.models.raw_document import RawDocument
from app.models.relevance_mapping import RelevanceMapping
from app.models.user_profile import UserProfile
from app.schemas.responses import (
    RegulatoryChangeOut,
    ProcessedDocumentOut,
    RegulatorySourceOut,
    FeedItemOut,
    PaginatedResponse,
)
from app.auth import get_optional_clerk_user_id

router = APIRouter(prefix="/api/changes", tags=["changes"])


@router.get("", response_model=PaginatedResponse[FeedItemOut])
@limiter.limit("60/minute")
async def list_changes(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    impact_level: str | None = None,
    source_id: UUID | None = None,
    clerk_user_id: str | None = Depends(get_optional_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    # If authenticated user has relevance mappings, show personalized feed
    user_profile = None
    if clerk_user_id:
        user_result = await db.execute(
            select(UserProfile).where(UserProfile.clerk_user_id == clerk_user_id)
        )
        user_profile = user_result.scalar_one_or_none()

    if user_profile and user_profile.onboarded_at:
        # Personalized feed via relevance mappings
        base_query = (
            select(RelevanceMapping, RegulatoryChange, ProcessedDocument, RegulatorySource, RawDocument)
            .join(RegulatoryChange, RelevanceMapping.regulatory_change_id == RegulatoryChange.id)
            .join(ProcessedDocument, RegulatoryChange.processed_document_id == ProcessedDocument.id, isouter=True)
            .join(RegulatorySource, RegulatoryChange.source_id == RegulatorySource.id, isouter=True)
            .join(RawDocument, ProcessedDocument.raw_document_id == RawDocument.id, isouter=True)
            .where(RelevanceMapping.user_id == user_profile.id)
        )
        if impact_level:
            base_query = base_query.where(RegulatoryChange.impact_level == impact_level)
        if source_id:
            base_query = base_query.where(RegulatoryChange.source_id == source_id)

        count_q = select(func.count()).select_from(RelevanceMapping).where(RelevanceMapping.user_id == user_profile.id)
        total = (await db.execute(count_q)).scalar() or 0

        base_query = base_query.order_by(RelevanceMapping.relevance_score.desc()).offset((page - 1) * page_size).limit(page_size)
        rows = (await db.execute(base_query)).all()

        items = []
        for rm, change, proc, source, raw in rows:
            change_out = _build_change_out(change, proc, source, raw)
            items.append(FeedItemOut(
                change=change_out,
                relevance_score=rm.relevance_score,
                relevance_reasoning=rm.relevance_reasoning,
            ))
    else:
        # Public feed — all changes sorted by created_at
        base_query = (
            select(RegulatoryChange, ProcessedDocument, RegulatorySource, RawDocument)
            .join(ProcessedDocument, RegulatoryChange.processed_document_id == ProcessedDocument.id, isouter=True)
            .join(RegulatorySource, RegulatoryChange.source_id == RegulatorySource.id, isouter=True)
            .join(RawDocument, ProcessedDocument.raw_document_id == RawDocument.id, isouter=True)
        )
        if impact_level:
            base_query = base_query.where(RegulatoryChange.impact_level == impact_level)
        if source_id:
            base_query = base_query.where(RegulatoryChange.source_id == source_id)

        count_q = select(func.count()).select_from(RegulatoryChange)
        total = (await db.execute(count_q)).scalar() or 0

        base_query = base_query.order_by(RegulatoryChange.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        rows = (await db.execute(base_query)).all()

        items = []
        for change, proc, source, raw in rows:
            change_out = _build_change_out(change, proc, source, raw)
            items.append(FeedItemOut(
                change=change_out,
                relevance_score=0.5,
                relevance_reasoning="Public feed",
            ))

    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, has_more=(page * page_size) < total)


@router.get("/{change_id}", response_model=RegulatoryChangeOut)
@limiter.limit("60/minute")
async def get_change(
    request: Request,
    change_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RegulatoryChange, ProcessedDocument, RegulatorySource, RawDocument)
        .join(ProcessedDocument, RegulatoryChange.processed_document_id == ProcessedDocument.id, isouter=True)
        .join(RegulatorySource, RegulatoryChange.source_id == RegulatorySource.id, isouter=True)
        .join(RawDocument, ProcessedDocument.raw_document_id == RawDocument.id, isouter=True)
        .where(RegulatoryChange.id == change_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Change not found")

    change, proc, source, raw = row
    return _build_change_out(change, proc, source, raw)


def _build_change_out(change, proc, source, raw) -> RegulatoryChangeOut:
    change_out = RegulatoryChangeOut.model_validate(change)
    if source:
        change_out.source = RegulatorySourceOut.model_validate(source)
    if proc:
        proc_out = ProcessedDocumentOut.model_validate(proc)
        if raw:
            proc_out.raw_title = raw.title
            proc_out.raw_document_url = raw.document_url
            proc_out.published_at = raw.published_at
        if source:
            proc_out.source = RegulatorySourceOut.model_validate(source)
        proc_out.headline = change.headline
        proc_out.change_id = change.id
        proc_out.impact_level = change.impact_level
        proc_out.change_type = change.change_type
        change_out.processed_document = proc_out
    return change_out
