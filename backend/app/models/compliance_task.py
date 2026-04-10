import uuid
from sqlalchemy import Column, Date, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class ComplianceTask(Base):
    __tablename__ = "compliance_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"), nullable=True)
    regulatory_change_id = Column(UUID(as_uuid=True), ForeignKey("regulatory_changes.id"), nullable=True)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Text, nullable=False, server_default="open")
    priority = Column(Text, nullable=False, server_default="medium")
    due_date = Column(Date, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("UserProfile", back_populates="tasks")
    regulatory_change = relationship("RegulatoryChange", back_populates="tasks")
