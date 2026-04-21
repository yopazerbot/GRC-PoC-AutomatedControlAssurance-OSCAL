import { useState } from "react";
import { PanelShell, type PanelState } from "./PanelShell";
import { CodeSnippet } from "./CodeSnippet";
import type { RunDetail } from "../types";

interface Props {
  state: PanelState;
  run: RunDetail | null;
  error: string | null;
}

function buildSnippet(run: RunDetail | null) {
  if (!run || run.mode !== "live") {
    return {
      title: "Graph API collection",
      language: "python" as const,
      lines: [
        "token = await get_token(tenant, client, secret)",
        "resp = await client.get(",
        '  "graph.microsoft.com/v1.0/identity"',
        '  "/conditionalAccess/policies",',
        '  headers={"Authorization": f"Bearer {token}"}',
        ")",
        "return resp.json()['value']",
      ],
      inputs: ["tenant_id", "client_id", "client_secret"],
      outputs: ["policies[]"],
    };
  }

  const policyCount = run.sanitized_evidence?.length ?? 0;
  const names = run.sanitized_evidence
    ?.slice(0, 3)
    .map((p: any) => p.displayName || "unnamed") ?? [];

  return {
    title: "Live Graph API response",
    language: "json" as const,
    lines: [
      `// ${policyCount} policy(ies) returned from tenant`,
      `{ "value": [`,
      ...names.map((n, i) =>
        `  { "displayName": "${n}"${i < names.length - 1 ? "," : ""}`
      ),
      policyCount > 3 ? `    // +${policyCount - 3} more...` : "",
      `] }`,
    ].filter(Boolean),
    inputs: ["tenant_id", "client_id"],
    outputs: [`${policyCount} policies`],
  };
}

export default function EvidencePanel({ state, run, error }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <PanelShell title="Evidence Collection" subtitle="Conditional Access" state={state}>
      <div className="flex flex-col gap-3">
        {state === "active" && !run && !error && (
          <div className="flex items-center gap-2 text-xs text-accent-cyan">
            <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
            Collecting evidence from source...
          </div>
        )}

        {error && (
          <div className="rounded-md border border-accent-red/30 bg-accent-red/5 p-3">
            <div className="text-[11px] font-semibold text-accent-red">Collection failed</div>
            <p className="text-xs text-surface-muted mt-1">{error}</p>
            {error.includes("403") && (
              <p className="text-[10px] text-surface-muted mt-2">
                Ensure <span className="font-mono">Policy.Read.All</span> permission is granted and admin consent is given.
              </p>
            )}
          </div>
        )}

        {!run && !error && state !== "active" && (
          <p className="text-xs text-surface-muted">Run the pipeline to collect evidence.</p>
        )}

        {run?.sanitized_evidence && (
          <>
            <div className="text-xs">
              <span className="text-surface-muted">Policies found:</span>{" "}
              <span className="font-mono font-semibold">{run.sanitized_evidence.length}</span>
              {run.mode === "live" && (
                <span className="ml-2 text-[10px] text-accent-cyan font-mono">LIVE</span>
              )}
            </div>
            {run.sanitized_evidence.map((p: any, i: number) => (
              <div key={i} className="rounded-md border border-surface-border bg-surface-700/60 p-3">
                <div className="text-xs font-semibold text-surface-text">
                  {p.displayName || `Policy ${i + 1}`}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1.5 text-[10px] font-mono">
                  <span className="text-surface-muted">state:</span>
                  <span className={p.state === "enabled" ? "text-accent-emerald" : "text-accent-red"}>
                    {p.state}
                  </span>
                  {p.createdDateTime && (
                    <>
                      <span className="text-surface-muted">created:</span>
                      <span className="text-surface-text">{new Date(p.createdDateTime).toLocaleDateString()}</span>
                    </>
                  )}
                  {p.modifiedDateTime && (
                    <>
                      <span className="text-surface-muted">modified:</span>
                      <span className="text-surface-text">{new Date(p.modifiedDateTime).toLocaleDateString()}</span>
                    </>
                  )}
                  {p.id && (
                    <>
                      <span className="text-surface-muted">id:</span>
                      <span className="text-surface-text">{p.id.slice(0, 8)}...</span>
                    </>
                  )}
                </div>
              </div>
            ))}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[10px] text-accent-cyan hover:brightness-110 transition-colors text-left font-medium"
            >
              {expanded ? "Hide raw JSON" : "View raw JSON"}
            </button>
            {expanded && (
              <pre className="text-[11px] font-mono bg-surface-700/60 p-3 rounded-md overflow-auto max-h-40 border border-surface-border text-surface-text">
                {JSON.stringify(run.sanitized_evidence, null, 2)}
              </pre>
            )}
          </>
        )}

        <CodeSnippet snippet={buildSnippet(run)} />
      </div>
    </PanelShell>
  );
}
