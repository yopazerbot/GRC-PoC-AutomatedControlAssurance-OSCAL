from __future__ import annotations

import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

from collector import collect_mock_pass, collect_mock_fail, collect_live, sanitize_evidence
from evaluator import evaluate
from oscal_generator import generate_assessment_results


@dataclass
class RunResult:
    run_id: str
    mode: str
    timestamp: str
    outcome: str
    duration_ms: int
    evaluation: dict
    assessment_results: dict
    sanitized_evidence: list[dict]


async def execute_pipeline(
    mode: str,
    tenant_id: str | None = None,
    client_id: str | None = None,
    client_secret: str | None = None,
) -> RunResult:
    run_id = str(uuid.uuid4())
    start = time.monotonic()
    timestamp = datetime.now(timezone.utc).isoformat()

    if mode == "mock-pass":
        raw_policies = collect_mock_pass()
    elif mode == "mock-fail":
        raw_policies = collect_mock_fail()
    elif mode == "live":
        if not all([tenant_id, client_id, client_secret]):
            raise ValueError("Live mode requires tenant_id, client_id, and client_secret.")
        raw_policies = await collect_live(tenant_id, client_id, client_secret)
    else:
        raise ValueError(f"Unknown mode: {mode}")

    sanitized = sanitize_evidence(raw_policies)
    evaluation = evaluate(raw_policies)
    assessment_results = generate_assessment_results(evaluation, sanitized, mode)
    duration_ms = int((time.monotonic() - start) * 1000)

    eval_dict = {
        "passed": evaluation.passed,
        "summary": evaluation.summary,
        "criteria": [
            {"name": c.name, "passed": c.passed, "reason": c.reason}
            for c in evaluation.criteria
        ],
    }

    return RunResult(
        run_id=run_id,
        mode=mode,
        timestamp=timestamp,
        outcome="pass" if evaluation.passed else "fail",
        duration_ms=duration_ms,
        evaluation=eval_dict,
        assessment_results=assessment_results,
        sanitized_evidence=sanitized,
    )
