from __future__ import annotations

import asyncio
import os
import re
import secrets

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware


SENSITIVE_PATTERN = re.compile(r"(secret|password|token)", re.IGNORECASE)


def scrub_output(text: str) -> str:
    return SENSITIVE_PATTERN.sub("[REDACTED]", text)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        api_token = os.environ.get("API_TOKEN", "")
        if not api_token:
            return await call_next(request)

        if not request.url.path.startswith("/api/"):
            return await call_next(request)

        if request.url.path == "/api/health":
            return await call_next(request)

        auth = request.headers.get("Authorization", "")
        expected = f"Bearer {api_token}"
        if not secrets.compare_digest(auth, expected):
            raise HTTPException(status_code=401, detail="Invalid or missing API token.")

        return await call_next(request)


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._running = asyncio.Lock()

    async def dispatch(self, request: Request, call_next):
        if request.method == "POST" and request.url.path in ("/api/runs", "/api/bundle"):
            if self._running.locked():
                raise HTTPException(
                    status_code=429,
                    detail="A pipeline run is already in progress. Please wait.",
                )
            async with self._running:
                return await call_next(request)
        return await call_next(request)
