from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.processed_document import ProcessedDocument
from app.models.regulatory_change import RegulatoryChange
from app.models.regulatory_source import RegulatorySource
from app.models.raw_document import RawDocument
from app.rate_limit import limiter
from app.schemas.responses import SearchRequest, SearchResultOut, ProcessedDocumentOut, RegulatoryChangeOut, RegulatorySourceOut

router = APIRouter(prefix="/api/search", tags=["search"])


@router.post("", response_model=list[SearchResultOut])
@limiter.limit("30/minute")
async def semantic_search(
    request: Request,
    body: SearchRequest,
    db: AsyncSession = Depends(get_db),
):
    if not body.query or not body.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    # Generate query embedding
    from app.services.embeddings import embed_query
    query_vector = await embed_query(body.query)

    if query_vector is None:
        # Fall back to text search if embedding fails
        return await _text_fallback_search(body.query, db)

    # Build filter conditions
    filters = body.filters or {}
    where_clauses = ["pd.embedding IS NOT NULL"]
    params: dict = {"embedding": str(query_vector)}

    if filters.get("document_types"):
        where_clauses.append("pd.document_type = ANY(:doc_types)")
        params["doc_types"] = filters["document_types"]

    if filters.get("date_from"):
        where_clauses.append("rd.published_at >= :date_from")
        params["date_from"] = filters["date_from"]

    if filters.get("date_to"):
        where_clauses.append("rd.published_at <= :date_to")
        params["date_to"] = filters["date_to"]

    where_sql = " AND ".join(where_clauses)

    sql = text(f"""
        SELECT
            pd.id as pd_id,
            1 - (pd.embedding <=> :embedding) as similarity
        FROM processed_documents pd
        LEFT JOIN raw_documents rd ON rd.id = pd.raw_document_id
        WHERE {where_sql}
        ORDER BY pd.embedding <=> :embedding
        LIMIT 20
    """)

    result = await db.execute(sql, params)
    rows = result.fetchall()

    search_results = []
    for row in rows:
        pd_id, similarity = row
        doc_result = await db.execute(
            select(ProcessedDocument, RegulatoryChange, RegulatorySource, RawDocument)
            .join(RegulatoryChange, RegulatoryChange.processed_document_id == ProcessedDocument.id, isouter=True)
            .join(RegulatorySource, RegulatoryChange.source_id == RegulatorySource.id, isouter=True)
            .join(RawDocument, ProcessedDocument.raw_document_id == RawDocument.id, isouter=True)
            .where(ProcessedDocument.id == pd_id)
        )
        doc_row = doc_result.first()
        if not doc_row:
            continue

        doc, change, source, raw = doc_row
        doc_out = ProcessedDocumentOut.model_validate(doc)
        if change:
            doc_out.headline = change.headline
            doc_out.change_id = change.id
            doc_out.impact_level = change.impact_level
            doc_out.change_type = change.change_type
        if source:
            doc_out.source = RegulatorySourceOut.model_validate(source)
        if raw:
            doc_out.raw_title = raw.title
            doc_out.raw_document_url = raw.document_url
            doc_out.published_at = raw.published_at

        # Apply post-filter by industry/jurisdiction if requested
        if filters.get("industries"):
            if not any(ind in doc.affected_industries for ind in filters["industries"]):
                continue
        if filters.get("jurisdictions"):
            if not any(j in doc.affected_jurisdictions for j in filters["jurisdictions"]):
                continue

        search_results.append(SearchResultOut(
            processed_document=doc_out,
            change=RegulatoryChangeOut.model_validate(change) if change else None,
            source=RegulatorySourceOut.model_validate(source) if source else None,
            similarity_score=float(similarity),
        ))

    return search_results


async def _text_fallback_search(query: str, db: AsyncSession) -> list[SearchResultOut]:
    """Text-based fallback search when embedding is unavailable."""
    result = await db.execute(
        select(ProcessedDocument, RegulatoryChange, RegulatorySource, RawDocument)
        .join(RegulatoryChange, RegulatoryChange.processed_document_id == ProcessedDocument.id, isouter=True)
        .join(RegulatorySource, RegulatoryChange.source_id == RegulatorySource.id, isouter=True)
        .join(RawDocument, ProcessedDocument.raw_document_id == RawDocument.id, isouter=True)
        .where(
            RegulatoryChange.headline.ilike(f"%{query}%")
            | ProcessedDocument.plain_summary.ilike(f"%{query}%")
        )
        .order_by(RegulatoryChange.created_at.desc())
        .limit(20)
    )
    rows = result.all()

    results = []
    for doc, change, source, raw in rows:
        doc_out = ProcessedDocumentOut.model_validate(doc)
        if change:
            doc_out.headline = change.headline
            doc_out.change_id = change.id
            doc_out.impact_level = change.impact_level
        if source:
            doc_out.source = RegulatorySourceOut.model_validate(source)
        if raw:
            doc_out.raw_title = raw.title
            doc_out.raw_document_url = raw.document_url
            doc_out.published_at = raw.published_at

        results.append(SearchResultOut(
            processed_document=doc_out,
            change=RegulatoryChangeOut.model_validate(change) if change else None,
            source=RegulatorySourceOut.model_validate(source) if source else None,
            similarity_score=0.5,
        ))

    return results
