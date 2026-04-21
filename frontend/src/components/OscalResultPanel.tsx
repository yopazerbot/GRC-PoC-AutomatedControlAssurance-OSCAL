import { useState } from "react";
import { FileArchive } from "lucide-react";
import { PanelShell, type PanelState } from "./PanelShell";
import { StatusBadge } from "./StatusBadge";
import { CodeSnippet } from "./CodeSnippet";
import type { RunDetail } from "../types";

interface Props {
  state: PanelState;
  run: RunDetail | null;
}

function buildSnippet(run: RunDetail | null) {
  if (!run) {
    return {
      title: "OSCAL generation",
      language: "json" as const,
      lines: [
        '{ "assessment-results": {',
        '    "uuid": "<generated-v4>",',
        '    "import-ap": { "href": "assessment-plan.json" },',
        '    "results": [{ "findings": [...],',
        '      "observations": [...],',
        '      "risks": [...] }]',
        "}}",
      ],
      inputs: ["evaluation_result", "sanitized_evidence"],
      outputs: ["assessment-results.json"],
    };
  }

  const ar = run.assessment_results as any;
  const uuid = ar?.["assessment-results"]?.uuid ?? "N/A";
  const result = ar?.["assessment-results"]?.results?.[0];
  const findingState = result?.findings?.[0]?.target?.status?.state ?? "unknown";
  const obsCount = result?.observations?.length ?? 0;
  const riskCount = result?.risks?.length ?? 0;

  return {
    title: "Generated OSCAL output",
    language: "json" as const,
    lines: [
      `{ "assessment-results": {`,
      `    "uuid": "${uuid}",`,
      `    "oscal-version": "1.1.3",`,
      `    "finding": "${findingState}",`,
      `    "observations": ${obsCount},`,
      `    "risks": ${riskCount}`,
      `}}`,
    ],
    inputs: ["evaluation_result", "sanitized_evidence"],
    outputs: ["assessment-results.json"],
  };
}

export default function OscalResultPanel({ state, run }: Props) {
  const [expanded, setExpanded] = useState(false);

  const results = run?.assessment_results as any;
  const result = results?.["assessment-results"]?.results?.[0];

  return (
    <PanelShell title="OSCAL Artifacts" subtitle="Assessment Results" state={state}>
      <div className="flex flex-col gap-3">
        {state === "active" && !run && (
          <div className="flex items-center gap-2 text-xs text-accent-cyan">
            <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
            Generating OSCAL document...
          </div>
        )}

        {!run && state !== "active" && (
          <p className="text-xs text-surface-muted">OSCAL Assessment Results will appear here.</p>
        )}

        {run && result && (
          <>
            <div className="flex items-center gap-2">
              <StatusBadge
                kind="status"
                value={run.outcome === "pass" ? "PASS" : "FAIL"}
                size="md"
              />
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(run.assessment_results, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `assessment-results-${run.run_id.slice(0, 8)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan text-xs font-semibold uppercase tracking-wider hover:brightness-110 transition-colors"
              >
                <FileArchive className="w-3 h-3" />
                Download OSCAL (audit evidence)
              </button>
            </div>

            <div className="space-y-1 text-[10px] text-surface-muted font-mono">
              <div>
                uuid: <span className="text-surface-text">{result.uuid?.slice(0, 8)}...</span>
              </div>
              <div>
                timestamp:{" "}
                <span className="text-surface-text">
                  {result.start ? new Date(result.start).toLocaleString() : "N/A"}
                </span>
              </div>
              <div>
                duration: <span className="text-surface-text">{run.duration_ms}ms</span>
              </div>
              <div>
                oscal-version: <span className="text-surface-text">1.1.3</span>
              </div>
            </div>

            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[10px] text-accent-cyan hover:brightness-110 transition-colors text-left font-medium"
            >
              {expanded ? "Hide full OSCAL" : "View full OSCAL"}
            </button>
            {expanded && (
              <pre className="text-[11px] font-mono bg-surface-700/60 p-3 rounded-md overflow-auto max-h-40 border border-surface-border text-surface-text">
                {JSON.stringify(run.assessment_results, null, 2)}
              </pre>
            )}
          </>
        )}

        <CodeSnippet snippet={buildSnippet(run)} />
      </div>
    </PanelShell>
  );
}
