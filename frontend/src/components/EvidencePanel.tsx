import { useState } from "react";
import type { PipelineStage, RunDetail } from "../types";

interface Props {
  stage: PipelineStage;
  run: RunDetail | null;
  error: string | null;
}

export default function EvidencePanel({ stage, run, error }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="panel flex flex-col gap-2 overflow-auto">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Evidence</h2>

      {stage === "idle" && (
        <p className="text-sm text-gray-500">Run the pipeline to collect evidence.</p>
      )}

      {stage === "collect" && (
        <div className="flex items-center gap-2 text-sm text-blue-400">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
          Collecting evidence...
        </div>
      )}

      {stage === "error" && error && (
        <div className="p-2 rounded bg-red-900/30 border border-red-700/50">
          <p className="text-sm text-red-400 font-medium">Collection failed</p>
          <p className="text-xs text-red-300 mt-1">{error}</p>
          {error.includes("403") && (
            <p className="text-xs text-gray-400 mt-2">
              Ensure Policy.Read.All permission is granted and admin consent is given.
            </p>
          )}
        </div>
      )}

      {run && run.sanitized_evidence && (
        <>
          <div className="text-sm">
            <span className="text-gray-400">Policies found:</span>{" "}
            <span className="font-medium">{run.sanitized_evidence.length}</span>
          </div>
          {run.sanitized_evidence.map((p: any, i: number) => (
            <div key={i} className="p-2 rounded bg-gray-800/50 border border-gray-700/50 text-sm">
              <p className="font-medium">{p.displayName || `Policy ${i + 1}`}</p>
              <p className="text-xs text-gray-400">
                State: <span className={p.state === "enabled" ? "text-emerald-400" : "text-red-400"}>{p.state}</span>
              </p>
            </div>
          ))}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-400 hover:text-blue-300 mt-1 text-left"
          >
            {expanded ? "Hide raw JSON" : "View raw JSON"}
          </button>
          {expanded && (
            <pre className="text-xs bg-gray-900 p-2 rounded overflow-auto max-h-48 border border-gray-700/50">
              {JSON.stringify(run.sanitized_evidence, null, 2)}
            </pre>
          )}
        </>
      )}
    </div>
  );
}
