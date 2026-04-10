import uuid
from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"), nullable=True)
    regulatory_change_id = Column(UUID(as_uuid=True), ForeignKey("regulatory_changes.id"), nullable=True)
    processed_document_id = Column(UUID(as_uuid=True), ForeignKey("processed_documents.id"), nullable=True)
    title = Column(Text, nullable=False)
    event_type = Column(Text, nullable=False)  # e.g. "comment_deadline", "effective_date", "manual"
    date = Column(Date, nullable=False)
    description = Column(Text, nullable=True)
    is_user_created = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("UserProfile", back_populates="calendar_events")
    regulatory_change = relationship("RegulatoryChange", back_populates="calendar_events")
    processed_document = relationship("ProcessedDocument", back_populates="calendar_events")
