"""
Real-time alert delivery via Resend email.
"""
import logging
from uuid import UUID

from workers.celery_app import celery_app
from app.config import settings

logger = logging.getLogger(__name__)


@celery_app.task(
    name="workers.delivery.alert_sender.send_alert",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def send_alert(self, user_id: str, regulatory_change_id: str):
    import asyncio
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(_send_alert(user_id, regulatory_change_id))
        finally:
            loop.close()
    except Exception as exc:
        logger.error(f"Alert send failed for user {user_id}, change {regulatory_change_id}: {exc}")
        raise self.retry(exc=exc)


async def _send_alert(user_id: str, regulatory_change_id: str) -> None:
    from sqlalchemy import select
    from sqlalchemy.dialects.postgresql import insert as pg_insert
    from datetime import datetime, timezone

    from app.db.session import AsyncSessionLocal
    from app.models.regulatory_change import RegulatoryChange
    from app.models.processed_document import ProcessedDocument
    from app.models.regulatory_source import RegulatorySource
    from app.models.user_profile import UserProfile
    from app.models.relevance_mapping import RelevanceMapping
    from app.models.alert import Alert
    from app.services.email import send_email

    async with AsyncSessionLocal() as session:
        # Load all needed records
        user_result = await session.execute(
            select(UserProfile).where(UserProfile.id == UUID(user_id))
        )
        user = user_result.scalar_one_or_none()
        if not user:
            return

        change_result = await session.execute(
            select(RegulatoryChange).where(RegulatoryChange.id == UUID(regulatory_change_id))
        )
        change = change_result.scalar_one_or_none()
        if not change:
            return

        proc_result = await session.execute(
            select(ProcessedDocument).where(ProcessedDocument.id == change.processed_document_id)
        )
        proc = proc_result.scalar_one_or_none()
        if not proc:
            return

        # Get relevance reasoning
        rm_result = await session.execute(
            select(RelevanceMapping).where(
                RelevanceMapping.user_id == UUID(user_id),
                RelevanceMapping.regulatory_change_id == UUID(regulatory_change_id),
            )
        )
        rm = rm_result.scalar_one_or_none()
        relevance_reasoning = rm.relevance_reasoning if rm else "Relevant to your compliance profile"

        # Get source name
        source_name = "Regulatory Source"
        if change.source_id:
            src_result = await session.execute(
                select(RegulatorySource).where(RegulatorySource.id == change.source_id)
            )
            src = src_result.scalar_one_or_none()
            if src:
                source_name = src.name

        # Build email
        subject = f"[Donna] {change.impact_level.upper()}: {change.headline}"
        body_html, body_text = _build_alert_email(
            user=user,
            change=change,
            proc=proc,
            source_name=source_name,
            relevance_reasoning=relevance_reasoning,
        )

        # Send
        success = await send_email(
            to=user.email,
            subject=subject,
            html=body_html,
            text=body_text,
        )

        # Record alert
        alert = Alert(
            user_id=UUID(user_id),
            regulatory_change_id=UUID(regulatory_change_id),
            channel="email",
            subject=subject,
            body_html=body_html,
            body_text=body_text,
            sent_at=datetime.now(timezone.utc) if success else None,
            status="sent" if success else "failed",
        )
        session.add(alert)
        await session.commit()
        logger.info(f"Alert {'sent' if success else 'failed'} for user {user_id}")

        if success:
            from app.services.audit import write as audit_write
            await audit_write(
                user_id=UUID(user_id),
                event_type="alert_sent",
                entity_type="regulatory_change",
                entity_id=UUID(regulatory_change_id),
                entity_title=change.headline,
                metadata={"channel": "email", "subject": subject},
            )


def _build_alert_email(user, change, proc, source_name: str, relevance_reasoning: str) -> tuple[str, str]:
    impact_colors = {"high": "#C0392B", "medium": "#D4893A", "low": "#5A9E6F"}
    impact_color = impact_colors.get(change.impact_level, "#737373")
    impact_label = change.impact_level.upper()

    change_type_display = change.change_type.replace("_", " ").title()
    company_name = user.company_name or "your company"

    # Key dates table
    key_dates_html = ""
    if proc.key_dates:
        rows = "".join(
            f"<tr style='border-top: 1px solid #E2E0DB;'>"
            f"<td style='padding: 8px 12px; font-size: 13px; color: #5C5C5C;'>{kd.get('label', '')}</td>"
            f"<td style='padding: 8px 12px; font-family: monospace; font-size: 13px; color: #111111; text-align: right;'>{kd.get('date', '')}</td>"
            f"</tr>"
            for kd in proc.key_dates
        )
        key_dates_html = f"""
        <h3 style="font-size: 11px; font-weight: 600; color: #737373; margin: 28px 0 8px; text-transform: uppercase; letter-spacing: 0.08em;">Key Dates</h3>
        <table style="border-collapse: collapse; width: 100%; border: 1px solid #E2E0DB; border-radius: 4px;">
            {rows}
        </table>
        """

    recommended_actions_html = ""
    if proc.recommended_actions:
        recommended_actions_html = f"""
        <h3 style="font-size: 11px; font-weight: 600; color: #737373; margin: 28px 0 8px; text-transform: uppercase; letter-spacing: 0.08em;">What to do</h3>
        <p style="font-size: 14px; color: #333333; line-height: 1.65; margin: 0;">{proc.recommended_actions}</p>
        """

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    @media (max-width: 600px) {{
      .outer {{ padding: 0 !important; }}
      .card {{ border-radius: 0 !important; border-left: none !important; border-right: none !important; }}
      .body {{ padding: 24px 20px !important; }}
    }}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F7F6F3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div class="outer" style="max-width:600px;margin:40px auto;padding:0 16px;">
    <div class="card" style="background:#ffffff;border:1px solid #E2E0DB;border-radius:4px;overflow:hidden;">

      <!-- Header -->
      <div style="background:#0C0C0C;padding:24px 32px;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#F0EEE9;letter-spacing:-0.01em;font-weight:400;">Donna</span>
        <span style="background:#262626;color:#737373;font-family:monospace;font-size:10px;font-weight:600;letter-spacing:0.08em;padding:3px 8px;border-radius:3px;text-transform:uppercase;">Alert</span>
      </div>

      <!-- Body -->
      <div class="body" style="padding:32px;">

        <!-- Impact badge -->
        <div style="margin-bottom:20px;">
          <span style="background:{impact_color};color:#ffffff;font-family:monospace;font-size:10px;font-weight:700;letter-spacing:0.1em;padding:4px 10px;border-radius:3px;text-transform:uppercase;margin-right:8px;">{impact_label}</span>
          <span style="background:#1A1A1A;color:#737373;font-family:monospace;font-size:10px;font-weight:600;letter-spacing:0.08em;padding:4px 8px;border-radius:3px;text-transform:uppercase;">{change_type_display}</span>
        </div>

        <!-- Source + date -->
        <p style="font-family:monospace;font-size:11px;color:#737373;margin:0 0 12px;letter-spacing:0.04em;">{source_name}</p>

        <!-- Headline -->
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#111111;margin:0 0 20px;line-height:1.35;font-weight:400;">{change.headline}</h1>

        <!-- Plain summary (18px) -->
        <p style="font-size:18px;color:#333333;line-height:1.6;margin:0 0 28px;">{proc.plain_summary}</p>

        <!-- What to do -->
        {recommended_actions_html}

        <!-- Key dates -->
        {key_dates_html}

        <!-- Why Donna flagged this -->
        <div style="background:#F7F6F3;border-left:3px solid #C0392B;padding:12px 16px;margin-top:28px;border-radius:0 4px 4px 0;">
          <p style="font-size:12px;color:#5C5C5C;margin:0;line-height:1.55;">
            <strong style="color:#111111;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;">Why Donna flagged this</strong><br>
            {relevance_reasoning}
          </p>
        </div>

        <!-- CTA -->
        <div style="margin-top:32px;padding-top:24px;border-top:1px solid #E2E0DB;">
          <a href="{settings.FRONTEND_URL}/document/{change.processed_document_id}" style="display:inline-block;background:#C0392B;color:#ffffff;padding:10px 20px;border-radius:4px;text-decoration:none;font-size:13px;font-weight:500;margin-right:12px;">View Full Analysis</a>
          <a href="{settings.FRONTEND_URL}/settings" style="color:#737373;font-size:12px;text-decoration:underline;">Adjust preferences</a>
        </div>

      </div>

      <!-- Footer -->
      <div style="background:#F7F6F3;padding:16px 32px;border-top:1px solid #E2E0DB;">
        <p style="font-size:11px;color:#737373;margin:0;">
          Generated by Donna &mdash; Always three steps ahead.
          &middot;
          <a href="{settings.FRONTEND_URL}/settings" style="color:#737373;text-decoration:underline;">Unsubscribe</a>
        </p>
      </div>

    </div>
  </div>
</body>
</html>"""

    text = f"""[Donna] {impact_label}: {change.headline}

Source: {source_name}

{proc.plain_summary}

What to do:
{proc.recommended_actions or 'See full analysis for details.'}

Why Donna flagged this: {relevance_reasoning}

View the full analysis: {settings.FRONTEND_URL}/document/{change.processed_document_id}
"""
    return html, text
