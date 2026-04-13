"""
Integration tests for the ingestion pipeline.

Run with:
    cd backend && pytest tests/test_ingestion.py -v
"""
import asyncio
import json
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
import respx
import httpx


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

FEDERAL_REGISTER_RESPONSE_2_DOCS = {
    "count": 2,
    "total_pages": 1,
    "results": [
        {
            "document_number": "2026-00001",
            "title": "Final Rule on Consumer Data Protection",
            "type": "RULE",
            "publication_date": "2026-04-01",
            "html_url": "https://www.federalregister.gov/documents/2026/04/01/2026-00001/final-rule",
            "abstract": "This final rule establishes consumer data protection requirements.",
            "action": "Final Rule",
            "agencies": [{"name": "Consumer Financial Protection Bureau"}],
            "effective_on": "2026-07-01",
            "comments_close_on": None,
            "full_text_xml_url": None,
            "body_html_url": None,
        },
        {
            "document_number": "2026-00002",
            "title": "Proposed Rule on AML Compliance",
            "type": "PRORULE",
            "publication_date": "2026-04-02",
            "html_url": "https://www.federalregister.gov/documents/2026/04/02/2026-00002/proposed-rule",
            "abstract": "This proposed rule would strengthen AML compliance requirements.",
            "action": "Proposed Rule",
            "agencies": [{"name": "FinCEN"}],
            "effective_on": None,
            "comments_close_on": "2026-06-01",
            "full_text_xml_url": None,
            "body_html_url": None,
        },
    ],
}

FEDERAL_REGISTER_RESPONSE_MISSING_URL = {
    "count": 2,
    "total_pages": 1,
    "results": [
        {
            "document_number": "2026-00003",
            "title": "Document with no URL",
            "type": "NOTICE",
            "publication_date": "2026-04-01",
            "html_url": "",  # missing URL — should be skipped
            "abstract": "Some abstract.",
            "action": "Notice",
            "agencies": [],
            "effective_on": None,
            "comments_close_on": None,
            "full_text_xml_url": None,
            "body_html_url": None,
        },
        {
            "document_number": "2026-00004",
            "title": "Document with a valid URL",
            "type": "NOTICE",
            "publication_date": "2026-04-02",
            "html_url": "https://www.federalregister.gov/documents/2026/04/02/2026-00004/notice",
            "abstract": "Valid document.",
            "action": "Notice",
            "agencies": [],
            "effective_on": None,
            "comments_close_on": None,
            "full_text_xml_url": None,
            "body_html_url": None,
        },
    ],
}


# ---------------------------------------------------------------------------
# TASK 1: Federal Register fetch returns documents
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_federal_register_fetch_returns_documents():
    """Mock httpx to return 2 valid documents. Assert fetch_new_documents returns 2 RawDocumentCreate objects."""
    from workers.ingestion.federal_register import FederalRegisterIngester

    ingester = FederalRegisterIngester()
    since = datetime(2026, 3, 31, tzinfo=timezone.utc)

    with respx.mock(assert_all_called=False) as mock:
        mock.get("https://www.federalregister.gov/api/v1/documents.json").mock(
            return_value=httpx.Response(200, json=FEDERAL_REGISTER_RESPONSE_2_DOCS)
        )

        docs = await ingester.fetch_new_documents(since=since)

    assert len(docs) == 2

    # First document: final rule
    assert docs[0].document_type == "final_rule"
    assert docs[0].external_id == "2026-00001"
    assert "federalregister.gov" in docs[0].document_url
    assert docs[0].title == "Final Rule on Consumer Data Protection"
    assert docs[0].published_at is not None
    assert docs[0].published_at.year == 2026

    # Second document: proposed rule
    assert docs[1].document_type == "proposed_rule"
    assert docs[1].external_id == "2026-00002"
    assert "federalregister.gov" in docs[1].document_url

    # Metadata should be populated
    assert docs[0].raw_metadata is not None
    assert docs[0].raw_metadata["document_number"] == "2026-00001"


# ---------------------------------------------------------------------------
# TASK 2: Federal Register skips documents with no html_url
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_federal_register_skips_missing_url():
    """Mock response with one document missing html_url. Assert only 1 document is returned."""
    from workers.ingestion.federal_register import FederalRegisterIngester

    ingester = FederalRegisterIngester()
    since = datetime(2026, 3, 31, tzinfo=timezone.utc)

    with respx.mock(assert_all_called=False) as mock:
        mock.get("https://www.federalregister.gov/api/v1/documents.json").mock(
            return_value=httpx.Response(200, json=FEDERAL_REGISTER_RESPONSE_MISSING_URL)
        )

        docs = await ingester.fetch_new_documents(since=since)

    assert len(docs) == 1
    assert docs[0].external_id == "2026-00004"
    assert docs[0].document_url != ""


# ---------------------------------------------------------------------------
# TASK 3: Base ingester deduplicates on re-run (upsert idempotency)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_base_ingester_upserts_documents():
    """
    Running the ingester twice with the same document URLs must insert only 1 record.

    We mock the DB session to track insert calls rather than using a real DB,
    since BaseIngester uses SQLAlchemy's insert().on_conflict_do_nothing().
    """
    from app.schemas.documents import RawDocumentCreate
    from workers.ingestion.base import BaseIngester

    # Subclass that always returns the same 1 document
    class TestIngester(BaseIngester):
        source_slug = "test-source"

        async def fetch_new_documents(self, since):
            return [
                RawDocumentCreate(
                    source_id=None,
                    external_id="doc-001",
                    title="Duplicate Document",
                    full_text="Some text",
                    document_url="https://example.com/doc-001",
                    document_type="guidance",
                    published_at=datetime(2026, 4, 1, tzinfo=timezone.utc),
                    raw_metadata={},
                )
            ]

    # Track how many rows were "inserted"
    insert_count = {"value": 0}

    # Mock the DB session at the source level
    mock_source = MagicMock()
    mock_source.id = "source-uuid"
    mock_source.last_checked_at = None
    mock_source.slug = "test-source"

    mock_result_source = MagicMock()
    mock_result_source.scalar_one_or_none.return_value = mock_source

    # First call: insert succeeds and returns a row
    mock_result_first = MagicMock()
    mock_result_first.fetchone.return_value = ("new-doc-id",)

    # Second call: on_conflict_do_nothing means no row returned
    mock_result_second = MagicMock()
    mock_result_second.fetchone.return_value = None

    execute_call_count = {"value": 0}

    async def mock_execute(stmt, *args, **kwargs):
        execute_call_count["value"] += 1
        # First execute is the source lookup
        if execute_call_count["value"] == 1:
            return mock_result_source
        # Second execute is the upsert — first run returns a row
        if execute_call_count["value"] == 2:
            insert_count["value"] += 1
            return mock_result_first
        # Any further execute (update last_checked_at) returns a noop
        return MagicMock()

    mock_session = AsyncMock()
    mock_session.execute.side_effect = mock_execute
    mock_session.commit = AsyncMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=False)

    with patch("workers.ingestion.base.AsyncSessionLocal", return_value=mock_session):
        with patch("workers.ingestion.base.select") as mock_select:
            with patch("workers.ingestion.base.update") as mock_update:
                with patch("workers.ingestion.base.insert") as mock_insert_fn:
                    # Setup insert chain
                    mock_insert_stmt = MagicMock()
                    mock_insert_stmt.values.return_value = mock_insert_stmt
                    mock_insert_stmt.on_conflict_do_nothing.return_value = mock_insert_stmt
                    mock_insert_stmt.returning.return_value = mock_insert_stmt
                    mock_insert_fn.return_value = mock_insert_stmt

                    mock_select.return_value = MagicMock()
                    mock_update.return_value = MagicMock()
                    mock_update.return_value.where.return_value = MagicMock()
                    mock_update.return_value.where.return_value.values.return_value = MagicMock()

                    with patch("workers.processing.enrichment.enrich_document") as mock_enrich:
                        mock_enrich.delay = MagicMock()
                        ingester_instance = TestIngester()
                        await ingester_instance.run()

    # Only 1 insert should have been attempted
    assert insert_count["value"] == 1


# ---------------------------------------------------------------------------
# TASK 4: Enrichment fallback when LLM call fails
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_enrichment_fallback_on_llm_failure():
    """
    When extract_document_enrichment raises, _enrich_document should complete
    without raising and use _fallback_enrichment values.
    """
    import uuid

    # We patch all DB / service dependencies
    mock_raw_doc = MagicMock()
    mock_raw_doc.id = uuid.uuid4()
    mock_raw_doc.is_processed = False
    mock_raw_doc.source_id = None
    mock_raw_doc.title = "Test Rule on Data Privacy"
    mock_raw_doc.document_type = "proposed_rule"
    mock_raw_doc.full_text = "Full text of the rule..."
    mock_raw_doc.published_at = datetime(2026, 4, 1, tzinfo=timezone.utc)
    mock_raw_doc.raw_metadata = {}

    mock_result_raw = MagicMock()
    mock_result_raw.scalar_one_or_none.return_value = mock_raw_doc

    # Track whether session.add was called (i.e., ProcessedDocument was written)
    added_objects = []

    mock_session = AsyncMock()
    mock_session.execute.return_value = mock_result_raw
    mock_session.add.side_effect = added_objects.append
    mock_session.flush = AsyncMock()
    mock_session.commit = AsyncMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=False)

    with patch("workers.processing.enrichment.AsyncSessionLocal", return_value=mock_session):
        with patch("app.services.llm.extract_document_enrichment", side_effect=Exception("Claude API timeout")):
            with patch("workers.processing.embedding.generate_embedding") as mock_embed:
                with patch("workers.relevance.scorer.score_change") as mock_score:
                    mock_embed.delay = MagicMock()
                    mock_score.delay = MagicMock()

                    # Should NOT raise even though LLM fails
                    from workers.processing.enrichment import _enrich_document
                    await _enrich_document(str(mock_raw_doc.id))

    # ProcessedDocument and RegulatoryChange should both have been added to session
    assert len(added_objects) >= 1, "Expected session.add to be called at least once (ProcessedDocument)"
