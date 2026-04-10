import app.models  # noqa: F401 — registers all ORM mappers
import sentry_sdk
from app.config import settings as _settings
if _settings.ENVIRONMENT == "production":
    sentry_sdk.init(
        dsn=_settings.SENTRY_DSN,
        traces_sample_rate=0.2,
        environment=_settings.ENVIRONMENT,
    )

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.rate_limit import limiter, rate_limit_exceeded_handler
from app.routers import documents, changes, search, users, alerts, digests, webhooks, sources, tasks, annotations, calendar, audit

app = FastAPI(
    title="Donna API",
    description="Regulatory horizon intelligence platform",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

import os
_frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
_allowed_origins = [
    "http://localhost:3000",
    "http://frontend:3000",
    _frontend_url,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

# Routers
app.include_router(documents.router)
app.include_router(changes.router)
app.include_router(search.router)
app.include_router(users.router)
app.include_router(alerts.router)
app.include_router(digests.router)
app.include_router(webhooks.router)
app.include_router(sources.router)
app.include_router(tasks.router)
app.include_router(annotations.router)
app.include_router(calendar.router)
app.include_router(audit.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "donna-api", "environment": settings.ENVIRONMENT}


@app.get("/")
async def root():
    return {"service": "donna-api", "docs": "/docs", "version": "1.0.0"}
