from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class CriterionResult:
    name: str
    passed: bool
    reason: str


@dataclass
class EvaluationResult:
    passed: bool
    criteria: list[CriterionResult] = field(default_factory=list)
    summary: str = ""


def _targets_guests(policy: dict) -> bool:
    users = policy.get("conditions", {}).get("users", {})
    if users.get("includeGuestsOrExternalUsers"):
        return True
    include_users = users.get("includeUsers", [])
    if any("guest" in u.lower() for u in include_users if isinstance(u, str)):
        return True
    return False


def _is_enabled(policy: dict) -> bool:
    return policy.get("state") == "enabled"


def _requires_mfa(policy: dict) -> bool:
    controls = policy.get("grantControls", {}).get("builtInControls", [])
    return "mfa" in controls


def evaluate(policies: list[dict]) -> EvaluationResult:
    criteria: list[CriterionResult] = []

    if not policies:
        criteria.append(CriterionResult(
            name="Policy exists",
            passed=False,
            reason="No Conditional Access policies found in the tenant.",
        ))
        return EvaluationResult(passed=False, criteria=criteria, summary="No policies found.")

    criteria.append(CriterionResult(
        name="Policy exists",
        passed=True,
        reason=f"Found {len(policies)} Conditional Access policy(ies).",
    ))

    guest_policies = [p for p in policies if _targets_guests(p)]
    if not guest_policies:
        criteria.append(CriterionResult(
            name="Targets guest users",
            passed=False,
            reason="No policy targets guest or external users.",
        ))
        return EvaluationResult(
            passed=False, criteria=criteria,
            summary="No policy targeting guest users was found.",
        )

    criteria.append(CriterionResult(
        name="Targets guest users",
        passed=True,
        reason=f"{len(guest_policies)} policy(ies) target guest/external users.",
    ))

    best_policy = None
    for p in guest_policies:
        if _is_enabled(p) and _requires_mfa(p):
            best_policy = p
            break

    enabled_guests = [p for p in guest_policies if _is_enabled(p)]
    if not enabled_guests:
        names = ", ".join(f"'{p.get('displayName', 'unnamed')}'" for p in guest_policies)
        criteria.append(CriterionResult(
            name="Policy is enabled",
            passed=False,
            reason=f"Guest-targeting policy(ies) {names} exist but are not enabled.",
        ))
        return EvaluationResult(
            passed=False, criteria=criteria,
            summary=f"Policy(ies) {names} target guests but are disabled.",
        )

    criteria.append(CriterionResult(
        name="Policy is enabled",
        passed=True,
        reason=f"{len(enabled_guests)} enabled policy(ies) target guest users.",
    ))

    mfa_policies = [p for p in enabled_guests if _requires_mfa(p)]
    if not mfa_policies:
        criteria.append(CriterionResult(
            name="Requires MFA",
            passed=False,
            reason="Enabled guest-targeting policies do not require MFA as a grant control.",
        ))
        return EvaluationResult(
            passed=False, criteria=criteria,
            summary="Guest-targeting policies are enabled but do not require MFA.",
        )

    criteria.append(CriterionResult(
        name="Requires MFA",
        passed=True,
        reason=f"Policy '{mfa_policies[0].get('displayName', 'unnamed')}' requires MFA for guest users.",
    ))

    return EvaluationResult(
        passed=True,
        criteria=criteria,
        summary=f"Guest MFA enforcement is active via policy '{mfa_policies[0].get('displayName', 'unnamed')}'.",
    )
