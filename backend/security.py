from __future__ import annotations

import asyncio
import os
import re
from functools import wraps

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware


SECRET_SCRUB_PATTERN = re.compile(
    r"[a-zA-Z0-9~_.]{30,}",
    re.ASCII,
)


def scrub_output(text: str) -> str:
    return SECRET_SCRUB_PATTERN.sub("[REDACTED]", text)


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
        if auth != f"Bearer {api_token}":
            raise HTTPException(status_code=401, detail="Invalid or missing API token.")

        return await call_next(request)


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._running = asyncio.Lock()

    async def dispatch(self, request: Request, call_next):
        if request.method == "POST" and request.url.path == "/api/runs":
            if self._running.locked():
                raise HTTPException(
                    status_code=429,
                    detail="A pipeline run is already in progress. Please wait.",
                )
            async with self._running:
                return await call_next(request)
        return await call_next(request)
