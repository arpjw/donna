import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class DocumentAnnotation(Base):
    __tablename__ = "document_annotations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"), nullable=True)
    processed_document_id = Column(UUID(as_uuid=True), ForeignKey("processed_documents.id"), nullable=True)
    selected_text = Column(Text, nullable=False)
    note = Column(Text, nullable=True)
    color = Column(Text, nullable=False, server_default="crimson")
    char_start = Column(Integer, nullable=False)
    char_end = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("UserProfile", back_populates="annotations")
    processed_document = relationship("ProcessedDocument", back_populates="annotations")
