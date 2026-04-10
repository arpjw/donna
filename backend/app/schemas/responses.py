from datetime import date, datetime
from typing import Any, Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    has_more: bool


class RegulatorySourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    base_url: str
    feed_url: str | None
    scrape_cadence_minutes: int
    jurisdiction: str
    category: str
    is_active: bool
    last_checked_at: datetime | None
    created_at: datetime


class RawDocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    source_id: UUID | None
    external_id: str | None
    title: str
    document_url: str
    document_type: str
    published_at: datetime | None
    fetched_at: datetime
    is_processed: bool


class ProcessedDocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    raw_document_id: UUID
    plain_summary: str
    detailed_summary: str
    affected_industries: list[str]
    affected_jurisdictions: list[str]
    key_dates: list[dict[str, Any]]
    document_type: str
    significance_score: float | None
    significance_reasoning: str | None
    taxonomy_tags: list[str]
    recommended_actions: str | None
    processed_at: datetime
    llm_model_version: str | None

    # Joined fields (optional)
    source: RegulatorySourceOut | None = None
    headline: str | None = None
    change_id: UUID | None = None
    impact_level: str | None = None
    change_type: str | None = None
    raw_title: str | None = None
    raw_document_url: str | None = None
    published_at: datetime | None = None


class RegulatoryChangeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    processed_document_id: UUID | None
    change_type: str
    headline: str
    impact_level: str
    effective_date: datetime | None
    comment_deadline: datetime | None
    source_id: UUID | None
    created_at: datetime

    # Joined fields
    source: RegulatorySourceOut | None = None
    processed_document: ProcessedDocumentOut | None = None


class UserProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    clerk_user_id: str
    email: str
    full_name: str | None
    company_name: str | None
    company_size: str | None
    industries: list[str]
    jurisdictions: list[str]
    watched_source_ids: list[UUID]
    alert_threshold: str
    digest_cadence: str
    digest_day: str
    digest_time: str
    timezone: str
    onboarded_at: datetime | None
    created_at: datetime
    updated_at: datetime


class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    company_name: str | None = None
    company_size: str | None = None
    industries: list[str] | None = None
    jurisdictions: list[str] | None = None
    watched_source_ids: list[UUID] | None = None
    alert_threshold: str | None = None
    digest_cadence: str | None = None
    digest_day: str | None = None
    digest_time: str | None = None
    timezone: str | None = None


class UserOnboardRequest(BaseModel):
    full_name: str | None = None
    company_name: str | None = None
    company_size: str | None = None
    industries: list[str] = []
    jurisdictions: list[str] = []
    alert_threshold: str = "high"
    digest_cadence: str = "weekly"
    digest_day: str = "monday"
    digest_time: str = "08:00"
    timezone: str = "America/New_York"


class RelevanceMappingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    regulatory_change_id: UUID
    relevance_score: float
    relevance_reasoning: str
    match_signals: dict[str, Any]
    user_feedback: str | None
    created_at: datetime


class FeedItemOut(BaseModel):
    change: RegulatoryChangeOut
    relevance_score: float
    relevance_reasoning: str


class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    regulatory_change_id: UUID
    channel: str
    subject: str
    sent_at: datetime | None
    opened_at: datetime | None
    clicked_at: datetime | None
    status: str
    created_at: datetime
    change: RegulatoryChangeOut | None = None


class AlertFeedbackRequest(BaseModel):
    feedback: str  # "relevant" | "not_relevant"


class DigestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    period_start: datetime
    period_end: datetime
    headline: str
    assembled_html: str
    assembled_text: str
    change_ids: list[UUID]
    sent_at: datetime | None
    status: str
    created_at: datetime


class AnnotationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID | None
    processed_document_id: UUID | None
    selected_text: str
    note: str | None
    color: str
    char_start: int
    char_end: int
    created_at: datetime
    updated_at: datetime


class AnnotationCreateRequest(BaseModel):
    processed_document_id: UUID
    selected_text: str
    note: str | None = None
    color: str = "crimson"
    char_start: int
    char_end: int


class AnnotationUpdateRequest(BaseModel):
    note: str | None = None
    color: str | None = None


class ComplianceTaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID | None
    regulatory_change_id: UUID | None
    title: str
    description: str | None
    status: str
    priority: str
    due_date: date | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    # Joined fields
    change: RegulatoryChangeOut | None = None


class TaskCreateRequest(BaseModel):
    regulatory_change_id: UUID | None = None
    title: str
    description: str | None = None
    priority: str = "medium"
    due_date: date | None = None


class TaskUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    due_date: date | None = None


class TaskStatsOut(BaseModel):
    open: int
    in_progress: int
    complete: int
    overdue: int


class SearchRequest(BaseModel):
    query: str
    filters: dict[str, Any] | None = None


class SearchResultOut(BaseModel):
    processed_document: ProcessedDocumentOut
    change: RegulatoryChangeOut | None
    source: RegulatorySourceOut | None
    similarity_score: float


class CalendarEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID | None
    regulatory_change_id: UUID | None
    processed_document_id: UUID | None
    title: str
    event_type: str
    date: date
    description: str | None
    is_user_created: bool
    created_at: datetime
    # Joined field
    change: RegulatoryChangeOut | None = None


class CalendarEventCreateRequest(BaseModel):
    title: str
    event_type: str = "manual"
    date: date
    description: str | None = None
    regulatory_change_id: UUID | None = None
    processed_document_id: UUID | None = None


class CalendarEventUpdateRequest(BaseModel):
    title: str | None = None
    event_date: date | None = None
    description: str | None = None
    event_type: str | None = None


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID | None
    event_type: str
    entity_type: str | None
    entity_id: UUID | None
    entity_title: str | None
    event_metadata: dict[str, Any]
    created_at: datetime
