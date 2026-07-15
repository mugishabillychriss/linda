"""
Auth dependency for FastAPI routes.

The frontend sends the user's Supabase access token as a Bearer token on
every request. We verify it by asking Supabase's own auth server "is this
token valid, and who is it for" -- we don't need to manage JWT secrets
ourselves, Supabase does the verification.

This means every protected route needs the user to be logged in via
Supabase Auth on the frontend first (see frontend/app/(auth)/).
"""

from fastapi import Header, HTTPException
from app.supabase_client import get_supabase


async def get_current_user(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid Authorization header")

    token = authorization.removeprefix("Bearer ").strip()

    try:
        result = get_supabase().auth.get_user(token)
    except Exception:
        raise HTTPException(401, "Invalid or expired session")

    if not result or not result.user:
        raise HTTPException(401, "Invalid or expired session")

    return {"id": result.user.id, "email": result.user.email}
