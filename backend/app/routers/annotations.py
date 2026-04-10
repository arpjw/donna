from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_clerk_user_id
from app.rate_limit import limiter
from app.db.session import get_db
from app.models.document_annotation import DocumentAnnotation
from app.services import audit
from app.models.user_profile import UserProfile
from app.schemas.responses import (
    AnnotationCreateRequest,
    AnnotationOut,
    AnnotationUpdateRequest,
)

router = APIRouter(prefix="/api/annotations", tags=["annotations"])

VALID_COLORS = {"crimson", "amber", "green"}


async def _get_user(clerk_user_id: str, db: AsyncSession) -> UserProfile:
    result = await db.execute(
        select(UserProfile).where(UserProfile.clerk_user_id == clerk_user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")
    return user


@router.get("", response_model=list[AnnotationOut])
@limiter.limit("120/minute")
async def list_annotations(
    request: Request,
    document_id: UUID = Query(...),
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user(clerk_user_id, db)

    result = await db.execute(
        select(DocumentAnnotation)
        .where(
            DocumentAnnotation.user_id == user.id,
            DocumentAnnotation.processed_document_id == document_id,
        )
        .order_by(DocumentAnnotation.char_start.asc())
    )
    return result.scalars().all()


@router.post("", response_model=AnnotationOut, status_code=201)
@limiter.limit("30/minute")
async def create_annotation(
    request: Request,
    body: AnnotationCreateRequest,
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user(clerk_user_id, db)

    if body.char_end <= body.char_start:
        raise HTTPException(
            status_code=422,
            detail="char_end must be greater than char_start",
        )

    if body.color not in VALID_COLORS:
        raise HTTPException(
            status_code=422,
            detail=f"color must be one of {VALID_COLORS}",
        )

    annotation = DocumentAnnotation(
        user_id=user.id,
        processed_document_id=body.processed_document_id,
        selected_text=body.selected_text,
        note=body.note,
        color=body.color,
        char_start=body.char_start,
        char_end=body.char_end,
    )
    db.add(annotation)
    audit.add_to_session(
        db,
        user_id=user.id,
        event_type="annotation_added",
        entity_type="processed_document",
        entity_id=body.processed_document_id,
        metadata={"color": body.color, "has_note": body.note is not None},
    )
    await db.commit()
    await db.refresh(annotation)
    return annotation


@router.patch("/{annotation_id}", response_model=AnnotationOut)
@limiter.limit("120/minute")
async def update_annotation(
    request: Request,
    annotation_id: UUID,
    body: AnnotationUpdateRequest,
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user(clerk_user_id, db)

    result = await db.execute(
        select(DocumentAnnotation).where(
            DocumentAnnotation.id == annotation_id,
            DocumentAnnotation.user_id == user.id,
        )
    )
    annotation = result.scalar_one_or_none()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")

    if body.color is not None:
        if body.color not in VALID_COLORS:
            raise HTTPException(
                status_code=422,
                detail=f"color must be one of {VALID_COLORS}",
            )
        annotation.color = body.color

    # note can be set to None (clearing it) or a new string
    if "note" in body.model_fields_set:
        annotation.note = body.note

    await db.commit()
    await db.refresh(annotation)
    return annotation


@router.delete("/{annotation_id}", status_code=204)
@limiter.limit("120/minute")
async def delete_annotation(
    request: Request,
    annotation_id: UUID,
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user(clerk_user_id, db)

    result = await db.execute(
        select(DocumentAnnotation).where(
            DocumentAnnotation.id == annotation_id,
            DocumentAnnotation.user_id == user.id,
        )
    )
    annotation = result.scalar_one_or_none()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")

    await db.delete(annotation)
    await db.commit()
