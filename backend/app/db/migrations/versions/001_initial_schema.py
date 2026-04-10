"""Initial schema with all tables and pgvector

Revision ID: 001
Revises:
Create Date: 2026-03-21

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    # regulatory_sources
    op.create_table(
        "regulatory_sources",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("slug", sa.Text, unique=True, nullable=False),
        sa.Column("base_url", sa.Text, nullable=False),
        sa.Column("feed_url", sa.Text, nullable=True),
        sa.Column("scrape_cadence_minutes", sa.Integer, server_default="60"),
        sa.Column("jurisdiction", sa.Text, nullable=False),
        sa.Column("category", sa.Text, nullable=False),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("last_checked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # raw_documents
    op.create_table(
        "raw_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("regulatory_sources.id"), nullable=True),
        sa.Column("external_id", sa.Text, nullable=True),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("full_text", sa.Text, nullable=True),
        sa.Column("document_url", sa.Text, nullable=False),
        sa.Column("document_type", sa.Text, nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("fetched_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("is_processed", sa.Boolean, server_default="false"),
        sa.Column("raw_metadata", postgresql.JSONB, nullable=True),
        sa.UniqueConstraint("source_id", "document_url", name="uq_raw_documents_source_url"),
    )

    # processed_documents
    op.create_table(
        "processed_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("raw_document_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("raw_documents.id"), unique=True, nullable=False),
        sa.Column("plain_summary", sa.Text, nullable=False),
        sa.Column("detailed_summary", sa.Text, nullable=False),
        sa.Column("affected_industries", postgresql.ARRAY(sa.Text), server_default="{}"),
        sa.Column("affected_jurisdictions", postgresql.ARRAY(sa.Text), server_default="{}"),
        sa.Column("key_dates", postgresql.JSONB, server_default="[]"),
        sa.Column("document_type", sa.Text, nullable=False),
        sa.Column("significance_score", sa.Float, nullable=True),
        sa.Column("significance_reasoning", sa.Text, nullable=True),
        sa.Column("taxonomy_tags", postgresql.ARRAY(sa.Text), server_default="{}"),
        sa.Column("recommended_actions", sa.Text, nullable=True),
        sa.Column("embedding", sa.Text, nullable=True),  # placeholder, altered below
        sa.Column("processed_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("llm_model_version", sa.Text, nullable=True),
        sa.Column("prompt_version", sa.Text, nullable=True),
    )
    # Alter embedding column to proper vector type
    op.execute("ALTER TABLE processed_documents ALTER COLUMN embedding TYPE vector(1024) USING embedding::vector")

    # regulatory_changes
    op.create_table(
        "regulatory_changes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("processed_document_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("processed_documents.id"), nullable=True),
        sa.Column("change_type", sa.Text, nullable=False),
        sa.Column("headline", sa.Text, nullable=False),
        sa.Column("impact_level", sa.Text, nullable=False),
        sa.Column("effective_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("comment_deadline", sa.DateTime(timezone=True), nullable=True),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("regulatory_sources.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # user_profiles
    op.create_table(
        "user_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("clerk_user_id", sa.Text, unique=True, nullable=False),
        sa.Column("email", sa.Text, nullable=False),
        sa.Column("full_name", sa.Text, nullable=True),
        sa.Column("company_name", sa.Text, nullable=True),
        sa.Column("company_size", sa.Text, nullable=True),
        sa.Column("industries", postgresql.ARRAY(sa.Text), server_default="{}"),
        sa.Column("jurisdictions", postgresql.ARRAY(sa.Text), server_default="{}"),
        sa.Column("watched_source_ids", postgresql.ARRAY(postgresql.UUID(as_uuid=True)), server_default="{}"),
        sa.Column("alert_threshold", sa.Text, server_default="high"),
        sa.Column("digest_cadence", sa.Text, server_default="weekly"),
        sa.Column("digest_day", sa.Text, server_default="monday"),
        sa.Column("digest_time", sa.Text, server_default="08:00"),
        sa.Column("timezone", sa.Text, server_default="America/New_York"),
        sa.Column("onboarded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # relevance_mappings
    op.create_table(
        "relevance_mappings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user_profiles.id"), nullable=False),
        sa.Column("regulatory_change_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("regulatory_changes.id"), nullable=False),
        sa.Column("relevance_score", sa.Float, nullable=False),
        sa.Column("relevance_reasoning", sa.Text, nullable=False),
        sa.Column("match_signals", postgresql.JSONB, server_default="{}"),
        sa.Column("user_feedback", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.UniqueConstraint("user_id", "regulatory_change_id", name="uq_relevance_mappings_user_change"),
    )

    # alerts
    op.create_table(
        "alerts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user_profiles.id"), nullable=False),
        sa.Column("regulatory_change_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("regulatory_changes.id"), nullable=False),
        sa.Column("channel", sa.Text, nullable=False),
        sa.Column("subject", sa.Text, nullable=False),
        sa.Column("body_html", sa.Text, nullable=True),
        sa.Column("body_text", sa.Text, nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("opened_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("clicked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.Text, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # digests
    op.create_table(
        "digests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user_profiles.id"), nullable=False),
        sa.Column("period_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("period_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column("headline", sa.Text, nullable=False),
        sa.Column("assembled_html", sa.Text, nullable=False),
        sa.Column("assembled_text", sa.Text, nullable=False),
        sa.Column("change_ids", postgresql.ARRAY(postgresql.UUID(as_uuid=True)), server_default="{}"),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.Text, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # Create index on embedding for vector similarity search
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_processed_documents_embedding "
        "ON processed_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)"
    )


def downgrade() -> None:
    op.drop_table("digests")
    op.drop_table("alerts")
    op.drop_table("relevance_mappings")
    op.drop_table("user_profiles")
    op.drop_table("regulatory_changes")
    op.drop_table("processed_documents")
    op.drop_table("raw_documents")
    op.drop_table("regulatory_sources")
    op.execute("DROP EXTENSION IF EXISTS vector")
