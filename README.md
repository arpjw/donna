# Donna — Regulatory Horizon Intelligence Platform

Donna continuously monitors regulatory sources, enriches documents with AI-generated summaries, and delivers personalized alerts and digests to in-house legal and compliance teams.

## Prerequisites

- Docker Desktop (with Docker Compose)
- Node.js 20+ (for local frontend dev without Docker)
- Python 3.11+ (for local backend dev without Docker)

## Quick Start (Docker)

```bash
# 1. Clone the repo
git clone <repo-url>
cd donna

# 2. Copy and fill in environment variables
cp .env.example .env
# Edit .env with your API keys

# 3. Start all services
docker-compose up --build

# Services will be available at:
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8000
# API Docs:  http://localhost:8000/docs
```

## Local Development (without Docker)

### Backend

```bash
cd backend

# Create virtualenv
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Seed regulatory sources
python -m app.db.seed

# Start the API server
uvicorn app.main:app --reload --port 8000

# Start Celery worker (separate terminal)
celery -A workers.celery_app worker --loglevel=info

# Start Celery beat scheduler (separate terminal)
celery -A workers.celery_app beat --loglevel=info
```

### Frontend

```bash
cd frontend

npm install
npm run dev
# Opens at http://localhost:3000
```

## Environment Variables

See `.env.example` for all required variables.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `VOYAGE_API_KEY` | Voyage AI embeddings API key |
| `CLERK_SECRET_KEY` | Clerk authentication secret |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret |
| `RESEND_API_KEY` | Resend email API key |
| `RESEND_FROM_EMAIL` | Sender email address |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (frontend) |
| `NEXT_PUBLIC_API_URL` | Backend API URL (frontend) |

## Architecture

```
donna/
├── frontend/          # Next.js 14 (App Router) + TypeScript
├── backend/
│   ├── app/           # FastAPI application
│   │   ├── routers/   # API endpoints
│   │   ├── models/    # SQLAlchemy ORM models
│   │   ├── schemas/   # Pydantic schemas
│   │   ├── services/  # LLM, embeddings, email
│   │   └── db/        # Database session + migrations
│   └── workers/       # Celery background tasks
│       ├── ingestion/ # Document fetchers
│       ├── processing/# Enrichment + embedding
│       ├── relevance/ # Relevance scoring
│       └── delivery/  # Alerts + digests
└── docker-compose.yml
```

## Database Migrations

```bash
# Run all migrations
alembic upgrade head

# Create a new migration
alembic revision --autogenerate -m "description"

# Downgrade one step
alembic downgrade -1
```

## Running Ingestion Manually

```bash
# Federal Register
python -m workers.ingestion.federal_register

# SEC EDGAR
python -m workers.ingestion.sec_edgar

# CFPB
python -m workers.ingestion.cfpb
```
