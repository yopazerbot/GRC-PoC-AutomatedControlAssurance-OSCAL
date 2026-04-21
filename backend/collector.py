from __future__ import annotations

import json
import re
from pathlib import Path

import httpx

FIXTURES_DIR = Path(__file__).parent / "fixtures"

SENSITIVE_PATTERN = re.compile(r"(secret|password|token)", re.IGNORECASE)


def sanitize_evidence(policies: list[dict]) -> list[dict]:
    sanitized = []
    for policy in policies:
        sanitized.append(_redact(policy))
    return sanitized


def _redact(obj):
    if isinstance(obj, dict):
        result = {}
        for k, v in obj.items():
            if SENSITIVE_PATTERN.search(k):
                result[k] = "[REDACTED]"
            else:
                result[k] = _redact(v)
        return result
    if isinstance(obj, list):
        return [_redact(item) for item in obj]
    return obj


def collect_mock_pass() -> list[dict]:
    data = json.loads((FIXTURES_DIR / "mock_evidence_pass.json").read_text())
    return data.get("value", [])


def collect_mock_fail() -> list[dict]:
    data = json.loads((FIXTURES_DIR / "mock_evidence_fail.json").read_text())
    return data.get("value", [])


async def collect_live(tenant_id: str, client_id: str, client_secret: str) -> list[dict]:
    token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"

    async with httpx.AsyncClient(timeout=30.0) as client:
        token_resp = await client.post(
            token_url,
            data={
                "grant_type": "client_credentials",
                "client_id": client_id,
                "client_secret": client_secret,
                "scope": "https://graph.microsoft.com/.default",
            },
        )

        if token_resp.status_code != 200:
            body = token_resp.json() if token_resp.headers.get("content-type", "").startswith("application/json") else {}
            error_desc = body.get("error_description", token_resp.text[:500])
            raise RuntimeError(
                f"Authentication failed (HTTP {token_resp.status_code}): {error_desc}. "
                "Check that tenant_id, client_id, and client_secret are correct."
            )

        access_token = token_resp.json()["access_token"]

        policies_resp = await client.get(
            "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if policies_resp.status_code == 403:
            raise RuntimeError(
                "Permission denied (HTTP 403). Ensure the app registration has "
                "Policy.Read.All permission and admin consent has been granted."
            )

        if policies_resp.status_code != 200:
            raise RuntimeError(
                f"Failed to fetch Conditional Access policies (HTTP {policies_resp.status_code}): "
                f"{policies_resp.text[:500]}"
            )

        data = policies_resp.json()
        return data.get("value", [])


async def collect_live_dry_run(tenant_id: str, client_id: str, client_secret: str) -> bool:
    token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"

    async with httpx.AsyncClient(timeout=15.0) as client:
        token_resp = await client.post(
            token_url,
            data={
                "grant_type": "client_credentials",
                "client_id": client_id,
                "client_secret": client_secret,
                "scope": "https://graph.microsoft.com/.default",
            },
        )

        if token_resp.status_code != 200:
            body = token_resp.json() if token_resp.headers.get("content-type", "").startswith("application/json") else {}
            error_desc = body.get("error_description", token_resp.text[:500])
            raise RuntimeError(
                f"Authentication failed (HTTP {token_resp.status_code}): {error_desc}"
            )

        return True
