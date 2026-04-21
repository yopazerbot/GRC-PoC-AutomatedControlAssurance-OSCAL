import { ShieldCheck, AlertTriangle, FileCheck, TrendingUp } from "lucide-react";
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
  const isPass = run?.outcome === "pass";

  return (
    <PanelShell title="Assurance Summary" subtitle="Leadership view" state={state}>
      <div className="flex flex-col gap-3">
        {!run && (
          <p className="text-sm text-surface-muted">
            Run the pipeline to generate an assurance summary.
          </p>
        )}

        {run && (
          <>
            <div className="flex items-center gap-2">
              <StatusBadge kind="status" value={isPass ? "PASS" : "FAIL"} size="lg" />
              <StatusBadge kind="risk" value={hasRisk ? "HIGH" : "LOW"} size="lg" />
            </div>

            <div className={[
              "flex items-start gap-3 p-3 rounded-md border",
              isPass
                ? "border-accent-emerald/20 bg-accent-emerald/5"
                : "border-accent-red/20 bg-accent-red/5",
            ].join(" ")}>
              {isPass ? (
                <ShieldCheck className="w-5 h-5 text-accent-emerald shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-accent-red shrink-0 mt-0.5" />
              )}
              <p className="text-sm text-surface-text leading-relaxed">
                {isPass
                  ? "MFA is enforced for all guest users. Control A.8.5 is satisfied."
                  : `Control not met. ${run.evaluation?.summary ?? ""}`}
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-md border border-surface-border bg-surface-700/30">
              <FileCheck className="w-5 h-5 text-accent-cyan shrink-0 mt-0.5" />
              <p className="text-sm text-surface-muted leading-relaxed">
                <span className="font-semibold text-surface-text">Evidence: </span>
                {run.mode === "live" ? "Live Entra ID query" : `Mock ${run.mode.replace("mock-", "")} fixture`}
                {" · "}OSCAL 1.1.3
              </p>
            </div>

            {hasRisk && (
              <div className="flex items-start gap-3 p-3 rounded-md border border-accent-amber/20 bg-accent-amber/5">
                <TrendingUp className="w-5 h-5 text-accent-amber shrink-0 mt-0.5" />
                <p className="text-sm text-surface-text leading-relaxed">
                  <span className="font-semibold">Action required:</span> Enable MFA policy for guest users and re-run assessment.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </PanelShell>
  );
}
