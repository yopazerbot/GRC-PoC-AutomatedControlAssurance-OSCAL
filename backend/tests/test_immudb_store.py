"""Tests for the immudb audit store's allowlist + PII guard.

These tests deliberately do not require a running immudb instance —
they exercise `build_persisted_record` and `_assert_no_pii` directly.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pipeline import RunResult  # noqa: E402
from immudb_store import (  # noqa: E402
    CONTROL_ID,
    _assert_no_pii,
    build_persisted_record,
)


def _make_run(**overrides) -> RunResult:
    defaults = dict(
        run_id="11111111-2222-4333-8444-555555555555",
        mode="mock-pass",
        timestamp="2026-05-14T10:00:00+00:00",
        outcome="pass",
        duration_ms=42,
        evaluation={
            "passed": True,
            "summary": "Guest MFA enforcement is active via policy 'Demo Policy'.",
            "criteria": [
                {"name": "Policy exists", "passed": True, "reason": "Found 1 policy."},
                {
                    "name": "Requires MFA",
                    "passed": True,
                    "reason": "Policy 'Demo Policy' requires MFA for guest users.",
                },
            ],
        },
        assessment_results={"should": "be ignored"},
        sanitized_evidence=[{"displayName": "should be ignored"}],
    )
    defaults.update(overrides)
    return RunResult(**defaults)


class TestBuildPersistedRecord:
    def test_allowlist_only(self):
        run = _make_run()
        rec = build_persisted_record(run)
        assert set(rec.keys()) == {
            "run_id",
            "mode",
            "outcome",
            "duration_ms",
            "ts",
            "control_id",
            "finding_state",
            "summary",
            "criteria",
        }
        assert rec["control_id"] == CONTROL_ID
        assert rec["finding_state"] == "satisfied"

    def test_drops_assessment_results_and_evidence(self):
        run = _make_run()
        rec = build_persisted_record(run)
        serialised = repr(rec)
        assert "assessment_results" not in serialised
        assert "sanitized_evidence" not in serialised

    def test_normalises_quoted_policy_names(self):
        run = _make_run(
            evaluation={
                "passed": True,
                "summary": "Active via policy 'alice@example.com'.",
                "criteria": [
                    {
                        "name": "Requires MFA",
                        "passed": True,
                        "reason": "Policy 'bob.smith@corp.com' requires MFA.",
                    },
                ],
            }
        )
        rec = build_persisted_record(run)
        assert "alice@example.com" not in rec["summary"]
        assert "bob.smith@corp.com" not in rec["criteria"][0]["reason"]
        assert "<policy>" in rec["summary"]

    def test_finding_state_fail(self):
        run = _make_run(outcome="fail")
        rec = build_persisted_record(run)
        assert rec["finding_state"] == "not-satisfied"


class TestAssertNoPii:
    def test_clean_record_passes(self):
        rec = build_persisted_record(_make_run())
        _assert_no_pii(rec)

    def test_email_in_summary_rejected(self):
        rec = build_persisted_record(_make_run())
        rec["summary"] = "leak: alice@example.com"
        with pytest.raises(ValueError, match="email"):
            _assert_no_pii(rec)

    def test_ipv4_in_reason_rejected(self):
        rec = build_persisted_record(_make_run())
        rec["criteria"][0]["reason"] = "blocked from 10.0.0.1"
        with pytest.raises(ValueError, match="IP"):
            _assert_no_pii(rec)

    def test_guid_in_summary_rejected(self):
        rec = build_persisted_record(_make_run())
        rec["summary"] = "ref 11111111-2222-4333-8444-555555555555"
        with pytest.raises(ValueError, match="GUID"):
            _assert_no_pii(rec)

    def test_run_id_guid_is_allowed(self):
        # run_id itself is a random server-generated UUID, not user-derived.
        rec = build_persisted_record(_make_run())
        _assert_no_pii(rec)

    @pytest.mark.parametrize(
        "needle",
        ["tenant", "userPrincipalName", "givenName", "surname", "jobTitle"],
    )
    def test_pii_substrings_rejected(self, needle):
        rec = build_persisted_record(_make_run())
        rec["summary"] = f"something about {needle} here"
        with pytest.raises(ValueError, match="substring"):
            _assert_no_pii(rec)
