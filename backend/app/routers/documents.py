from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_optional_clerk_user_id
from app.rate_limit import limiter
from app.db.session import get_db
from app.models.processed_document import ProcessedDocument
from app.models.regulatory_change import RegulatoryChange
from app.models.raw_document import RawDocument
from app.models.regulatory_source import RegulatorySource
from app.schemas.responses import (
    ProcessedDocumentOut,
    SearchResultOut,
    PaginatedResponse,
)
from app.services import audit

router = APIRouter(prefix="/api/documents", tags=["documents"])


def _enrich_doc_out(doc: ProcessedDocument, change: RegulatoryChange | None, source: RegulatorySource | None, raw: RawDocument | None) -> dict:
    """Build a ProcessedDocumentOut dict with joined fields."""
    from app.schemas.responses import RegulatorySourceOut
    d = ProcessedDocumentOut.model_validate(doc)
    if change:
        d.headline = change.headline
        d.change_id = change.id
        d.impact_level = change.impact_level
        d.change_type = change.change_type
    if source:
        d.source = RegulatorySourceOut.model_validate(source)
    if raw:
        d.raw_title = raw.title
        d.raw_document_url = raw.document_url
        d.published_at = raw.published_at
    return d


@router.get("", response_model=PaginatedResponse[ProcessedDocumentOut])
@limiter.limit("60/minute")
async def list_documents(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    source_id: UUID | None = None,
    document_type: str | None = None,
    impact_level: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime, timezone

    query = (
        select(ProcessedDocument, RegulatoryChange, RegulatorySource, RawDocument)
        .join(RegulatoryChange, RegulatoryChange.processed_document_id == ProcessedDocument.id, isouter=True)
        .join(RegulatorySource, RegulatoryChange.source_id == RegulatorySource.id, isouter=True)
        .join(RawDocument, ProcessedDocument.raw_document_id == RawDocument.id, isouter=True)
    )

    if document_type:
        query = query.where(ProcessedDocument.document_type == document_type)
    if impact_level:
        query = query.where(RegulatoryChange.impact_level == impact_level)
    if source_id:
        query = query.where(RegulatoryChange.source_id == source_id)
    if date_from:
        dt = datetime.fromisoformat(date_from).replace(tzinfo=timezone.utc)
        query = query.where(RawDocument.published_at >= dt)
    if date_to:
        dt = datetime.fromisoformat(date_to).replace(tzinfo=timezone.utc)
        query = query.where(RawDocument.published_at <= dt)

    # Count total
    count_query = select(func.count()).select_from(ProcessedDocument)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    query = query.order_by(ProcessedDocument.processed_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    rows = result.all()

    items = [_enrich_doc_out(doc, change, source, raw) for doc, change, source, raw in rows]

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total,
    )


@router.get("/{doc_id}", response_model=ProcessedDocumentOut)
@limiter.limit("60/minute")
async def get_document(
    request: Request,
    doc_id: UUID,
    db: AsyncSession = Depends(get_db),
    clerk_user_id: str | None = Depends(get_optional_clerk_user_id),
):
    result = await db.execute(
        select(ProcessedDocument, RegulatoryChange, RegulatorySource, RawDocument)
        .join(RegulatoryChange, RegulatoryChange.processed_document_id == ProcessedDocument.id, isouter=True)
        .join(RegulatorySource, RegulatoryChange.source_id == RegulatorySource.id, isouter=True)
        .join(RawDocument, ProcessedDocument.raw_document_id == RawDocument.id, isouter=True)
        .where(ProcessedDocument.id == doc_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")

    doc, change, source, raw = row

    if clerk_user_id:
        from sqlalchemy import select as sa_select
        from app.models.user_profile import UserProfile
        user_result = await db.execute(
            sa_select(UserProfile.id).where(UserProfile.clerk_user_id == clerk_user_id)
        )
        user_id = user_result.scalar_one_or_none()
        if user_id:
            audit.add_to_session(
                db,
                user_id=user_id,
                event_type="document_viewed",
                entity_type="processed_document",
                entity_id=doc_id,
                entity_title=change.headline if change else raw.title if raw else None,
            )
            await db.commit()

    return _enrich_doc_out(doc, change, source, raw)


@router.get("/{doc_id}/related", response_model=list[SearchResultOut])
@limiter.limit("60/minute")
async def get_related_documents(
    request: Request,
    doc_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    # Get embedding for this document
    result = await db.execute(
        select(ProcessedDocument).where(ProcessedDocument.id == doc_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.embedding is None:
        return []

    # Find top 5 similar (excluding self)
    from sqlalchemy import text
    similar_result = await db.execute(
        text("""
            SELECT pd.id, 1 - (pd.embedding <=> :embedding) as similarity
            FROM processed_documents pd
            WHERE pd.id != :doc_id AND pd.embedding IS NOT NULL
            ORDER BY pd.embedding <=> :embedding
            LIMIT 5
        """),
        {"embedding": str(doc.embedding), "doc_id": str(doc_id)},
    )
    rows = similar_result.fetchall()

    results = []
    for row in rows:
        similar_doc_result = await db.execute(
            select(ProcessedDocument, RegulatoryChange, RegulatorySource, RawDocument)
            .join(RegulatoryChange, RegulatoryChange.processed_document_id == ProcessedDocument.id, isouter=True)
            .join(RegulatorySource, RegulatoryChange.source_id == RegulatorySource.id, isouter=True)
            .join(RawDocument, ProcessedDocument.raw_document_id == RawDocument.id, isouter=True)
            .where(ProcessedDocument.id == row[0])
        )
        similar_row = similar_doc_result.first()
        if similar_row:
            similar_doc, similar_change, similar_source, similar_raw = similar_row
            from app.schemas.responses import RegulatorySourceOut, RegulatoryChangeOut
            results.append(SearchResultOut(
                processed_document=_enrich_doc_out(similar_doc, similar_change, similar_source, similar_raw),
                change=RegulatoryChangeOut.model_validate(similar_change) if similar_change else None,
                source=RegulatorySourceOut.model_validate(similar_source) if similar_source else None,
                similarity_score=float(row[1]),
            ))

    return results
