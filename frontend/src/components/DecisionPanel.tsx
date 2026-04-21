import { PanelShell, type PanelState } from "./PanelShell";
import { StatusBadge } from "./StatusBadge";
import type { RunDetail } from "../types";

interface Props {
  state: PanelState;
  run: RunDetail | null;
}

export default function DecisionPanel({ state, run }: Props) {
  const results = run?.assessment_results as any;
  const risks = results?.["assessment-results"]?.results?.[0]?.risks ?? [];
  const hasRisk = risks.length > 0;

  return (
    <PanelShell title="Decision" subtitle="Pass/Fail" state={state}>
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        {!run && (
          <p className="text-xs text-surface-muted">Awaiting pipeline execution.</p>
        )}

        {run && (
          <>
            <div className="flex items-center gap-2">
              <StatusBadge
                kind="status"
                value={run.outcome === "pass" ? "PASS" : "FAIL"}
                size="lg"
              />
              <StatusBadge
                kind="risk"
                value={hasRisk ? "HIGH" : "NONE"}
                size="lg"
              />
            </div>

            <p className="text-xs text-surface-muted leading-relaxed max-w-xs">
              {run.outcome === "pass"
                ? "Guest MFA enforcement is active. Conditional Access policy is enabled and requires MFA for guest users."
                : `Guest MFA enforcement is not active. ${run.evaluation?.summary ?? ""}`}
            </p>

            {hasRisk && risks[0]?.description && (
              <p className="text-[10px] text-accent-red/70 max-w-xs">{risks[0].description}</p>
            )}
          </>
        )}
      </div>
    </PanelShell>
  );
}
