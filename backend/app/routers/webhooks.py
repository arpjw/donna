"""
Clerk webhook handler — creates user_profiles on signup.
"""
import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.config import settings
from app.db.session import AsyncSessionLocal
from app.models.user_profile import UserProfile
from app.rate_limit import limiter

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
logger = logging.getLogger(__name__)


@router.post("/clerk")
@limiter.limit("120/minute")
async def clerk_webhook(request: Request):
    payload = await request.body()
    headers = dict(request.headers)

    # Verify webhook signature if secret is set
    if settings.CLERK_WEBHOOK_SECRET:
        try:
            from svix.webhooks import Webhook, WebhookVerificationError
            wh = Webhook(settings.CLERK_WEBHOOK_SECRET)
            wh.verify(payload, headers)
        except Exception as e:
            logger.warning(f"Webhook signature verification failed: {e}")
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        event = json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event_type = event.get("type")
    data = event.get("data", {})

    logger.info(f"Clerk webhook: {event_type}")

    if event_type == "user.created":
        await _handle_user_created(data)
    elif event_type == "user.updated":
        await _handle_user_updated(data)

    return {"status": "ok"}


async def _handle_user_created(data: dict) -> None:
    clerk_user_id = data.get("id")
    if not clerk_user_id:
        return

    email_addresses = data.get("email_addresses", [])
    primary_email_id = data.get("primary_email_address_id")
    email = ""
    for ea in email_addresses:
        if ea.get("id") == primary_email_id:
            email = ea.get("email_address", "")
            break
    if not email and email_addresses:
        email = email_addresses[0].get("email_address", "")

    first_name = data.get("first_name") or ""
    last_name = data.get("last_name") or ""
    full_name = f"{first_name} {last_name}".strip() or None

    async with AsyncSessionLocal() as session:
        stmt = (
            pg_insert(UserProfile)
            .values(
                clerk_user_id=clerk_user_id,
                email=email,
                full_name=full_name,
            )
            .on_conflict_do_nothing(index_elements=["clerk_user_id"])
        )
        await session.execute(stmt)
        await session.commit()
        logger.info(f"Created user profile for {clerk_user_id} ({email})")


async def _handle_user_updated(data: dict) -> None:
    clerk_user_id = data.get("id")
    if not clerk_user_id:
        return

    email_addresses = data.get("email_addresses", [])
    primary_email_id = data.get("primary_email_address_id")
    email = None
    for ea in email_addresses:
        if ea.get("id") == primary_email_id:
            email = ea.get("email_address")
            break

    first_name = data.get("first_name") or ""
    last_name = data.get("last_name") or ""
    full_name = f"{first_name} {last_name}".strip() or None

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(UserProfile).where(UserProfile.clerk_user_id == clerk_user_id)
        )
        profile = result.scalar_one_or_none()
        if profile:
            if email:
                profile.email = email
            if full_name:
                profile.full_name = full_name
            profile.updated_at = datetime.now(timezone.utc)
            await session.commit()
