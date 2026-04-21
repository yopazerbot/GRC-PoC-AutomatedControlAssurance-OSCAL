import { PanelShell, type PanelState } from "./PanelShell";
import { StatusBadge } from "./StatusBadge";
import type { RunDetail } from "../types";

interface Props {
  state: PanelState;
  run: RunDetail | null;
}

export function ExecutivePanel({ state, run }: Props) {
  const results = run?.assessment_results as any;
  const risks = results?.["assessment-results"]?.results?.[0]?.risks ?? [];
  const hasRisk = risks.length > 0;

  return (
    <PanelShell title="Assurance Summary" subtitle="Leadership view" state={state}>
      <div className="flex flex-col gap-3">
        {!run && (
          <p className="text-xs text-surface-muted">
            Run the pipeline to generate an assurance summary for leadership review.
          </p>
        )}

        {run && (
          <>
            <div className="rounded-md border border-surface-border bg-surface-700/30 p-3">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-surface-muted mb-2">
                Control status
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge
                  kind="status"
                  value={run.outcome === "pass" ? "PASS" : "FAIL"}
                  size="lg"
                />
                <StatusBadge
                  kind="risk"
                  value={hasRisk ? "HIGH" : "LOW"}
                  size="md"
                />
              </div>
            </div>

            <div className="rounded-md border border-surface-border bg-surface-700/30 p-3">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-surface-muted mb-1">
                Assurance statement
              </div>
              <p className="text-xs text-surface-text leading-relaxed">
                {run.outcome === "pass"
                  ? "Multi-factor authentication is enforced for all guest and external users accessing tenant resources via Conditional Access. The organisation meets the requirements of ISO 27001:2022 Annex A 8.5 for this control scope."
                  : `The control objective is not currently met. ${run.evaluation?.summary ?? ""} Remediation is required before this control can be marked as compliant.`}
              </p>
            </div>

            <div className="rounded-md border border-surface-border bg-surface-700/30 p-3">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-surface-muted mb-1">
                Evidence basis
              </div>
              <p className="text-xs text-surface-muted leading-relaxed">
                Assessment performed via{" "}
                {run.mode === "live"
                  ? "live query of Microsoft Entra ID Conditional Access policies through Microsoft Graph API"
                  : `simulated ${run.mode.replace("mock-", "")} scenario using mock fixture data`}
                . Results documented in OSCAL 1.1.3 Assessment Results format with full traceability to
                the control catalog, profile, and system security plan.
              </p>
            </div>

            {hasRisk && (
              <div className="rounded-md border border-accent-red/30 bg-accent-red/5 p-3">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-accent-red mb-1">
                  Recommended action
                </div>
                <p className="text-xs text-surface-text leading-relaxed">
                  Enable the Conditional Access policy requiring MFA for guest users, or create a new policy
                  targeting guest and external user types with MFA as a required grant control. Re-run this
                  assessment to confirm remediation.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </PanelShell>
  );
}
