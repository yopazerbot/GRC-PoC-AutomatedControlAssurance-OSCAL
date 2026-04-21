import { CheckCircle2, XCircle } from "lucide-react";
import { PanelShell, type PanelState } from "./PanelShell";
import { CodeSnippet } from "./CodeSnippet";
import type { RunDetail } from "../types";

interface Props {
  state: PanelState;
  run: RunDetail | null;
}

const SNIPPET = {
  title: "evaluation logic",
  language: "python" as const,
  lines: [
    "for policy in policies:",
    "  if not targets_guests(policy): continue",
    "  if policy['state'] != 'enabled': fail()",
    "  if 'mfa' not in grant_controls: fail()",
    "  return PASS",
    "return FAIL  # no qualifying policy",
  ],
  inputs: ["policies[]"],
  outputs: ["evaluation_result"],
};

export default function EvaluationPanel({ state, run }: Props) {
  return (
    <PanelShell title="Evaluation" subtitle="4 criteria" state={state}>
      <div className="flex flex-col gap-3">
        {state === "active" && !run && (
          <div className="flex items-center gap-2 text-xs text-accent-cyan">
            <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
            Evaluating criteria...
          </div>
        )}

        {!run && state !== "active" && (
          <p className="text-xs text-surface-muted">Criteria will appear after evidence is collected.</p>
        )}

        {run?.evaluation?.criteria && (
          <div className="flex flex-col gap-2">
            {run.evaluation.criteria.map((c, i) => (
              <div
                key={i}
                className={[
                  "flex items-start gap-2.5 p-2.5 rounded-md border",
                  c.passed
                    ? "border-accent-emerald/20 bg-accent-emerald/5"
                    : "border-accent-red/20 bg-accent-red/5",
                ].join(" ")}
              >
                {c.passed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-emerald shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-accent-red shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-surface-text">{c.name}</div>
                  <div className="text-[10px] text-surface-muted mt-0.5">{c.reason}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <CodeSnippet snippet={SNIPPET} />
      </div>
    </PanelShell>
  );
}
