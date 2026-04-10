import uuid
from sqlalchemy import Column, DateTime, Float, ForeignKey, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class RelevanceMapping(Base):
    __tablename__ = "relevance_mappings"
    __table_args__ = (UniqueConstraint("user_id", "regulatory_change_id"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"), nullable=False)
    regulatory_change_id = Column(UUID(as_uuid=True), ForeignKey("regulatory_changes.id"), nullable=False)
    relevance_score = Column(Float, nullable=False)
    relevance_reasoning = Column(Text, nullable=False)
    match_signals = Column(JSONB, server_default="{}")
    user_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("UserProfile", back_populates="relevance_mappings")
    regulatory_change = relationship("RegulatoryChange", back_populates="relevance_mappings")
