"""
Claude API wrapper for document enrichment and digest assembly.
"""
import json
import logging
from datetime import datetime
from typing import Any

import anthropic
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings

logger = logging.getLogger(__name__)

client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
MODEL = "claude-sonnet-4-6"
PROMPT_VERSION = "v1"

ENRICHMENT_SYSTEM = "You are a regulatory intelligence analyst. Extract structured information from regulatory documents. Return only valid JSON with no preamble, explanation, or markdown."

ENRICHMENT_TEMPLATE = """Analyze the following regulatory document and extract structured information.

Document Title: {title}
Document Type: {document_type}
Source: {source_name}
Published: {published_at}

Full Text:
{full_text}

Return a JSON object with exactly these fields:
{{
  "plain_summary": "2-3 sentence plain language summary a non-lawyer executive can understand",
  "detailed_summary": "Comprehensive 4-6 paragraph structured summary including: what changed, who is affected, key requirements, timeline, and enforcement implications",
  "affected_industries": ["list", "of", "industries"],
  "affected_jurisdictions": ["federal", "CA", "NY"],
  "key_dates": [
    {{"label": "Comment deadline", "date": "YYYY-MM-DD"}},
    {{"label": "Effective date", "date": "YYYY-MM-DD"}}
  ],
  "significance_score": 0.0,
  "significance_reasoning": "One sentence explaining the significance score",
  "taxonomy_tags": ["AML", "privacy", "data_security"],
  "recommended_actions": "Plain language: specifically what a compliance officer should do in response to this document, within what timeframe",
  "change_type": "proposed_rule|final_rule|amendment|enforcement_action|guidance_update",
  "impact_level": "high|medium|low",
  "headline": "One-line description of the change for a feed"
}}

Return only valid JSON. No preamble, no explanation, no markdown."""


def _is_retryable(exc: Exception) -> bool:
    """Don't retry auth errors — only retry rate limits and transient errors."""
    if hasattr(exc, "status_code"):
        return exc.status_code not in (401, 403)
    return True


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=60),
    retry=lambda retry_state: _is_retryable(retry_state.outcome.exception()) if retry_state.outcome.exception() else False,
)
async def extract_document_enrichment(
    title: str,
    document_type: str,
    source_name: str,
    published_at: datetime | None,
    full_text: str,
) -> dict[str, Any]:
    pub_str = published_at.strftime("%Y-%m-%d") if published_at else "Unknown"
    # Truncate full_text to avoid token limits
    truncated_text = full_text[:8000] if full_text else "No full text available."

    prompt = ENRICHMENT_TEMPLATE.format(
        title=title,
        document_type=document_type,
        source_name=source_name,
        published_at=pub_str,
        full_text=truncated_text,
    )

    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=2048,
            system=ENRICHMENT_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
            timeout=60,
        )
        raw = response.content[0].text.strip()

        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        enrichment = json.loads(raw)

        # Validate required fields with fallbacks
        enrichment.setdefault("plain_summary", f"Regulatory document: {title}")
        enrichment.setdefault("detailed_summary", enrichment["plain_summary"])
        enrichment.setdefault("affected_industries", [])
        enrichment.setdefault("affected_jurisdictions", ["federal"])
        enrichment.setdefault("key_dates", [])
        enrichment.setdefault("significance_score", 0.5)
        enrichment.setdefault("significance_reasoning", "Regulatory change requiring attention")
        enrichment.setdefault("taxonomy_tags", [])
        enrichment.setdefault("recommended_actions", "Review this regulatory change for compliance implications.")
        enrichment.setdefault("change_type", "guidance_update")
        enrichment.setdefault("impact_level", "medium")
        enrichment.setdefault("headline", title[:200])

        # Clamp significance_score
        enrichment["significance_score"] = max(0.0, min(1.0, float(enrichment["significance_score"])))

        return enrichment

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response as JSON: {e}\nRaw: {raw[:500]}")
        # Return fallback enrichment
        return _fallback_enrichment(title, document_type)
    except Exception as e:
        logger.error(f"LLM enrichment error: {e}")
        raise


def _fallback_enrichment(title: str, document_type: str) -> dict[str, Any]:
    return {
        "plain_summary": f"New regulatory document: {title}",
        "detailed_summary": f"A {document_type} has been published: {title}. Review the full document for details.",
        "affected_industries": [],
        "affected_jurisdictions": ["federal"],
        "key_dates": [],
        "significance_score": 0.5,
        "significance_reasoning": "Regulatory change requiring review",
        "taxonomy_tags": [],
        "recommended_actions": "Review this regulatory document for compliance implications relevant to your organization.",
        "change_type": "guidance_update",
        "impact_level": "medium",
        "headline": title[:200],
    }


DIGEST_SYSTEM = "You are Donna, a regulatory intelligence platform. You write professional regulatory briefing emails for in-house legal and compliance teams."

DIGEST_TEMPLATE = """Assemble a {cadence} regulatory briefing for {full_name} at {company_name}, a {industries} company.

Here are this period's relevant regulatory developments, in order of importance:

{changes_text}

Write a professional regulatory briefing email with:
1. A brief executive opening (2 sentences: what kind of period it was regulatorily)
2. Each development as a numbered item with: bold headline, 2-sentence summary, key date if present, one-line action item
3. A closing line

Be concise, professional, and direct. No filler. Write as if you are a sharp in-house counsel briefing a CEO.

Return a JSON object with two fields:
{{
  "text": "plain text version of the briefing",
  "html": "full HTML email body (not a complete HTML document, just the body content)"
}}

Return only valid JSON."""


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=60))
async def assemble_digest(
    full_name: str,
    company_name: str,
    industries: list[str],
    changes: list[dict[str, Any]],
    cadence: str = "weekly",
) -> dict[str, str]:
    changes_text = ""
    for i, change in enumerate(changes, 1):
        key_dates_str = ""
        if change.get("key_dates"):
            key_dates_str = " | ".join(
                f"{kd['label']}: {kd['date']}" for kd in change["key_dates"]
            )

        changes_text += f"""
{i}. {change['headline']}
   Impact: {change.get('impact_level', 'medium').upper()}
   Summary: {change['plain_summary']}
   Action: {change.get('recommended_actions', '')}
   {f'Key dates: {key_dates_str}' if key_dates_str else ''}
"""

    industries_str = ", ".join(industries) if industries else "general business"
    prompt = DIGEST_TEMPLATE.format(
        cadence=cadence,
        full_name=full_name,
        company_name=company_name,
        industries=industries_str,
        changes_text=changes_text.strip(),
    )

    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=3000,
            system=DIGEST_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
            timeout=90,
        )
        raw = response.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        result = json.loads(raw)
        return {"html": result.get("html", ""), "text": result.get("text", "")}

    except Exception as e:
        logger.error(f"Digest assembly error: {e}")
        # Fallback: simple text digest
        lines = [f"Your regulatory briefing for {company_name}\n"]
        for i, change in enumerate(changes, 1):
            lines.append(f"{i}. {change['headline']}\n{change['plain_summary']}\n")
        text = "\n".join(lines)
        return {"html": f"<pre>{text}</pre>", "text": text}
