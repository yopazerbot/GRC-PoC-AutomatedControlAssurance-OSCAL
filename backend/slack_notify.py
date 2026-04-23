from __future__ import annotations

import os
import threading
from datetime import datetime, timezone

import httpx


def _get_webhook_url() -> str | None:
    return os.environ.get("SLACK_WEBHOOK_URL", "").strip() or None


def _send(text: str) -> None:
    url = _get_webhook_url()
    if not url:
        return

    def _post():
        try:
            httpx.post(url, json={"text": text}, timeout=5.0)
        except Exception:
            pass

    threading.Thread(target=_post, daemon=True).start()


def notify_visit(ip: str | None = None) -> None:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    ip_part = f" | IP `{ip}`" if ip else ""
    _send(f":eyes: *GRC Lab* — someone visited the demo | {now}{ip_part}")
