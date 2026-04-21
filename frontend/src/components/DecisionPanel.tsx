import { ShieldCheck, ShieldAlert } from "lucide-react";
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
  const isPass = run?.outcome === "pass";

  return (
    <PanelShell title="Pass / Fail" subtitle="Control outcome" state={state}>
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        {!run && (
          <p className="text-sm text-surface-muted">Awaiting pipeline execution.</p>
        )}

        {run && (
          <>
            {isPass ? (
              <ShieldCheck className="w-12 h-12 text-accent-emerald" />
            ) : (
              <ShieldAlert className="w-12 h-12 text-accent-red" />
            )}

            <div className={`text-3xl font-black tracking-tight ${isPass ? "text-accent-emerald" : "text-accent-red"}`}>
              {isPass ? "PASS" : "FAIL"}
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge kind="risk" value={hasRisk ? "HIGH" : "NONE"} size="md" />
            </div>

            <p className="text-sm text-surface-muted leading-relaxed max-w-xs">
              {isPass
                ? "Guest MFA enforcement is active."
                : run.evaluation?.summary ?? "Control not met."}
            </p>
          </>
        )}
      </div>
    </PanelShell>
  );
}
