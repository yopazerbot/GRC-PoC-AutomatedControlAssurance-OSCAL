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
            error_code = ""
            try:
                body = token_resp.json()
                error_code = body.get("error", "")
            except Exception:
                pass

            if token_resp.status_code == 401 or error_code == "invalid_client":
                raise RuntimeError(
                    "Authentication failed: invalid client credentials. "
                    "Verify that tenant_id, client_id, and client_secret are correct."
                )
            if error_code == "unauthorized_client":
                raise RuntimeError(
                    "Authentication failed: this app registration is not authorized "
                    "for client credentials flow. Check the app's API permissions."
                )
            raise RuntimeError(
                f"Authentication failed (HTTP {token_resp.status_code}). "
                "Verify your Entra ID credentials and try again."
            )

        access_token = token_resp.json().get("access_token")
        if not access_token:
            raise RuntimeError("Authentication succeeded but no access token was returned.")

        try:
            policies_resp = await client.get(
                "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies",
                headers={"Authorization": f"Bearer {access_token}"},
            )
        finally:
            del access_token

        if policies_resp.status_code == 403:
            raise RuntimeError(
                "Permission denied. Ensure the app registration has "
                "Policy.Read.All permission and admin consent has been granted."
            )

        if policies_resp.status_code != 200:
            raise RuntimeError(
                f"Failed to fetch Conditional Access policies (HTTP {policies_resp.status_code})."
            )

        try:
            data = policies_resp.json()
        except Exception:
            raise RuntimeError("Microsoft Graph returned an invalid response.")

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
            error_code = ""
            try:
                body = token_resp.json()
                error_code = body.get("error", "")
            except Exception:
                pass

            if error_code == "invalid_client":
                raise RuntimeError(
                    "Authentication failed: invalid client credentials."
                )
            raise RuntimeError(
                f"Authentication failed (HTTP {token_resp.status_code})."
            )

        return True
