"""
Audit log utilities. Fire-and-forget — failures are logged and swallowed.

- add_to_session: adds entry to an existing db session (FastAPI routes).
  The entry commits together with the main operation.
- write: opens a standalone session (Celery workers, post-commit contexts).
"""
import logging
from typing import Any
from uuid import UUID

logger = logging.getLogger(__name__)


def add_to_session(
    db,
    *,
    user_id: UUID | None = None,
    event_type: str,
    entity_type: str | None = None,
    entity_id: UUID | None = None,
    entity_title: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    """Add an audit log entry to an existing session. Never raises."""
    try:
        from app.models.audit_log import AuditLog
        entry = AuditLog(
            user_id=user_id,
            event_type=event_type,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_title=entity_title,
            event_metadata=metadata or {},
        )
        db.add(entry)
    except Exception as e:
        logger.warning(f"Audit log add_to_session failed (non-fatal): {e}")


async def write(
    *,
    user_id: UUID | None = None,
    event_type: str,
    entity_type: str | None = None,
    entity_id: UUID | None = None,
    entity_title: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    """Write an audit log entry in a standalone session. Never raises."""
    try:
        from app.db.session import AsyncSessionLocal
        from app.models.audit_log import AuditLog
        async with AsyncSessionLocal() as session:
            entry = AuditLog(
                user_id=user_id,
                event_type=event_type,
                entity_type=entity_type,
                entity_id=entity_id,
                entity_title=entity_title,
                event_metadata=metadata or {},
            )
            session.add(entry)
            await session.commit()
    except Exception as e:
        logger.warning(f"Audit log write failed (non-fatal): {e}")
