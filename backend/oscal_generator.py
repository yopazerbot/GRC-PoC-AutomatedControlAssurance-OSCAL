from __future__ import annotations

import uuid
from datetime import datetime, timezone

from evaluator import EvaluationResult


ASSESSMENT_PLAN_UUID = "a1b2c3d4-1111-4000-8000-000000000004"
SSP_UUID = "a1b2c3d4-1111-4000-8000-000000000003"


def generate_assessment_results(
    evaluation: EvaluationResult,
    sanitized_evidence: list[dict],
    mode: str,
) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    result_uuid = str(uuid.uuid4())
    finding_uuid = str(uuid.uuid4())

    observations = []
    for i, evidence in enumerate(sanitized_evidence):
        observations.append({
            "uuid": str(uuid.uuid4()),
            "title": f"Conditional Access Policy: {evidence.get('displayName', f'Policy {i+1}')}",
            "description": f"Raw Conditional Access policy retrieved via {'Microsoft Graph API' if mode == 'live' else 'mock fixture'} ({mode} mode).",
            "methods": ["TEST"],
            "types": ["finding"],
            "collected": now,
            "relevant-evidence": [
                {
                    "description": "Conditional Access policy configuration",
                    "props": [
                        {"name": "state", "value": evidence.get("state", "unknown")},
                        {"name": "displayName", "value": evidence.get("displayName", "unknown")},
                    ],
                }
            ],
        })

    observation_uuids = [obs["uuid"] for obs in observations]

    finding = {
        "uuid": finding_uuid,
        "title": "MFA Enforcement for Guest Users",
        "description": evaluation.summary,
        "target": {
            "type": "objective-id",
            "target-id": "a-8-5",
            "description": "ISO 27001:2022 Annex A 8.5 - Secure Authentication",
            "status": {
                "state": "satisfied" if evaluation.passed else "not-satisfied",
            },
        },
        "related-observations": [
            {"observation-uuid": uid} for uid in observation_uuids
        ],
    }

    risks = []
    if not evaluation.passed:
        failed_criteria = [c for c in evaluation.criteria if not c.passed]
        risk_description = "; ".join(c.reason for c in failed_criteria)
        risks.append({
            "uuid": str(uuid.uuid4()),
            "title": "Guest Users Not Protected by MFA",
            "description": f"Control A.8.5 is not satisfied: {risk_description}",
            "status": "open",
            "characterizations": [
                {
                    "facets": [
                        {
                            "name": "likelihood",
                            "system": "https://grc-oscal.demo/risk",
                            "value": "high",
                        },
                        {
                            "name": "impact",
                            "system": "https://grc-oscal.demo/risk",
                            "value": "high",
                        },
                    ]
                }
            ],
        })

    result = {
        "uuid": result_uuid,
        "title": f"Assessment Result - {mode} - {'PASS' if evaluation.passed else 'FAIL'}",
        "description": f"Automated assessment of MFA enforcement for guest users ({mode} mode).",
        "start": now,
        "end": now,
        "reviewed-controls": {
            "control-selections": [
                {
                    "include-controls": [
                        {"control-id": "a-8-5"}
                    ]
                }
            ]
        },
        "findings": [finding],
        "observations": observations,
        "risks": risks,
    }

    return {
        "assessment-results": {
            "uuid": str(uuid.uuid4()),
            "metadata": {
                "title": "GRC-OSCAL Automated Assessment Results",
                "last-modified": now,
                "version": "1.0.0",
                "oscal-version": "1.1.3",
                "roles": [
                    {"id": "assessor", "title": "Automated Assessor"}
                ],
                "parties": [
                    {
                        "uuid": "a1b2c3d4-2222-4000-8000-000000000001",
                        "type": "organization",
                        "name": "GRC-OSCAL Demo",
                    }
                ],
            },
            "import-ap": {
                "href": f"assessment-plan.json#{ASSESSMENT_PLAN_UUID}",
            },
            "results": [result],
            "back-matter": {
                "resources": [
                    {
                        "uuid": str(uuid.uuid4()),
                        "title": "System Security Plan Reference",
                        "rlinks": [
                            {"href": f"ssp.json#{SSP_UUID}"}
                        ],
                    }
                ]
            },
        }
    }
