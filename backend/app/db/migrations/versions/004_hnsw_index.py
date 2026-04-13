"""Replace ivfflat embedding index with HNSW for production-scale performance

Revision ID: 004
Revises: 003
Create Date: 2026-04-12

"""
from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop the existing ivfflat index
    op.execute("DROP INDEX IF EXISTS idx_processed_documents_embedding")

    # Create HNSW index — better recall and no need to rebuild as data grows
    op.execute(
        "CREATE INDEX idx_processed_documents_embedding_hnsw "
        "ON processed_documents "
        "USING hnsw (embedding vector_cosine_ops) "
        "WITH (m = 16, ef_construction = 64)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_processed_documents_embedding_hnsw")

    # Restore ivfflat index
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_processed_documents_embedding "
        "ON processed_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)"
    )
