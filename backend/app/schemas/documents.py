from datetime import datetime
from typing import Any
from uuid import UUID
from pydantic import BaseModel


class RawDocumentCreate(BaseModel):
    source_id: UUID | None = None
    external_id: str | None = None
    title: str
    full_text: str | None = None
    document_url: str
    document_type: str
    published_at: datetime | None = None
    raw_metadata: dict[str, Any] | None = None
