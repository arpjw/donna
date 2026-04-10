import uuid
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class RegulatorySource(Base):
    __tablename__ = "regulatory_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    slug = Column(Text, unique=True, nullable=False)
    base_url = Column(Text, nullable=False)
    feed_url = Column(Text, nullable=True)
    scrape_cadence_minutes = Column(Integer, default=60)
    jurisdiction = Column(Text, nullable=False)
    category = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    last_checked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    raw_documents = relationship("RawDocument", back_populates="source")
    regulatory_changes = relationship("RegulatoryChange", back_populates="source")
