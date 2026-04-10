import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class RegulatoryChange(Base):
    __tablename__ = "regulatory_changes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    processed_document_id = Column(UUID(as_uuid=True), ForeignKey("processed_documents.id"), nullable=True)
    change_type = Column(Text, nullable=False)
    headline = Column(Text, nullable=False)
    impact_level = Column(Text, nullable=False)
    effective_date = Column(DateTime(timezone=True), nullable=True)
    comment_deadline = Column(DateTime(timezone=True), nullable=True)
    source_id = Column(UUID(as_uuid=True), ForeignKey("regulatory_sources.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    processed_document = relationship("ProcessedDocument", back_populates="regulatory_change")
    source = relationship("RegulatorySource", back_populates="regulatory_changes")
    relevance_mappings = relationship("RelevanceMapping", back_populates="regulatory_change")
    alerts = relationship("Alert", back_populates="regulatory_change")
    tasks = relationship("ComplianceTask", back_populates="regulatory_change")
    calendar_events = relationship("CalendarEvent", back_populates="regulatory_change")
