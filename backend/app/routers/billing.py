import stripe
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_clerk_user_id
from app.config import settings
from app.db.session import get_db
from app.models.user_profile import UserProfile

stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter(prefix="/api/billing", tags=["billing"])


class CheckoutResponse(BaseModel):
    url: str


class PortalResponse(BaseModel):
    url: str


async def _get_user(clerk_user_id: str, db: AsyncSession) -> UserProfile:
    result = await db.execute(
        select(UserProfile).where(UserProfile.clerk_user_id == clerk_user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout_session(
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    if not settings.STRIPE_SECRET_KEY or not settings.STRIPE_PRICE_ID:
        raise HTTPException(status_code=503, detail="Billing not configured")

    user = await _get_user(clerk_user_id, db)

    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": settings.STRIPE_PRICE_ID, "quantity": 1}],
        success_url=f"{settings.FRONTEND_URL}/?billing=success",
        cancel_url=f"{settings.FRONTEND_URL}/?billing=canceled",
        client_reference_id=str(user.id),
        customer_email=user.email,
        metadata={"clerk_user_id": clerk_user_id},
    )
    return CheckoutResponse(url=session.url)


@router.post("/portal", response_model=PortalResponse)
async def create_portal_session(
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: AsyncSession = Depends(get_db),
):
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Billing not configured")

    user = await _get_user(clerk_user_id, db)

    # Stripe portal requires a customer ID — look up by email if not stored
    customers = stripe.Customer.list(email=user.email, limit=1)
    if not customers.data:
        raise HTTPException(status_code=400, detail="No Stripe customer found for this account")

    customer_id = customers.data[0].id
    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=f"{settings.FRONTEND_URL}/settings",
    )
    return PortalResponse(url=session.url)


@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Webhook secret not configured")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        clerk_user_id = data.get("metadata", {}).get("clerk_user_id")
        if clerk_user_id:
            result = await db.execute(
                select(UserProfile).where(UserProfile.clerk_user_id == clerk_user_id)
            )
            user = result.scalar_one_or_none()
            if user:
                user.subscription_status = "trialing"
                user.trial_ends_at = datetime.now(timezone.utc) + timedelta(days=14)
                await db.commit()

    elif event_type == "customer.subscription.updated":
        customer_id = data.get("customer")
        new_status = data.get("status", "active")
        await _update_status_by_customer(customer_id, new_status, db)

    elif event_type == "customer.subscription.deleted":
        customer_id = data.get("customer")
        await _update_status_by_customer(customer_id, "canceled", db)

    elif event_type == "invoice.payment_failed":
        customer_id = data.get("customer")
        await _update_status_by_customer(customer_id, "past_due", db)

    return {"received": True}


async def _update_status_by_customer(
    customer_id: str, status: str, db: AsyncSession
) -> None:
    customer = stripe.Customer.retrieve(customer_id)
    email = customer.get("email")
    if not email:
        return
    result = await db.execute(select(UserProfile).where(UserProfile.email == email))
    user = result.scalar_one_or_none()
    if user:
        user.subscription_status = status
        await db.commit()
