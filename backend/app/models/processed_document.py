import uuid
from sqlalchemy import Column, DateTime, Float, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

from app.db.session import Base


class ProcessedDocument(Base):
    __tablename__ = "processed_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    raw_document_id = Column(UUID(as_uuid=True), ForeignKey("raw_documents.id"), unique=True, nullable=False)
    plain_summary = Column(Text, nullable=False)
    detailed_summary = Column(Text, nullable=False)
    affected_industries = Column(ARRAY(Text), server_default="{}")
    affected_jurisdictions = Column(ARRAY(Text), server_default="{}")
    key_dates = Column(JSONB, server_default="[]")
    document_type = Column(Text, nullable=False)
    significance_score = Column(Float, nullable=True)
    significance_reasoning = Column(Text, nullable=True)
    taxonomy_tags = Column(ARRAY(Text), server_default="{}")
    recommended_actions = Column(Text, nullable=True)
    embedding = Column(Vector(1024), nullable=True)
    processed_at = Column(DateTime(timezone=True), server_default=func.now())
    llm_model_version = Column(Text, nullable=True)
    prompt_version = Column(Text, nullable=True)

    # Relationships
    raw_document = relationship("RawDocument", back_populates="processed_document")
    regulatory_change = relationship("RegulatoryChange", back_populates="processed_document", uselist=False)
    annotations = relationship("DocumentAnnotation", back_populates="processed_document")
    calendar_events = relationship("CalendarEvent", back_populates="processed_document")
