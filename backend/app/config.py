from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str

    # Anthropic
    ANTHROPIC_API_KEY: str

    # Voyage AI
    VOYAGE_API_KEY: str

    # Clerk
    CLERK_SECRET_KEY: str
    CLERK_WEBHOOK_SECRET: str = ""

    # Resend
    RESEND_API_KEY: str
    RESEND_FROM_EMAIL: str

    # AWS S3 (optional in dev)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET: Optional[str] = None
    AWS_REGION: str = "us-east-1"

    # Sentry
    SENTRY_DSN: Optional[str] = None

    # App
    NEXT_PUBLIC_API_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:3000"
    ENVIRONMENT: str = "development"

    model_config = {"env_file": ".env", "extra": "ignore"}

    def validate(self):
        missing = []
        required = ["DATABASE_URL","REDIS_URL","ANTHROPIC_API_KEY","VOYAGE_API_KEY","CLERK_SECRET_KEY","RESEND_API_KEY","RESEND_FROM_EMAIL"]
        for field in required:
            val = getattr(self, field, None)
            if not val:
                missing.append(field)
        if missing:
            raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")


settings = Settings()
try:
    settings.validate()
except RuntimeError as e:
    import sys, logging
    logging.basicConfig()
    logging.getLogger("donna.config").critical(str(e))
    if settings.ENVIRONMENT == "production":
        sys.exit(1)



