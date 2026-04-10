import uuid
from sqlalchemy import Column, DateTime, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_user_id = Column(Text, unique=True, nullable=False)
    email = Column(Text, nullable=False)
    full_name = Column(Text, nullable=True)
    company_name = Column(Text, nullable=True)
    company_size = Column(Text, nullable=True)
    industries = Column(ARRAY(Text), server_default="{}")
    jurisdictions = Column(ARRAY(Text), server_default="{}")
    watched_source_ids = Column(ARRAY(UUID(as_uuid=True)), server_default="{}")
    alert_threshold = Column(Text, default="high")
    digest_cadence = Column(Text, default="weekly")
    digest_day = Column(Text, default="monday")
    digest_time = Column(Text, default="08:00")
    timezone = Column(Text, default="America/New_York")
    onboarded_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    relevance_mappings = relationship("RelevanceMapping", back_populates="user")
    alerts = relationship("Alert", back_populates="user")
    digests = relationship("Digest", back_populates="user")
    tasks = relationship("ComplianceTask", back_populates="user")
    annotations = relationship("DocumentAnnotation", back_populates="user")
    calendar_events = relationship("CalendarEvent", back_populates="user")
