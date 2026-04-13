"""Add billing columns to user_profiles

Revision ID: 003
Revises: 002
Create Date: 2026-04-12

"""
from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user_profiles",
        sa.Column("subscription_status", sa.Text, nullable=True, server_default="trialing"),
    )
    op.add_column(
        "user_profiles",
        sa.Column("trial_ends_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("user_profiles", "trial_ends_at")
    op.drop_column("user_profiles", "subscription_status")
