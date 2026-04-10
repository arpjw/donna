from datetime import date, datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_clerk_user_id
from app.rate_limit import limiter
from app.db.session import get_db
from app.models.compliance_task import ComplianceTask
from app.services import audit
from app.models.regulatory_change import RegulatoryChange
from app.models.relevance_mapping import RelevanceMapping
from app.models.user_profile import UserProfile
from app.schemas.responses import (
    ComplianceTaskOut,
    PaginatedResponse,
    RegulatoryChangeOut,
    TaskCreateRequest,
    TaskStatsOut,
    TaskUpdateRequest,
)

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

VALID_STATUSES = {"open", "in_progress", "complete", "dismissed"}
VALID_PRIORITIES = {"high", "medium", "low"}


async def _get_user(clerk_user_id: str, db: AsyncSession) -> UserProfile:
    result = await db.execute(
        select(UserProfile).where(UserProfile.clerk_user_id == clerk_user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")
    return user


def _build_task_out(task: ComplianceTask, change: RegulatoryChange | None = None) -> ComplianceTaskOut:
    out = ComplianceTaskOut.model_validate(task)
    if change:
        out.change = RegulatoryChangeOut.model_validate(change)
    return out


# NOTE: /stats must be defined before /{id} to avoid FastAPI treating "stats" as a UUID
@router.get("/stats", response_model=TaskStatsOut)
@limiter.limit("120/minute")
async def get_task_stats(
    request: Request,
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user(clerk_user_id, db)
    today = date.today()

    counts = {}
    for status in ("open", "in_progress", "complete"):
        result = await db.execute(
            select(func.count()).select_from(ComplianceTask).where(
                ComplianceTask.user_id == user.id,
                ComplianceTask.status == status,
            )
        )
        counts[status] = result.scalar() or 0

    overdue_result = await db.execute(
        select(func.count()).select_from(ComplianceTask).where(
            ComplianceTask.user_id == user.id,
            ComplianceTask.status.in_(["open", "in_progress"]),
            ComplianceTask.due_date < today,
        )
    )
    counts["overdue"] = overdue_result.scalar() or 0

    return TaskStatsOut(
        open=counts["open"],
        in_progress=counts["in_progress"],
        complete=counts["complete"],
        overdue=counts["overdue"],
    )


@router.get("", response_model=PaginatedResponse[ComplianceTaskOut])
@limiter.limit("120/minute")
async def list_tasks(
    request: Request,
    status: str | None = None,
    priority: str | None = None,
    due_before: date | None = None,
    due_after: date | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user(clerk_user_id, db)

    filters = [
        ComplianceTask.user_id == user.id,
        ComplianceTask.status != "dismissed",
    ]
    if status:
        filters.append(ComplianceTask.status == status)
    if priority:
        filters.append(ComplianceTask.priority == priority)
    if due_before:
        filters.append(ComplianceTask.due_date <= due_before)
    if due_after:
        filters.append(ComplianceTask.due_date >= due_after)

    count_result = await db.execute(
        select(func.count()).select_from(ComplianceTask).where(and_(*filters))
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        select(ComplianceTask, RegulatoryChange)
        .join(RegulatoryChange, ComplianceTask.regulatory_change_id == RegulatoryChange.id, isouter=True)
        .where(and_(*filters))
        .order_by(ComplianceTask.due_date.asc().nullslast(), ComplianceTask.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = result.all()

    items = [_build_task_out(task, change) for task, change in rows]
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, has_more=(page * page_size) < total)


@router.post("", response_model=ComplianceTaskOut, status_code=201)
@limiter.limit("30/minute")
async def create_task(
    request: Request,
    body: TaskCreateRequest,
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user(clerk_user_id, db)

    if body.priority not in VALID_PRIORITIES:
        raise HTTPException(status_code=422, detail=f"priority must be one of {VALID_PRIORITIES}")

    change = None
    if body.regulatory_change_id:
        # Validate that the user has a relevance mapping for this change
        rm_result = await db.execute(
            select(RelevanceMapping).where(
                RelevanceMapping.user_id == user.id,
                RelevanceMapping.regulatory_change_id == body.regulatory_change_id,
            )
        )
        if not rm_result.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="No relevance mapping for this regulatory change")

        change_result = await db.execute(
            select(RegulatoryChange).where(RegulatoryChange.id == body.regulatory_change_id)
        )
        change = change_result.scalar_one_or_none()

    task = ComplianceTask(
        user_id=user.id,
        regulatory_change_id=body.regulatory_change_id,
        title=body.title,
        description=body.description,
        priority=body.priority,
        due_date=body.due_date,
        status="open",
    )
    db.add(task)
    audit.add_to_session(
        db,
        user_id=user.id,
        event_type="task_created",
        entity_type="compliance_task",
        entity_title=body.title,
        metadata={"priority": body.priority, "has_change": body.regulatory_change_id is not None},
    )
    await db.commit()
    await db.refresh(task)

    return _build_task_out(task, change)


@router.get("/{task_id}", response_model=ComplianceTaskOut)
@limiter.limit("120/minute")
async def get_task(
    request: Request,
    task_id: UUID,
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user(clerk_user_id, db)

    result = await db.execute(
        select(ComplianceTask, RegulatoryChange)
        .join(RegulatoryChange, ComplianceTask.regulatory_change_id == RegulatoryChange.id, isouter=True)
        .where(ComplianceTask.id == task_id, ComplianceTask.user_id == user.id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")

    task, change = row
    return _build_task_out(task, change)


@router.patch("/{task_id}", response_model=ComplianceTaskOut)
@limiter.limit("120/minute")
async def update_task(
    request: Request,
    task_id: UUID,
    body: TaskUpdateRequest,
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user(clerk_user_id, db)

    result = await db.execute(
        select(ComplianceTask).where(ComplianceTask.id == task_id, ComplianceTask.user_id == user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    status_changed_to = None
    if body.status is not None:
        if body.status not in VALID_STATUSES:
            raise HTTPException(status_code=422, detail=f"status must be one of {VALID_STATUSES}")
        if body.status != task.status:
            status_changed_to = body.status
        task.status = body.status
        if body.status == "complete" and task.completed_at is None:
            task.completed_at = datetime.now(timezone.utc)
    if body.title is not None:
        task.title = body.title
    if body.description is not None:
        task.description = body.description
    if body.priority is not None:
        if body.priority not in VALID_PRIORITIES:
            raise HTTPException(status_code=422, detail=f"priority must be one of {VALID_PRIORITIES}")
        task.priority = body.priority
    if body.due_date is not None:
        task.due_date = body.due_date

    if status_changed_to == "complete":
        audit.add_to_session(
            db,
            user_id=user.id,
            event_type="task_completed",
            entity_type="compliance_task",
            entity_id=task_id,
            entity_title=task.title,
        )
    await db.commit()
    await db.refresh(task)

    change = None
    if task.regulatory_change_id:
        change_result = await db.execute(
            select(RegulatoryChange).where(RegulatoryChange.id == task.regulatory_change_id)
        )
        change = change_result.scalar_one_or_none()

    return _build_task_out(task, change)


@router.delete("/{task_id}", status_code=204)
@limiter.limit("120/minute")
async def delete_task(
    request: Request,
    task_id: UUID,
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user(clerk_user_id, db)

    result = await db.execute(
        select(ComplianceTask).where(ComplianceTask.id == task_id, ComplianceTask.user_id == user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = "dismissed"
    audit.add_to_session(
        db,
        user_id=user.id,
        event_type="task_dismissed",
        entity_type="compliance_task",
        entity_id=task_id,
        entity_title=task.title,
    )
    await db.commit()
