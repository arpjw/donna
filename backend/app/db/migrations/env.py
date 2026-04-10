from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# Import all models so autogenerate can detect them
from app.db.session import Base  # noqa: F401
import app.models.regulatory_source  # noqa: F401
import app.models.raw_document  # noqa: F401
import app.models.processed_document  # noqa: F401
import app.models.regulatory_change  # noqa: F401
import app.models.user_profile  # noqa: F401
import app.models.relevance_mapping  # noqa: F401
import app.models.alert  # noqa: F401
import app.models.digest  # noqa: F401

from app.config import settings

config = context.config

# Override URL from settings — convert asyncpg → psycopg2 for sync migrations
sync_url = settings.DATABASE_URL.replace(
    "postgresql+asyncpg://", "postgresql+psycopg2://"
)
config.set_main_option("sqlalchemy.url", sync_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
