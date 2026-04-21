import { useState } from "react";
import type { PipelineStage, RunDetail } from "../types";

interface Props {
  stage: PipelineStage;
  run: RunDetail | null;
}

export default function OscalResultPanel({ stage, run }: Props) {
  const [expanded, setExpanded] = useState(false);

  const results = run?.assessment_results as any;
  const result = results?.["assessment-results"]?.results?.[0];

  return (
    <div className="panel flex flex-col gap-2 overflow-auto">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">OSCAL Result</h2>

      {stage === "generate" && (
        <div className="flex items-center gap-2 text-sm text-blue-400">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
          Generating OSCAL...
        </div>
      )}

      {!run && stage !== "generate" && (
        <p className="text-sm text-gray-500">OSCAL Assessment Results will appear here.</p>
      )}

      {run && result && (
        <>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold w-fit
            ${run.outcome === "pass" ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30" : "bg-red-600/20 text-red-400 border border-red-600/30"}`}>
            {run.outcome === "pass" ? "SATISFIED" : "NOT SATISFIED"}
          </div>
          <div className="text-xs text-gray-400 space-y-0.5">
            <p>UUID: <span className="font-mono text-gray-300">{result.uuid?.slice(0, 8)}...</span></p>
            <p>Timestamp: {result.start ? new Date(result.start).toLocaleString() : "N/A"}</p>
            <p>Duration: {run.duration_ms}ms</p>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-400 hover:text-blue-300 mt-1 text-left"
          >
            {expanded ? "Hide full OSCAL" : "View full OSCAL"}
          </button>
          {expanded && (
            <pre className="text-xs bg-gray-900 p-2 rounded overflow-auto max-h-48 border border-gray-700/50">
              {JSON.stringify(run.assessment_results, null, 2)}
            </pre>
          )}
        </>
      )}
    </div>
  );
}
