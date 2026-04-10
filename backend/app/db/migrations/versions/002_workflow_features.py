"""Add workflow feature tables: compliance_tasks, document_annotations, calendar_events, audit_log

Revision ID: 002
Revises: 001
Create Date: 2026-03-21

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # compliance_tasks
    op.create_table(
        "compliance_tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user_profiles.id"), nullable=True),
        sa.Column("regulatory_change_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("regulatory_changes.id"), nullable=True),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("status", sa.Text, nullable=False, server_default="open"),
        sa.Column("priority", sa.Text, nullable=False, server_default="medium"),
        sa.Column("due_date", sa.Date, nullable=True),
        sa.Column("completed_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("NOW()"), nullable=False),
    )
    op.create_index("idx_compliance_tasks_user_id", "compliance_tasks", ["user_id"])
    op.create_index("idx_compliance_tasks_status", "compliance_tasks", ["status"])
    op.create_index("idx_compliance_tasks_due_date", "compliance_tasks", ["due_date"])

    # document_annotations
    op.create_table(
        "document_annotations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user_profiles.id"), nullable=True),
        sa.Column("processed_document_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("processed_documents.id"), nullable=True),
        sa.Column("selected_text", sa.Text, nullable=False),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column("color", sa.Text, nullable=False, server_default="crimson"),
        sa.Column("char_start", sa.Integer, nullable=False),
        sa.Column("char_end", sa.Integer, nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("NOW()"), nullable=False),
    )
    op.create_index("idx_annotations_user_document", "document_annotations", ["user_id", "processed_document_id"])

    # calendar_events
    op.create_table(
        "calendar_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user_profiles.id"), nullable=True),
        sa.Column("regulatory_change_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("regulatory_changes.id"), nullable=True),
        sa.Column("processed_document_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("processed_documents.id"), nullable=True),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("event_type", sa.Text, nullable=False),
        sa.Column("date", sa.Date, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("is_user_created", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("NOW()"), nullable=False),
    )
    op.create_index("idx_calendar_events_user_date", "calendar_events", ["user_id", "date"])

    # audit_log
    op.create_table(
        "audit_log",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user_profiles.id"), nullable=True),
        sa.Column("event_type", sa.Text, nullable=False),
        sa.Column("entity_type", sa.Text, nullable=True),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("entity_title", sa.Text, nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("NOW()"), nullable=False),
    )
    op.create_index("idx_audit_log_user_created", "audit_log", ["user_id", sa.text("created_at DESC")])
    op.create_index("idx_audit_log_event_type", "audit_log", ["event_type"])


def downgrade() -> None:
    op.drop_table("audit_log")
    op.drop_table("calendar_events")
    op.drop_table("document_annotations")
    op.drop_table("compliance_tasks")
