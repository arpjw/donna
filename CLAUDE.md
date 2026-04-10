DONNA — Claude Code Build Prompt
Regulatory Horizon Intelligence Platform

WHAT YOU ARE BUILDING
You are building Donna — an AI-powered regulatory horizon scanning platform designed for in-house legal and compliance teams at mid-market companies (200–1,000 employees). The product is named after the character Donna Paulsen from Suits: always three steps ahead, deeply knowledgeable, calm under pressure, and surgically precise.
Donna continuously monitors regulatory sources across federal and state bodies, ingests new documents as they are published, enriches them with AI-generated summaries and structured metadata, filters them by relevance to each user's industry and jurisdiction profile, and delivers intelligently assembled alerts and digests. The product replaces the manual process of a compliance officer reading Federal Register notices, monitoring SEC enforcement actions, and translating dense legal language into actionable guidance — all by herself.
The product's tagline is: "Always three steps ahead."
This is a production-grade full-stack web application. Build it completely, correctly, and cleanly. Every layer must be real and functional — no stubs, no placeholder logic, no TODO comments left in the final product.

TARGET USER
Primary persona: VP of Legal / Chief Compliance Officer at a mid-market B2B company. She is:

Responsible for compliance across 3–6 regulatory bodies relevant to her industry
Managing this alongside other legal responsibilities, often without dedicated compliance staff
Budget-conscious — she cannot afford Thomson Reuters Regulatory Intelligence or Wolters Kluwer at enterprise pricing
Technically capable but not an engineer — she needs a clean, fast, professional interface
Accountable to her CEO and board — she needs audit trails and plain-language summaries she can forward upward

Her core pain: the regulatory landscape changes constantly, she cannot read everything, and she cannot afford to miss something that creates liability for her company.
Donna solves this by being her always-on regulatory monitor, translator, and briefing assistant.

FULL TECHNICAL ARCHITECTURE
Stack
LayerTechnologyRationaleFrontendNext.js 14 (App Router) + TypeScriptProduction-grade, SSR where needed, excellent DXStylingTailwind CSS + shadcn/uiFast, consistent, professionalBackend APIFastAPI (Python)Async-native, ideal for LLM and background job integrationDatabasePostgreSQL 15Primary data store for all structured dataVector Searchpgvector extensionKeeps embeddings in Postgres, avoids extra infrastructureTask QueueCelery + RedisBackground jobs for ingestion and processing pipelinesLLMAnthropic Claude API (claude-sonnet-4-20250514)Summarization, field extraction, digest assemblyEmbeddingsVoyage AI (voyage-law-2)Legal-domain-optimized embeddingsAuthClerkDo not build auth from scratchEmailResendTransactional email for alerts and digestsFile StorageAWS S3 (or local filesystem in dev)Raw document storage for large PDFsContainerizationDocker + docker-composeFull local dev environment
Repository Structure
donna/
├── frontend/                          # Next.js application
│   ├── app/
│   │   ├── (auth)/                    # Clerk auth routes
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx               # Main feed / dashboard
│   │   │   ├── document/[id]/         # Individual document view
│   │   │   ├── search/                # Semantic search interface
│   │   │   ├── alerts/                # Alert management
│   │   │   ├── digests/               # Digest history
│   │   │   └── settings/              # User profile and preferences
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components
│   │   ├── feed/                      # Regulatory change feed components
│   │   ├── document/                  # Document view components
│   │   ├── search/                    # Search bar and results
│   │   ├── alerts/                    # Alert cards and management
│   │   └── layout/                    # Sidebar, navbar, shell
│   ├── lib/
│   │   ├── api.ts                     # API client
│   │   └── types.ts                   # Shared TypeScript types
│   └── package.json
│
├── backend/                           # FastAPI application
│   ├── app/
│   │   ├── main.py                    # FastAPI app entrypoint
│   │   ├── routers/
│   │   │   ├── documents.py           # Document CRUD and retrieval
│   │   │   ├── changes.py             # Regulatory changes feed
│   │   │   ├── alerts.py              # Alert management
│   │   │   ├── digests.py             # Digest retrieval
│   │   │   ├── search.py              # Semantic search endpoint
│   │   │   └── users.py               # User profile and preferences
│   │   ├── models/                    # SQLAlchemy ORM models
│   │   │   ├── raw_document.py
│   │   │   ├── processed_document.py
│   │   │   ├── regulatory_change.py
│   │   │   ├── regulatory_source.py
│   │   │   ├── user_profile.py
│   │   │   ├── relevance_mapping.py
│   │   │   ├── alert.py
│   │   │   └── digest.py
│   │   ├── schemas/                   # Pydantic schemas
│   │   ├── services/
│   │   │   ├── llm.py                 # Claude API wrapper
│   │   │   ├── embeddings.py          # Voyage AI wrapper
│   │   │   ├── relevance.py           # Relevance scoring logic
│   │   │   ├── digest_assembly.py     # Digest generation
│   │   │   └── email.py               # Resend integration
│   │   ├── db/
│   │   │   ├── session.py             # SQLAlchemy session
│   │   │   └── migrations/            # Alembic migrations
│   │   └── config.py                  # Settings via pydantic-settings
│   ├── workers/
│   │   ├── celery_app.py              # Celery configuration
│   │   ├── ingestion/
│   │   │   ├── federal_register.py    # Federal Register API ingestion
│   │   │   ├── sec_edgar.py           # SEC EDGAR ingestion
│   │   │   ├── cfpb.py                # CFPB newsroom scraper
│   │   │   └── base.py                # Base ingestion class
│   │   ├── processing/
│   │   │   ├── enrichment.py          # LLM enrichment pipeline
│   │   │   └── embedding.py           # Embedding generation
│   │   ├── relevance/
│   │   │   └── scorer.py              # Relevance scoring worker
│   │   └── delivery/
│   │       ├── alert_sender.py        # Real-time alert dispatch
│   │       └── digest_builder.py      # Digest assembly and send
│   └── requirements.txt
│
├── docker-compose.yml
├── .env.example
└── README.md

DATABASE SCHEMA
Implement every table below exactly. Use Alembic for migrations.
regulatory_sources
sqlCREATE TABLE regulatory_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    base_url TEXT NOT NULL,
    feed_url TEXT,
    scrape_cadence_minutes INTEGER DEFAULT 60,
    jurisdiction TEXT NOT NULL,
    category TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
raw_documents
sqlCREATE TABLE raw_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES regulatory_sources(id),
    external_id TEXT,
    title TEXT NOT NULL,
    full_text TEXT,
    document_url TEXT NOT NULL,
    document_type TEXT NOT NULL,
    published_at TIMESTAMPTZ,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    is_processed BOOLEAN DEFAULT FALSE,
    raw_metadata JSONB,
    UNIQUE(source_id, document_url)
);
processed_documents
sqlCREATE TABLE processed_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_document_id UUID UNIQUE REFERENCES raw_documents(id),
    plain_summary TEXT NOT NULL,
    detailed_summary TEXT NOT NULL,
    affected_industries TEXT[] DEFAULT '{}',
    affected_jurisdictions TEXT[] DEFAULT '{}',
    key_dates JSONB DEFAULT '[]',
    document_type TEXT NOT NULL,
    significance_score FLOAT,
    significance_reasoning TEXT,
    taxonomy_tags TEXT[] DEFAULT '{}',
    recommended_actions TEXT,
    embedding vector(1024),
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    llm_model_version TEXT,
    prompt_version TEXT
);
regulatory_changes
sqlCREATE TABLE regulatory_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processed_document_id UUID REFERENCES processed_documents(id),
    change_type TEXT NOT NULL,
    headline TEXT NOT NULL,
    impact_level TEXT NOT NULL,
    effective_date TIMESTAMPTZ,
    comment_deadline TIMESTAMPTZ,
    source_id UUID REFERENCES regulatory_sources(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
user_profiles
sqlCREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    company_name TEXT,
    company_size TEXT,
    industries TEXT[] DEFAULT '{}',
    jurisdictions TEXT[] DEFAULT '{}',
    watched_source_ids UUID[] DEFAULT '{}',
    alert_threshold TEXT DEFAULT 'high',
    digest_cadence TEXT DEFAULT 'weekly',
    digest_day TEXT DEFAULT 'monday',
    digest_time TEXT DEFAULT '08:00',
    timezone TEXT DEFAULT 'America/New_York',
    onboarded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
relevance_mappings
sqlCREATE TABLE relevance_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id),
    regulatory_change_id UUID REFERENCES regulatory_changes(id),
    relevance_score FLOAT NOT NULL,
    relevance_reasoning TEXT NOT NULL,
    match_signals JSONB DEFAULT '{}',
    user_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, regulatory_change_id)
);
alerts
sqlCREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id),
    regulatory_change_id UUID REFERENCES regulatory_changes(id),
    channel TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT,
    body_text TEXT,
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
digests
sqlCREATE TABLE digests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    headline TEXT NOT NULL,
    assembled_html TEXT NOT NULL,
    assembled_text TEXT NOT NULL,
    change_ids UUID[] DEFAULT '{}',
    sent_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INGESTION LAYER — DETAILED IMPLEMENTATION
Base Ingestion Class (workers/ingestion/base.py)
Every source ingester inherits from a base class with the following interface:
pythonclass BaseIngester:
    source_slug: str

    async def fetch_new_documents(self) -> list[RawDocumentCreate]:
        raise NotImplementedError

    async def run(self):
        # 1. Load source record from DB by slug
        # 2. Call fetch_new_documents()
        # 3. For each document, upsert into raw_documents (skip if URL already exists)
        # 4. Update source.last_checked_at
        # 5. Enqueue processing job for each new raw_document
Federal Register Ingester (workers/ingestion/federal_register.py)
Use the Federal Register REST API at https://www.federalregister.gov/api/v1/. Key endpoints:

GET /documents — list documents with filters for publication_date[gte], type[] (RULE, PRORULE, NOTICE, PRESDOCU)
GET /documents/{document_number} — full document details

Fetch documents published since source.last_checked_at. For each:

Extract: document_number, title, type, publication_date, html_url, abstract, action, agencies, effective_on, comment_date
Fetch full text from full_text_xml_url if available, otherwise use abstract
Map document type: RULE → "final_rule", PRORULE → "proposed_rule", NOTICE → "guidance"
Store all extra fields in raw_metadata JSONB

SEC EDGAR Ingester (workers/ingestion/sec_edgar.py)
Use EDGAR full-text search API at https://efts.sec.gov/LATEST/search-index?q=...&dateRange=custom&startdt=...&enddt=...&forms=...
Target form types: 33-8, 34-8, enforcement releases, press releases. Also scrape https://www.sec.gov/litigation/litreleases/ for enforcement actions.
CFPB Ingester (workers/ingestion/cfpb.py)
Scrape https://www.consumerfinance.gov/rules-policy/final-rules/ and https://www.consumerfinance.gov/rules-policy/rules-under-development/ using Playwright. Also monitor the newsroom at https://www.consumerfinance.gov/about-us/newsroom/.
Celery Beat Schedule
pythonCELERYBEAT_SCHEDULE = {
    "ingest-federal-register": {
        "task": "workers.ingestion.federal_register.run",
        "schedule": crontab(minute=0, hour="*/4"),
    },
    "ingest-sec-edgar": {
        "task": "workers.ingestion.sec_edgar.run",
        "schedule": crontab(minute=30, hour="*/2"),
    },
    "ingest-cfpb": {
        "task": "workers.ingestion.cfpb.run",
        "schedule": crontab(minute=0, hour="*/12"),
    },
    "send-daily-digests": {
        "task": "workers.delivery.digest_builder.send_daily_digests",
        "schedule": crontab(minute=0, hour=8),
    },
    "send-weekly-digests": {
        "task": "workers.delivery.digest_builder.send_weekly_digests",
        "schedule": crontab(minute=0, hour=8, day_of_week="monday"),
    },
}
```

---

## PROCESSING AND ENRICHMENT LAYER — DETAILED IMPLEMENTATION

### LLM Enrichment Pipeline (`workers/processing/enrichment.py`)

For each unprocessed `raw_document`, make a single structured Claude API call that returns all enrichment fields in one shot. Use the following prompt structure:
```
You are a regulatory intelligence analyst. Analyze the following regulatory document and extract structured information.

Document Title: {title}
Document Type: {document_type}
Source: {source_name}
Published: {published_at}

Full Text:
{full_text}

Return a JSON object with exactly these fields:
{
  "plain_summary": "2-3 sentence plain language summary a non-lawyer executive can understand",
  "detailed_summary": "Comprehensive 4-6 paragraph structured summary including: what changed, who is affected, key requirements, timeline, and enforcement implications",
  "affected_industries": ["list", "of", "industries"],
  "affected_jurisdictions": ["federal", "CA", "NY"],
  "key_dates": [
    {"label": "Comment deadline", "date": "YYYY-MM-DD"},
    {"label": "Effective date", "date": "YYYY-MM-DD"}
  ],
  "significance_score": 0.0,
  "significance_reasoning": "One sentence explaining the significance score",
  "taxonomy_tags": ["AML", "privacy", "data_security"],
  "recommended_actions": "Plain language: specifically what a compliance officer should do in response to this document, within what timeframe",
  "change_type": "proposed_rule|final_rule|amendment|enforcement_action|guidance_update",
  "impact_level": "high|medium|low",
  "headline": "One-line description of the change for a feed"
}

Return only valid JSON. No preamble, no explanation, no markdown.
```

Parse the response, validate all fields, write to `processed_documents`, then create the corresponding `regulatory_change` record.

### Embedding Generation (`workers/processing/embedding.py`)

After enrichment, generate an embedding using Voyage AI's `voyage-law-2` model. Input to embed:
```
{headline}. {plain_summary}. Tags: {taxonomy_tags joined}. Industries: {affected_industries joined}. Jurisdictions: {affected_jurisdictions joined}.
```

Store the 1024-dimension vector in `processed_documents.embedding` via pgvector.

---

## RELEVANCE AND PERSONALIZATION LAYER — DETAILED IMPLEMENTATION

### Relevance Scorer (`workers/relevance/scorer.py`)

After a regulatory change is created, run relevance scoring against all active user profiles. For each user:

**Step 1: Hard filters (must pass all to proceed)**
- Industry match: `user.industries` intersects `change.affected_industries` OR change is federal with broad applicability
- Jurisdiction match: `user.jurisdictions` intersects `change.affected_jurisdictions`
- Source watch: change source is in `user.watched_source_ids` OR user has no explicit source watches

**Step 2: Semantic similarity**
- Embed the user profile as: `"{company_name} is a {industries} company operating in {jurisdictions}. Key compliance concerns: {industries and jurisdictions combined}."`
- Compute cosine similarity between user embedding and document embedding
- Semantic score threshold: 0.65 to surface, weight it 40% of final score

**Step 3: Significance boost**
- Apply `significance_score` from processed document as a 30% weight
- Impact level multiplier: high=1.0, medium=0.7, low=0.4

**Step 4: Write relevance mapping**
- If final relevance score >= 0.5, write to `relevance_mappings`
- Include `match_signals` JSONB with all intermediate scores
- Include `relevance_reasoning` as a plain-language explanation of why this was flagged

**Step 5: Trigger alert if warranted**
- If `impact_level = "high"` AND `user.alert_threshold in ["high", "medium", "all"]`: enqueue real-time alert
- If `impact_level = "medium"` AND `user.alert_threshold in ["medium", "all"]`: enqueue real-time alert
- Otherwise: include in next digest only

---

## ALERTING AND DIGEST LAYER — DETAILED IMPLEMENTATION

### Real-Time Alert (`workers/delivery/alert_sender.py`)

For each alert in queue:

1. Pull the regulatory change, processed document, and user profile
2. Compose a structured email with:
   - Subject: `[Donna] {impact_level.upper()}: {headline}`
   - Header: Change type badge, impact level badge, source name
   - Body: `plain_summary` in large text
   - Section: "What this means for {company_name}" — pull `recommended_actions`
   - Section: "Key dates" — render `key_dates` as a clean table
   - Section: "Why Donna flagged this" — `relevance_reasoning`
   - Footer: Link to full document view, link to source, link to adjust preferences
3. Send via Resend API
4. Write send record to `alerts` table

### Digest Assembly (`workers/delivery/digest_builder.py`)

For each user scheduled for a digest:

1. Pull all `relevance_mappings` for the user in the period where no real-time alert was sent
2. Sort by `relevance_score DESC`, then `significance_score DESC`
3. Take top 10 changes maximum
4. Make a Claude API call to assemble the digest:
```
You are Donna, a regulatory intelligence platform. Assemble a weekly regulatory briefing for {full_name} at {company_name}, a {industries} company.

Here are this week's relevant regulatory developments, in order of importance:

{for each change: headline, plain_summary, key_dates, recommended_actions}

Write a professional weekly briefing email with:
1. A brief executive opening (2 sentences: what kind of week it was regulatorily)
2. Each development as a numbered item with: bold headline, 2-sentence summary, key date if present, one-line action item
3. A closing line

Be concise, professional, and direct. No filler. Write as if you are a sharp in-house counsel briefing a CEO.

Wrap in HTML email template, send via Resend, write to digests table


API LAYER — FASTAPI ENDPOINTS
Implement all of the following endpoints fully:
Documents

GET /api/documents — paginated list of processed documents, filterable by source_id, document_type, impact_level, taxonomy_tags, date_from, date_to
GET /api/documents/{id} — full document view with all enrichment fields
GET /api/documents/{id}/related — semantic similarity search for related documents (top 5 by cosine distance)

Regulatory Changes Feed

GET /api/changes — paginated feed of regulatory changes for the authenticated user, filtered by their relevance mappings, sorted by relevance_score DESC
GET /api/changes/{id} — individual change detail

Search

POST /api/search — body: {query: string, filters: {industries?, jurisdictions?, document_types?, date_from?, date_to?}}. Embed the query, run pgvector similarity search against processed_documents.embedding, return top 20 results with similarity scores

Alerts

GET /api/alerts — alert history for authenticated user
PATCH /api/alerts/{id}/feedback — body: {feedback: "relevant" | "not_relevant"}. Write to relevance_mappings.user_feedback

Digests

GET /api/digests — digest history for authenticated user
GET /api/digests/{id} — full digest content

User Profile

GET /api/users/me — current user profile
PUT /api/users/me — update profile (industries, jurisdictions, alert preferences, digest cadence)
POST /api/users/me/onboard — complete onboarding flow


FRONTEND — PAGE AND COMPONENT SPECIFICATIONS
Design Direction
Donna's visual identity is Harvey-tier legal authority meets calm reading environment. The reference point is Harvey.ai — dark, typographically confident, no decorative noise, built to feel correct rather than friendly. Donna is Harvey's sharper, more focused counterpart: purpose-built for a compliance officer who needs a briefing delivered with precision, not a chat interface.
The defining structural choice is the dual-surface system: the shell and navigation live in near-black, while document views flip to a warm white surface. Every time a user opens a document, they feel like they are opening a well-typeset legal brief. This contrast is Donna's most distinctive UX moment — protect it.
Color palette — Dark Shell

Shell/sidebar background: #0C0C0C
Main surface background: #111111
Card/panel background: #161616
Border: #262626
Text primary: #F0EEE9
Text secondary: #737373
Text tertiary: #404040

Color palette — Accent System

Crimson (primary accent): #C0392B — active nav state, feed card left-border hover, CTA buttons, HIGH impact badges
Crimson low opacity: rgba(192, 57, 43, 0.10) — hover state backgrounds, selected card surfaces
White (secondary accent): #F0EEE9 — headlines, key data points, anything commanding attention within a dark surface

Color palette — Impact Severity

HIGH: #C0392B
MEDIUM: #D4893A
LOW: #5A9E6F

Color palette — Document View (light surface)

Background: #F7F6F3
Text primary: #111111
Text secondary: #5C5C5C
Accent: #C0392B
Border: #E2E0DB

Typography

Display/headlines: Cormorant Garamond — classical, old-world legal authority. Used for feed card headlines, document titles, section headers, the Donna wordmark. Load from Google Fonts.
UI/body: Geist — sharp, modern, built for interfaces. Used for all body copy, labels, nav items, form fields, metadata text.
Monospace: Geist Mono — document IDs, docket numbers, dates, significance scores, any data that reads as a code or reference.

Layout

Collapsible left sidebar:

Expanded state: 220px wide. Logo mark + "Donna" wordmark in Cormorant Garamond at top. Text-only nav links. Active state: 2px left border in #C0392B, text in #F0EEE9. Inactive: text in #737373. User context pinned to bottom. Collapse chevron at bottom.
Collapsed state: 56px wide. Logo mark only. Icon-only nav with tooltips on hover. Collapse toggle at bottom.
Transition: 200ms ease width animation.


Main content area: max-width: 860px, centered, padding: 40px 48px
Document view: #F7F6F3 background, max-width: 720px, centered, padding: 48px 56px
Card system: 1px solid #262626 border, border-radius: 6px, no box-shadow
Whitespace: generous. Minimum 24px between cards. Section headers have 40px top margin.

Key interaction details

Feed card hover: left border transitions from transparent to 2px solid #C0392B. Background shifts to rgba(192, 57, 43, 0.06). Transition 150ms ease.
Impact badges: pill-shaped, Geist Mono uppercase, font-size: 10px, letter-spacing: 0.08em
Search: ⌘K opens a full-screen command palette overlay. Dark background, centered input, results below. Esc closes.
Sidebar collapse: chevron at bottom toggles state. Persisted in localStorage. 200ms ease transition.
Document view entry: background transitions from #111111 to #F7F6F3. This is the defining UX moment.
Loading skeletons: dark surfaces use #1E1E1E shimmer blocks. Light surfaces use #EBEBEB.

What Donna explicitly does NOT do

No gradients anywhere in the shell
No purple, no teal, no blue — palette is near-black, warm white, and crimson only
No border-radius above 6px
No entrance animations on the feed, no bouncing loaders
No sidebar icons with text labels when expanded — text-only nav
No heavy drop shadows — elevation through color only
No decorative illustration or abstract background texture
No dashboard widgets or data visualization unless the data genuinely demands it

Pages
Dashboard (/)
The primary feed. Shows regulatory changes relevant to the authenticated user, sorted by relevance score.
Components:

FeedHeader — "Your regulatory feed" + last updated timestamp + filter controls
ImpactFilter — tabs for All / High / Medium / Low
SourceFilter — multi-select for regulatory bodies
ChangeCard (repeating) — displays:

Impact badge (HIGH / MEDIUM / LOW)
Change type badge (PROPOSED RULE / FINAL RULE / ENFORCEMENT / GUIDANCE)
Source name + published date
Headline (Cormorant Garamond, 20px, #F0EEE9)
plain_summary
Key date pill if present
Relevance reasoning callout: "Flagged because: [reasoning]"
Link to full document view


EmptyState — shown if no relevant changes

Document View (/document/[id])
Full document analysis page. Background switches to #F7F6F3.
Components:

DocumentHeader — title, source, published date, document type badge, impact badge
QuickStats bar — significance score, affected industries, affected jurisdictions, key dates
PlainSummary — large-text callout: "In plain language"
DetailedSummary — full structured summary as rich text
RecommendedActions — "What to do" section
KeyDates — clean timeline component
TaxonomyTags — pill tags
RelatedDocuments — top 5 semantically similar documents
SourceLink — button to original source

Search (/search)

SearchBar — full-width, ⌘K shortcut, placeholder "Search regulations, topics, requirements..."
SearchFilters — collapsible: industries, jurisdictions, document types, date range
SearchResults — cards with similarity score, headline, plain summary, source
SearchEmpty — example queries

Alerts (/alerts)

AlertHistory — chronological list with status (sent, opened, clicked)
AlertCard — headline, sent date, channel, feedback buttons
AlertPreferences — inline settings

Digests (/digests)

DigestList — past digests with period label and send date
DigestView — renders assembled digest HTML inline

Settings (/settings)

ProfileForm — company name, company size, full name
IndustrySelector — multi-select searchable: fintech, healthcare, saas, manufacturing, retail, real estate, energy, education
JurisdictionSelector — multi-select: Federal + all 50 states
SourceWatcher — optional specific regulatory bodies
AlertSettings — threshold, channels
DigestSettings — cadence, day, time, timezone

Onboarding Flow
Multi-step for new users after Clerk signup:

Welcome — "Donna monitors the regulatory landscape so you don't have to."
Your industry — multi-select industries
Your jurisdictions — multi-select states + federal
Alert preferences — threshold and cadence
Done — "Donna is setting up your feed." Trigger background relevance scoring job.


ENVIRONMENT VARIABLES
env# Database
DATABASE_URL=postgresql+asyncpg://donna:donna@localhost:5432/donna

# Redis
REDIS_URL=redis://localhost:6379/0

# Anthropic
ANTHROPIC_API_KEY=

# Voyage AI
VOYAGE_API_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=donna@yourdomain.com

# AWS S3 (optional in dev)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=us-east-1

# App
NEXT_PUBLIC_API_URL=http://localhost:8000
ENVIRONMENT=development

DOCKER COMPOSE
yamlversion: "3.9"
services:
  postgres:
    image: pgvector/pgvector:pg15
    environment:
      POSTGRES_USER: donna
      POSTGRES_PASSWORD: donna
      POSTGRES_DB: donna
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    env_file: .env
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  worker:
    build: ./backend
    depends_on:
      - postgres
      - redis
    env_file: .env
    command: celery -A workers.celery_app worker --loglevel=info

  beat:
    build: ./backend
    depends_on:
      - postgres
      - redis
    env_file: .env
    command: celery -A workers.celery_app beat --loglevel=info

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    env_file: .env
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev

volumes:
  postgres_data:

BUILD ORDER
Build in exactly this sequence. Do not move to the next step until the current step is fully working and testable.

Docker environment — postgres (with pgvector), redis, backend skeleton, frontend skeleton all running via docker-compose
Database migrations — all tables created via Alembic, pgvector extension enabled
Regulatory sources seed data — seed regulatory_sources with Federal Register, SEC EDGAR, CFPB, and at least 3 state-level sources
Federal Register ingester — working end-to-end: fetches real documents, writes to raw_documents
LLM enrichment pipeline — processes raw_documents, writes enriched data to processed_documents and regulatory_changes
Embedding generation — embeds all processed documents, verifies pgvector storage
Basic FastAPI endpoints — /api/documents, /api/changes, /api/search working against real data
Clerk auth — frontend auth flow working, user creation webhook writing to user_profiles
Frontend dashboard — feed page showing real regulatory changes from the API
Document view page — full document analysis view working
Onboarding flow — multi-step onboarding writing to user_profiles
Relevance scoring — scorer running against real user profiles and real documents, writing to relevance_mappings
Personalized feed — dashboard now shows only relevant changes for the authenticated user
Alert sending — real-time alerts via Resend for high-impact changes
Digest assembly — weekly digest generation and sending working end-to-end
Search page — semantic search working against real embeddings
Settings page — profile and preference management working
Alerts and digests pages — history views working
SEC EDGAR and CFPB ingesters — additional source coverage
Polish — loading states, error states, empty states, mobile responsiveness, final design pass


QUALITY STANDARDS

Every API endpoint returns proper HTTP status codes and structured error responses
All database queries use parameterized inputs — no raw string interpolation
Every Celery task has error handling and retry logic with exponential backoff
LLM calls have timeout handling, retry on rate limit, and fallback behavior if parsing fails
The frontend has loading skeletons for all data-fetching states
No any types in TypeScript — all API responses are fully typed
All environment variables are validated at startup via pydantic-settings — the app refuses to start if required vars are missing
The README documents every setup step required to run the project locally from a clean checkout


WHAT SUCCESS LOOKS LIKE
When complete, a compliance officer should be able to:

Sign up, complete onboarding in under 3 minutes
See a personalized feed of regulatory changes relevant to her industry and jurisdictions, with AI-generated plain-language summaries
Click into any change and read a full structured analysis including what she should actually do
Search for any regulatory topic and get semantically relevant results
Receive a weekly digest email that reads like a briefing written by a sharp legal analyst
Receive real-time email alerts for high-impact changes the day they are published
Adjust her preferences and watch the feed update accordingly

Donna should feel like the smartest, most prepared member of her legal team — always three steps ahead.


# DONNA — Workflow Features Addendum
## Append this to the bottom of CLAUDE.md before starting this session

---

## CONTEXT

Donna is already built and running. The following pages and systems are fully functional:
- Regulatory feed (dashboard) with 689+ ingested documents
- Document view with AI-generated summaries
- Search with semantic embeddings
- Alerts and Digests pages
- Settings page with industry/jurisdiction selectors
- Full ingestion pipeline (Federal Register, SEC EDGAR, CFPB)
- LLM enrichment pipeline via Claude API
- Relevance scoring and personalization layer
- Clerk auth, FastAPI backend, PostgreSQL with pgvector, Celery workers

You are now adding four new workflow features on top of the existing system. Do not touch or refactor anything that is already working. Add to it.

---

## FEATURE 1: TASK / ACTION TRACKING

### What it does
Allows the compliance officer to convert any flagged regulatory change into a tracked task with a title, description, priority, due date, and status. Tasks are pre-populated from the change's AI-generated `recommended_actions` field and can be edited before saving.

### Database — add this table via a new Alembic migration

```sql
CREATE TABLE compliance_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id),
    regulatory_change_id UUID REFERENCES regulatory_changes(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open',
    -- valid values: open, in_progress, complete, dismissed
    priority TEXT DEFAULT 'medium',
    -- valid values: high, medium, low
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_compliance_tasks_user_id ON compliance_tasks(user_id);
CREATE INDEX idx_compliance_tasks_status ON compliance_tasks(status);
CREATE INDEX idx_compliance_tasks_due_date ON compliance_tasks(due_date);
```

### Backend — new router `backend/app/routers/tasks.py`

Implement all endpoints fully:

- `GET /api/tasks` — list all tasks for authenticated user, filterable by `status`, `priority`, `due_before`, `due_after`. Returns tasks sorted by `due_date ASC NULLS LAST`, then `created_at DESC`.
- `POST /api/tasks` — create a task. Body: `{regulatory_change_id?, title, description?, priority, due_date?}`. If `regulatory_change_id` is provided, validate it belongs to a change the user has a relevance mapping for.
- `GET /api/tasks/{id}` — individual task detail
- `PATCH /api/tasks/{id}` — update any field: title, description, status, priority, due_date. When status is set to "complete", automatically set `completed_at` to NOW().
- `DELETE /api/tasks/{id}` — soft delete by setting status to "dismissed"
- `GET /api/tasks/stats` — returns `{open: int, in_progress: int, complete: int, overdue: int}` for the authenticated user. Overdue = open or in_progress tasks with `due_date < TODAY`.

### Frontend — new page `frontend/app/(dashboard)/tasks/page.tsx`

**Layout:** Two-column. Left column (340px) is a filter/stats panel. Right column is the task list.

**Stats panel (top of left column):**
Four stat chips in a 2x2 grid:
- Open (count, neutral color)
- In Progress (count, amber `#D4893A`)
- Complete (count, green `#5A9E6F`)
- Overdue (count, crimson `#C0392B`)

**Filter panel (below stats):**
- Status filter: pill toggles for All / Open / In Progress / Complete
- Priority filter: All / High / Medium / Low
- Due date filter: All / Due this week / Due this month / Overdue

**Task list (right column):**
Each task renders as a `TaskCard` component:
- Priority indicator: left border color (high=crimson, medium=amber, low=green)
- Task title in Cormorant Garamond, 18px
- Description truncated to 2 lines
- Status badge (pill, Geist Mono uppercase)
- Due date in Geist Mono. If overdue: show in crimson. If due within 3 days: show in amber.
- If linked to a regulatory change: show the source name and a link to the document
- Three-dot menu: Edit, Mark complete, Dismiss

**Empty state:** "No tasks yet. Create one from any regulatory change in your feed."

**Task creation:** Does NOT happen on this page. See feed card and document view integration below.

### Feed card integration

On every `ChangeCard` in the feed, add a "Create task" button in the card footer (text button, Geist, `#737373`, crimson on hover). Clicking opens a `CreateTaskSlideOver` component.

`CreateTaskSlideOver`:
- Slides in from the right, `320px` wide, dark background `#161616`, `1px` left border `#262626`
- Pre-populated fields:
  - Title: the regulatory change headline
  - Description: the `recommended_actions` field from the processed document
  - Priority: maps from impact_level (high→high, medium→medium, low→low)
  - Due date: empty by default, but if a comment deadline exists in `key_dates`, pre-fill it
- User can edit all fields before saving
- Save button: crimson, "Create task"
- On success: show a brief toast notification "Task created", close the slide-over

### Document view integration

Same "Create task" button and slide-over in the `RecommendedActions` section of the document view. Same behavior.

### Sidebar nav

Add "Tasks" as a new nav item between "Search" and "Alerts". Show a count badge with the number of open + in_progress tasks if > 0. Badge: small crimson pill, Geist Mono, white text.

---

## FEATURE 2: DOCUMENT ANNOTATION

### What it does
Allows the user to highlight any passage in the document view and attach a color-coded note. Annotations persist across sessions and are visible as a summary list in a sidebar panel on the document view page.

### Database — add this table via a new Alembic migration

```sql
CREATE TABLE document_annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id),
    processed_document_id UUID REFERENCES processed_documents(id),
    selected_text TEXT NOT NULL,
    note TEXT,
    color TEXT DEFAULT 'crimson',
    -- valid values: crimson, amber, green
    char_start INTEGER NOT NULL,
    char_end INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_annotations_user_document ON document_annotations(user_id, processed_document_id);
```

### Backend — new router `backend/app/routers/annotations.py`

- `GET /api/annotations?document_id={id}` — all annotations for the authenticated user on a specific document
- `POST /api/annotations` — create annotation. Body: `{processed_document_id, selected_text, note?, color?, char_start, char_end}`
- `PATCH /api/annotations/{id}` — update note or color
- `DELETE /api/annotations/{id}` — delete annotation

### Frontend — document view integration

**Text selection behavior:**
When the user selects text within the `DetailedSummary` or `PlainSummary` sections of the document view, a floating `AnnotationToolbar` appears near the selection. This toolbar contains:
- Three color dot buttons: crimson, amber, green
- A text input for the note (placeholder: "Add a note...")
- A save button (checkmark icon)
- A close button (X icon)

Clicking a color dot without a note saves a highlight-only annotation. Adding a note and saving creates a highlight with an attached note.

**Rendering highlights:**
When the document view loads, fetch all annotations for that document via `GET /api/annotations?document_id={id}`. Render each annotation as a `<mark>` element with background color:
- crimson: `rgba(192, 57, 43, 0.20)`
- amber: `rgba(212, 137, 58, 0.20)`
- green: `rgba(90, 158, 111, 0.20)`

Hovering a highlighted passage shows the attached note in a tooltip above the text.

**Annotations panel:**
Add a collapsible right sidebar panel to the document view titled "Your notes". Width `280px`, same `#F7F6F3` background as the document surface but with a `1px left border #E2E0DB` separating it. The panel lists all annotations on the current document in document order (sorted by `char_start`). Each item shows:
- The highlighted text truncated to one line, with the color indicator as a left border
- The note text if present
- Delete button on hover (X icon, `#737373`)

If no annotations exist: "Select any text to add a highlight or note."

Panel toggle: a small "Notes" button in the document view header (top right). Persists state in `localStorage` per document.

---

## FEATURE 3: COMPLIANCE CALENDAR

### What it does
Aggregates all key regulatory dates (comment deadlines, effective dates, filing requirements) extracted from documents into a unified calendar view. Users can also add their own manual deadlines. Upcoming events within 14 days show a warning indicator on the dashboard feed.

### Database — add this table via a new Alembic migration

```sql
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id),
    regulatory_change_id UUID REFERENCES regulatory_changes(id),
    processed_document_id UUID REFERENCES processed_documents(id),
    title TEXT NOT NULL,
    event_type TEXT NOT NULL,
    -- comment_deadline, effective_date, filing_deadline, review_date, custom
    date DATE NOT NULL,
    description TEXT,
    is_user_created BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calendar_events_user_date ON calendar_events(user_id, date);
```

### Auto-population via enrichment pipeline

Modify `workers/processing/enrichment.py`: after writing a `regulatory_change` record, iterate over the `key_dates` JSONB array on the processed document. For each key date, create a `calendar_event` for every user who has a `relevance_mapping` for that change. Map the date label to `event_type`:
- Contains "comment" → `comment_deadline`
- Contains "effective" → `effective_date`
- Contains "filing" → `filing_deadline`
- Otherwise → `review_date`

This runs automatically for all future documents. Do not backfill existing documents.

### Backend — new router `backend/app/routers/calendar.py`

- `GET /api/calendar/events` — list events for authenticated user, filterable by `date_from`, `date_to`, `event_type`. Returns sorted by `date ASC`.
- `GET /api/calendar/upcoming` — events in the next 30 days for the authenticated user. Used by the dashboard feed for warning indicators.
- `POST /api/calendar/events` — create a manual event. Body: `{title, event_type: "custom", date, description?, regulatory_change_id?}`
- `PATCH /api/calendar/events/{id}` — update manual events only (`is_user_created = true`). Return 403 for auto-generated events.
- `DELETE /api/calendar/events/{id}` — delete manual events only.

### Frontend — new page `frontend/app/(dashboard)/calendar/page.tsx`

**View toggle:** Month view and List view. Default to List view as it is more useful for compliance work.

**Month view:**
Standard calendar grid. Each day cell shows colored dot indicators for events that day:
- Comment deadline: crimson dot
- Effective date: amber dot
- Filing deadline: green dot
- Custom: white dot

Clicking a day with events opens a popover listing them. Clicking an event in the popover opens the event detail side panel.

**List view (default):**
Groups events by month. Each event renders as a row:
- Date in Geist Mono (`#737373`), left-aligned, `80px` wide
- Event type badge (color-coded pill, Geist Mono uppercase)
- Event title in Geist, `#F0EEE9`
- Source regulation name in `#737373` if auto-generated, linked to document view
- "CUSTOM" badge in white if user-created
- Edit/delete icons on hover for user-created events

**Add event button:**
Top right of the page. Opens a `CreateEventModal`:
- Title input
- Date picker
- Event type selector (Comment deadline / Effective date / Filing deadline / Custom)
- Description textarea
- Optional: link to a regulatory change (searchable dropdown)

**Empty state:** "No upcoming regulatory dates. Donna will automatically populate this calendar as new documents are processed."

### Dashboard feed integration

Modify `ChangeCard`: after fetching the feed, also fetch `GET /api/calendar/upcoming`. For any feed card whose `regulatory_change_id` has events in the next 14 days, show a small calendar indicator below the headline:
- Clock icon + "Comment deadline in X days" (if within 14 days)
- Color: crimson if ≤ 7 days, amber if 8–14 days

### Sidebar nav

Add "Calendar" as a new nav item between "Tasks" and "Alerts". Show a count badge with the number of events in the next 7 days if > 0. Same crimson pill badge style as Tasks.

---

## FEATURE 4: AUDIT TRAIL / REPORTING

### What it does
Automatically logs every significant action Donna takes and every action the user takes. Provides an exportable compliance report in PDF format covering a selected time period. Lives in Settings as a dedicated tab.

### Database — add this table via a new Alembic migration

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id),
    event_type TEXT NOT NULL,
    -- donna_flagged_change, alert_sent, digest_sent, task_created,
    -- task_completed, task_dismissed, annotation_added, document_viewed,
    -- feedback_given, calendar_event_created, settings_updated
    entity_type TEXT,
    -- regulatory_change, document, task, alert, digest, annotation, calendar_event
    entity_id UUID,
    entity_title TEXT,
    -- denormalized title so the log is readable even if entity is deleted
    metadata JSONB DEFAULT '{}',
    -- flexible extra context: {source_name, impact_level, change_type, etc.}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_created ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);
```

### Auto-logging — instrument the following locations

Add audit log writes at each of these points. These should be fire-and-forget (do not let logging failures affect the primary operation):

- `workers/relevance/scorer.py` — after writing a relevance mapping: log `donna_flagged_change` with `{source_name, impact_level, change_type, relevance_score}`
- `workers/delivery/alert_sender.py` — after sending an alert: log `alert_sent` with `{channel, subject}`
- `workers/delivery/digest_builder.py` — after sending a digest: log `digest_sent` with `{period_start, period_end, change_count}`
- `backend/app/routers/tasks.py` — on POST: log `task_created`. On PATCH status→complete: log `task_completed`. On DELETE: log `task_dismissed`.
- `backend/app/routers/annotations.py` — on POST: log `annotation_added`
- `backend/app/routers/documents.py` — on GET /{id}: log `document_viewed`
- `backend/app/routers/alerts.py` — on PATCH feedback: log `feedback_given` with `{feedback_value}`
- `backend/app/routers/calendar.py` — on POST: log `calendar_event_created`
- `backend/app/routers/users.py` — on PUT /me: log `settings_updated`

### Backend — new router `backend/app/routers/audit.py`

- `GET /api/audit` — paginated audit log for authenticated user, filterable by `event_type`, `date_from`, `date_to`. Returns sorted by `created_at DESC`. Page size 50.
- `GET /api/audit/stats` — summary stats for a date range: `{total_events, changes_flagged, alerts_sent, tasks_created, tasks_completed, documents_viewed, digests_sent}`
- `POST /api/audit/export` — body: `{date_from, date_to, format: "pdf"}`. Generates a compliance report PDF and returns it as a file download.

### PDF report generation

Use `reportlab` or `weasyprint` in Python to generate the export PDF. The report structure:

**Page 1 — Cover**
- Donna wordmark (text-based, Donna in large serif)
- "Regulatory Compliance Activity Report"
- Company name, generated date, period covered
- Dark background matching the app shell

**Page 2+ — Executive Summary**
- Total regulatory changes flagged in period
- Total alerts sent
- Total tasks created / completed / outstanding
- Total documents reviewed
- List of HIGH impact changes flagged (headline + source + date)

**Remaining pages — Full Activity Log**
- Chronological table of all audit events
- Columns: Date, Event, Description, Source
- Clean table styling, alternating row backgrounds

**Footer on every page:** "Generated by Donna — Always three steps ahead." + page number

### Frontend — Settings page integration

Add a new "Audit Trail" tab to the Settings page (alongside Profile, Notifications).

**Audit Trail tab layout:**

Top section — Stats row (for last 30 days by default):
- Six stat chips: Changes Flagged, Alerts Sent, Tasks Created, Tasks Completed, Documents Reviewed, Digests Sent
- Each chip: Geist Mono number, Geist label below, `#161616` background

Date range selector: "Last 7 days / Last 30 days / Last 90 days / Custom range"

**Export button:** Top right of the tab. "Export Report" — crimson button. Clicking triggers `POST /api/audit/export` and downloads the PDF. Show a loading spinner while generating.

**Activity log table:**
Columns: Time, Event, Description
- Time: Geist Mono, `#737373`, relative ("2 hours ago") with full timestamp on hover
- Event: color-coded badge (donna actions in amber, user actions in white, task completions in green)
- Description: plain text summary of what happened, linking to the relevant entity where possible

Paginated, 50 rows per page. Filter by event type via a dropdown above the table.

---

## UPDATED SIDEBAR NAV ORDER

After adding these features, the sidebar nav order should be:

1. Feed
2. Search
3. Tasks (with open task count badge)
4. Calendar (with upcoming 7-day event count badge)
5. Alerts
6. Digests
7. Settings

---

## BUILD ORDER FOR THESE FEATURES

Build in this exact sequence. Each step must be fully working before proceeding.

1. **Database migrations** — add all four new tables (`compliance_tasks`, `document_annotations`, `calendar_events`, `audit_log`) in a single new Alembic migration. Verify all tables exist with correct columns.

2. **Tasks backend** — implement `routers/tasks.py` with all endpoints. Test every endpoint via the FastAPI `/docs` interface before moving on.

3. **Tasks frontend** — Tasks page, `CreateTaskSlideOver`, feed card integration, document view integration, sidebar nav item with badge. Verify end-to-end: create a task from a feed card, see it appear on the Tasks page, mark it complete.

4. **Annotations backend** — implement `routers/annotations.py` with all endpoints.

5. **Annotations frontend** — text selection toolbar, highlight rendering, annotations panel in document view. Verify end-to-end: highlight text, add a note, reload the page, confirm the highlight and note persist.

6. **Audit logging instrumentation** — add audit log writes to all the specified locations. Do NOT build the audit UI yet. Verify that actions (viewing a document, creating a task) are writing rows to `audit_log`.

7. **Calendar backend** — implement `routers/calendar.py`. Update enrichment pipeline to auto-populate calendar events for newly processed documents.

8. **Calendar frontend** — Calendar page (list view default, month view toggle), dashboard feed integration for upcoming date indicators, sidebar nav item with badge. Verify: calendar events appear for documents that have key dates.

9. **Audit backend** — implement `routers/audit.py` including the PDF export endpoint. Test the PDF export generates a correctly structured document.

10. **Audit frontend** — Audit Trail tab in Settings, stats row, activity log table, export button. Verify: activity from previous steps appears in the log, PDF export downloads correctly.

11. **Polish pass** — empty states for all new pages, loading skeletons, error states, mobile responsiveness for new pages, verify sidebar badge counts update correctly across all new features.

---

## QUALITY REQUIREMENTS FOR THESE FEATURES

All existing quality standards from CLAUDE.md apply. Additionally:

- Audit log writes must be wrapped in try/except and must never cause the primary operation to fail
- PDF export must handle large date ranges gracefully (cap at 1,000 log entries in the exported report, note the cap in the report footer)
- Annotation character offsets must be validated on the backend — `char_end` must be greater than `char_start`
- Task due dates in the past are allowed (compliance officers may backfill completed work) but must be visually flagged as overdue
- Calendar auto-population must be idempotent — running the enrichment pipeline twice must not create duplicate calendar events (use upsert on `processed_document_id + event_type + date + user_id`)
- All new API endpoints follow the same auth pattern as existing endpoints (Clerk JWT validation)
- No new npm packages unless absolutely necessary — use what is already installed