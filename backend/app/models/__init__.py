# Import all models to register them with SQLAlchemy's mapper
from app.models.regulatory_source import RegulatorySource
from app.models.raw_document import RawDocument
from app.models.processed_document import ProcessedDocument
from app.models.regulatory_change import RegulatoryChange
from app.models.user_profile import UserProfile
from app.models.relevance_mapping import RelevanceMapping
from app.models.alert import Alert
from app.models.digest import Digest
from app.models.compliance_task import ComplianceTask
from app.models.document_annotation import DocumentAnnotation
from app.models.audit_log import AuditLog
from app.models.calendar_event import CalendarEvent

__all__ = [
    "RegulatorySource",
    "RawDocument",
    "ProcessedDocument",
    "RegulatoryChange",
    "UserProfile",
    "RelevanceMapping",
    "Alert",
    "Digest",
    "ComplianceTask",
    "DocumentAnnotation",
    "AuditLog",
    "CalendarEvent",
]
