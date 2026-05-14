"""Persist GRC-OSCAL pipeline run results in immudb.

# Data-minimisation contract
#
# immudb is append-only and cryptographically verifiable, so anything
# written here is effectively permanent. To stay aligned with GDPR
# data-minimisation and right-to-be-forgotten obligations, this module
# operates on a strict ALLOWLIST.
#
# Stored per run:
#   - run_id (random server-side UUID)
#   - mode, outcome, duration_ms, ts
#   - control_id, finding_state, summary (structural)
#   - per-criterion name / passed / reason (structural constants)
#
# NEVER stored:
#   - tenant_id, client_id, client_secret
#   - the full OSCAL assessment-results document
#   - the sanitized_evidence list (still contains object IDs in live mode)
#   - any identifier or string fetched from Microsoft Graph at runtime
#
# `_assert_no_pii` is a defence-in-depth guard scanning the final record
# against email / GUID / IP / known-PII-substring patterns. The guard
# should never trigger; if it does, refuse the write and log a regression.
"""
from __future__ import annotations

import logging
import os
import re
import threading
from datetime import datetime, timezone
from typing import Any

from pipeline import RunResult

logger = logging.getLogger(__name__)

_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
_IPV4_RE = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
_IPV6_RE = re.compile(r"\b(?:[A-Fa-f0-9]{1,4}:){2,7}[A-Fa-f0-9]{1,4}\b")
_GUID_RE = re.compile(r"\b[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}\b")
_PII_SUBSTRINGS = ("tenant", "userprincipalname", "givenname", "surname", "jobtitle")

_QUOTED_RE = re.compile(r"'[^']*'")

CONTROL_ID = "a-8-5"

_client: Any = None
_client_lock = threading.Lock()
_init_done = False
_unavailable_logged = False


def _config_present() -> bool:
    return bool(os.environ.get("IMMUDB_HOST"))


def _log_unavailable_once(reason: str) -> None:
    global _unavailable_logged
    if not _unavailable_logged:
        logger.warning("immudb unavailable: %s. Persistence disabled.", reason)
        _unavailable_logged = True


def _get_client():
    global _client
    if _client is not None:
        return _client
    if not _config_present():
        return None
    try:
        from immudb import ImmudbClient
    except Exception as e:
        _log_unavailable_once(f"immudb-py import failed: {e}")
        return None
    host = os.environ.get("IMMUDB_HOST")
    port = int(os.environ.get("IMMUDB_PORT", "3322"))
    user = os.environ.get("IMMUDB_USER", "immudb")
    password = os.environ.get("IMMUDB_PASSWORD", "immudb")
    database = os.environ.get("IMMUDB_DATABASE", "defaultdb")
    try:
        client = ImmudbClient(f"{host}:{port}")
        client.login(user, password, database)
    except Exception as e:
        _log_unavailable_once(f"connection failed: {e}")
        return None
    with _client_lock:
        if _client is None:
            _client = client
    return _client


def init() -> None:
    """Idempotent: connect and create tables if missing."""
    global _init_done
    if _init_done:
        return
    client = _get_client()
    if client is None:
        return
    try:
        client.sqlExec(
            """
            CREATE TABLE IF NOT EXISTS runs (
                run_id        VARCHAR[36],
                mode          VARCHAR[16],
                outcome       VARCHAR[8],
                duration_ms   INTEGER,
                ts            TIMESTAMP,
                control_id    VARCHAR[32],
                finding_state VARCHAR[16],
                summary       VARCHAR[256],
                PRIMARY KEY run_id
            );
            """
        )
        client.sqlExec("CREATE INDEX IF NOT EXISTS ON runs(ts);")
        client.sqlExec(
            """
            CREATE TABLE IF NOT EXISTS run_criteria (
                run_id    VARCHAR[36],
                name      VARCHAR[64],
                passed    BOOLEAN,
                reason    VARCHAR[256],
                PRIMARY KEY (run_id, name)
            );
            """
        )
        _init_done = True
        logger.info("immudb schema ready (host=%s)", os.environ.get("IMMUDB_HOST"))
    except Exception as e:
        _log_unavailable_once(f"schema init failed: {e}")


def _normalise(s: str) -> str:
    """Strip single-quoted substrings so admin-defined names from the
    evaluator's reason/summary strings are never persisted."""
    return _QUOTED_RE.sub("'<policy>'", s or "")


def _truncate(s: str, n: int) -> str:
    return s if len(s) <= n else s[: n - 1] + "…"


def build_persisted_record(run: RunResult) -> dict:
    """Derive the strict-allowlist record from a RunResult.

    No tenant info, no live evidence, no full assessment-results JSON."""
    evaluation = run.evaluation or {}
    finding_state = "satisfied" if run.outcome == "pass" else "not-satisfied"
    summary = _truncate(_normalise(evaluation.get("summary", "")), 256)
    criteria = []
    for c in evaluation.get("criteria", []) or []:
        criteria.append(
            {
                "name": _truncate(c.get("name", ""), 64),
                "passed": bool(c.get("passed")),
                "reason": _truncate(_normalise(c.get("reason", "")), 256),
            }
        )
    return {
        "run_id": run.run_id,
        "mode": run.mode,
        "outcome": run.outcome,
        "duration_ms": int(run.duration_ms),
        "ts": run.timestamp,
        "control_id": CONTROL_ID,
        "finding_state": finding_state,
        "summary": summary,
        "criteria": criteria,
    }


def _assert_no_pii(record: dict) -> None:
    """Defence-in-depth scan over every string value in the allowlist record.

    Skips run_id (it's a random server-side UUID, not user-derived)."""
    def scan(value: Any, path: str) -> None:
        if isinstance(value, str):
            if path != "run_id" and _GUID_RE.search(value):
                raise ValueError(f"PII guard: GUID-shaped value at {path}")
            if _EMAIL_RE.search(value):
                raise ValueError(f"PII guard: email-shaped value at {path}")
            if _IPV4_RE.search(value) or _IPV6_RE.search(value):
                raise ValueError(f"PII guard: IP-shaped value at {path}")
            lowered = value.lower()
            for needle in _PII_SUBSTRINGS:
                if needle in lowered:
                    raise ValueError(f"PII guard: substring '{needle}' at {path}")
        elif isinstance(value, dict):
            for k, v in value.items():
                scan(v, f"{path}.{k}" if path else k)
        elif isinstance(value, list):
            for i, v in enumerate(value):
                scan(v, f"{path}[{i}]")

    scan(record, "")


def _to_immudb_ts(iso: str) -> datetime:
    s = iso.replace("Z", "+00:00")
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def store_run(run: RunResult) -> None:
    """Best-effort persistence; never raises to the caller."""
    if not _config_present():
        return
    try:
        record = build_persisted_record(run)
        _assert_no_pii(record)
    except Exception as e:
        logger.error("Refusing immudb write: %s", e)
        return
    client = _get_client()
    if client is None:
        return
    if not _init_done:
        init()
    if not _init_done:
        return
    try:
        ts = _to_immudb_ts(record["ts"])
        client.sqlExec(
            "UPSERT INTO runs(run_id, mode, outcome, duration_ms, ts, control_id, finding_state, summary) "
            "VALUES (@run_id, @mode, @outcome, @duration_ms, @ts, @control_id, @finding_state, @summary);",
            params={
                "run_id": record["run_id"],
                "mode": record["mode"],
                "outcome": record["outcome"],
                "duration_ms": record["duration_ms"],
                "ts": ts,
                "control_id": record["control_id"],
                "finding_state": record["finding_state"],
                "summary": record["summary"],
            },
        )
        for c in record["criteria"]:
            client.sqlExec(
                "UPSERT INTO run_criteria(run_id, name, passed, reason) "
                "VALUES (@run_id, @name, @passed, @reason);",
                params={
                    "run_id": record["run_id"],
                    "name": c["name"],
                    "passed": c["passed"],
                    "reason": c["reason"],
                },
            )
    except Exception as e:
        logger.warning("immudb write failed for run %s: %s", run.run_id, e)


def _rows(result) -> list[tuple]:
    if result is None:
        return []
    if isinstance(result, list):
        return result
    rows = getattr(result, "rows", None)
    if rows is not None:
        return list(rows)
    return list(result)


def list_runs(limit: int = 50) -> list[dict]:
    client = _get_client()
    if client is None:
        return []
    if not _init_done:
        init()
    if not _init_done:
        return []
    try:
        limit = max(1, min(int(limit), 500))
        result = client.sqlQuery(
            f"SELECT run_id, mode, outcome, duration_ms, ts, control_id, finding_state, summary "
            f"FROM runs ORDER BY ts DESC LIMIT {limit};"
        )
        out = []
        for row in _rows(result):
            run_id, mode, outcome, duration_ms, ts, control_id, finding_state, summary = row
            out.append(
                {
                    "run_id": run_id,
                    "mode": mode,
                    "outcome": outcome,
                    "duration_ms": int(duration_ms) if duration_ms is not None else 0,
                    "timestamp": _ts_to_iso(ts),
                    "control_id": control_id,
                    "finding_state": finding_state,
                    "summary": summary,
                }
            )
        return out
    except Exception as e:
        logger.warning("immudb list_runs failed: %s", e)
        return []


def get_run(run_id: str) -> dict | None:
    if not re.fullmatch(r"[a-fA-F0-9-]{36}", run_id or ""):
        return None
    client = _get_client()
    if client is None:
        return None
    if not _init_done:
        init()
    if not _init_done:
        return None
    try:
        result = client.sqlQuery(
            "SELECT run_id, mode, outcome, duration_ms, ts, control_id, finding_state, summary "
            "FROM runs WHERE run_id = @run_id;",
            params={"run_id": run_id},
        )
        rows = _rows(result)
        if not rows:
            return None
        run_id_v, mode, outcome, duration_ms, ts, control_id, finding_state, summary = rows[0]
        crit_result = client.sqlQuery(
            "SELECT name, passed, reason FROM run_criteria WHERE run_id = @run_id;",
            params={"run_id": run_id},
        )
        criteria = [
            {"name": name, "passed": bool(passed), "reason": reason}
            for (name, passed, reason) in _rows(crit_result)
        ]
        return {
            "run_id": run_id_v,
            "mode": mode,
            "outcome": outcome,
            "duration_ms": int(duration_ms) if duration_ms is not None else 0,
            "timestamp": _ts_to_iso(ts),
            "control_id": control_id,
            "finding_state": finding_state,
            "summary": summary,
            "criteria": criteria,
        }
    except Exception as e:
        logger.warning("immudb get_run failed: %s", e)
        return None


def _ts_to_iso(ts: Any) -> str:
    if isinstance(ts, datetime):
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        return ts.isoformat()
    if isinstance(ts, (int, float)):
        return datetime.fromtimestamp(ts / 1_000_000 if ts > 1e14 else ts, tz=timezone.utc).isoformat()
    return str(ts) if ts is not None else ""


def histogram_outcomes(bucket: str, limit: int = 30) -> list[dict]:
    """Group pass/fail counts by hour or day.

    immudb SQL has limited date functions, so bucketing is done in Python."""
    if bucket not in ("hour", "day"):
        raise ValueError("bucket must be 'hour' or 'day'")
    client = _get_client()
    if client is None:
        return []
    if not _init_done:
        init()
    if not _init_done:
        return []
    try:
        result = client.sqlQuery(
            "SELECT ts, outcome FROM runs ORDER BY ts DESC LIMIT 5000;"
        )
        rows = _rows(result)
        buckets: dict[str, dict] = {}
        for ts, outcome in rows:
            dt = ts if isinstance(ts, datetime) else _to_immudb_ts(_ts_to_iso(ts))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            if bucket == "hour":
                key = dt.replace(minute=0, second=0, microsecond=0)
            else:
                key = dt.replace(hour=0, minute=0, second=0, microsecond=0)
            key_iso = key.isoformat()
            slot = buckets.setdefault(key_iso, {"bucket": key_iso, "pass": 0, "fail": 0})
            if outcome == "pass":
                slot["pass"] += 1
            else:
                slot["fail"] += 1
        ordered = sorted(buckets.values(), key=lambda b: b["bucket"], reverse=True)
        limit = max(1, min(int(limit), 365))
        return list(reversed(ordered[:limit]))
    except Exception as e:
        logger.warning("immudb histogram_outcomes failed: %s", e)
        return []


def health() -> dict:
    client = _get_client()
    if client is None:
        return {"status": "unavailable", "reason": "not configured or unreachable"}
    try:
        client.sqlQuery("SELECT 1;")
        return {
            "status": "ok",
            "host": os.environ.get("IMMUDB_HOST"),
            "database": os.environ.get("IMMUDB_DATABASE", "defaultdb"),
        }
    except Exception as e:
        return {"status": "unavailable", "reason": str(e)}
