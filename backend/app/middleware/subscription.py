from datetime import datetime, timezone

from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.models.user_profile import UserProfile

# Paths that bypass the subscription gate
_EXEMPT_PREFIXES = (
    "/api/billing/",
    "/api/users/me",
    "/health",
    "/",
)


def _is_exempt(path: str) -> bool:
    for prefix in _EXEMPT_PREFIXES:
        if path == prefix or path.startswith(prefix):
            return True
    return False


class SubscriptionMiddleware:
    """
    Rejects requests to /api/* (except exempt paths) when the user's subscription
    is canceled or their trial has expired.  Returns 402 so clients can redirect
    to the billing checkout page.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path: str = scope.get("path", "")

        # Only gate /api/* routes
        if not path.startswith("/api/"):
            await self.app(scope, receive, send)
            return

        if _is_exempt(path):
            await self.app(scope, receive, send)
            return

        # Extract Authorization header
        headers = dict(scope.get("headers", []))
        auth_header: bytes = headers.get(b"authorization", b"")
        if not auth_header:
            # No token — let the normal auth layer handle it
            await self.app(scope, receive, send)
            return

        token = auth_header.decode("utf-8", errors="ignore")
        if token.lower().startswith("bearer "):
            token = token[7:]

        clerk_user_id = await _extract_clerk_user_id(token)
        if not clerk_user_id:
            await self.app(scope, receive, send)
            return

        blocked = await _is_subscription_blocked(clerk_user_id)
        if blocked:
            response = JSONResponse(
                status_code=402,
                content={"detail": "subscription_required"},
            )
            await response(scope, receive, send)
            return

        await self.app(scope, receive, send)


async def _extract_clerk_user_id(token: str) -> str | None:
    """Decode the Clerk JWT and return the subject (clerk_user_id) without
    full validation — the auth layer downstream handles proper verification.
    We only need the user ID to look up their subscription status."""
    try:
        import jwt  # PyJWT

        # Decode without verification just to read the sub claim
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload.get("sub")
    except Exception:
        return None


async def _is_subscription_blocked(clerk_user_id: str) -> bool:
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(UserProfile.subscription_status, UserProfile.trial_ends_at).where(
                    UserProfile.clerk_user_id == clerk_user_id
                )
            )
            row = result.first()
            if not row:
                return False

            status, trial_ends_at = row

            if status == "canceled":
                return True

            if status == "trialing" and trial_ends_at is not None:
                now = datetime.now(timezone.utc)
                if trial_ends_at.tzinfo is None:
                    trial_ends_at = trial_ends_at.replace(tzinfo=timezone.utc)
                if trial_ends_at < now:
                    return True

            return False
    except Exception:
        # Never block on a DB error
        return False
