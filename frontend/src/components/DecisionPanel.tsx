import type { PipelineStage, RunDetail } from "../types";

interface Props {
  stage: PipelineStage;
  run: RunDetail | null;
}

export default function DecisionPanel({ stage, run }: Props) {
  const results = run?.assessment_results as any;
  const risks = results?.["assessment-results"]?.results?.[0]?.risks ?? [];

  return (
    <div className="panel flex flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider self-start">Decision</h2>

      {!run && (
        <p className="text-sm text-gray-500">Awaiting pipeline execution.</p>
      )}

      {run && (
        <>
          <div className={`text-4xl font-black tracking-tight
            ${run.outcome === "pass" ? "text-emerald-400" : "text-red-400"}`}>
            {run.outcome === "pass" ? "PASS" : "FAIL"}
          </div>
          {run.outcome === "pass" ? (
            <div className="space-y-1">
              <p className="text-sm text-emerald-300 font-medium">Risk: None identified</p>
              <p className="text-sm text-gray-300">
                Guest MFA enforcement is active. Conditional Access policy is enabled and requires MFA for guest users.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-red-300 font-medium">Risk: HIGH</p>
              <p className="text-sm text-gray-300">
                Guest MFA enforcement is not active. {run.evaluation?.summary}
              </p>
              {risks[0] && (
                <p className="text-xs text-red-300/70 mt-1">{risks[0].description}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
