import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class Digest(Base):
    __tablename__ = "digests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"), nullable=False)
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    headline = Column(Text, nullable=False)
    assembled_html = Column(Text, nullable=False)
    assembled_text = Column(Text, nullable=False)
    change_ids = Column(ARRAY(UUID(as_uuid=True)), server_default="{}")
    sent_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(Text, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("UserProfile", back_populates="digests")
