import uuid
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class RawDocument(Base):
    __tablename__ = "raw_documents"
    __table_args__ = (UniqueConstraint("source_id", "document_url"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id = Column(UUID(as_uuid=True), ForeignKey("regulatory_sources.id"), nullable=True)
    external_id = Column(Text, nullable=True)
    title = Column(Text, nullable=False)
    full_text = Column(Text, nullable=True)
    document_url = Column(Text, nullable=False)
    document_type = Column(Text, nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=True)
    fetched_at = Column(DateTime(timezone=True), server_default=func.now())
    is_processed = Column(Boolean, default=False)
    raw_metadata = Column(JSONB, nullable=True)

    # Relationships
    source = relationship("RegulatorySource", back_populates="raw_documents")
    processed_document = relationship("ProcessedDocument", back_populates="raw_document", uselist=False)
