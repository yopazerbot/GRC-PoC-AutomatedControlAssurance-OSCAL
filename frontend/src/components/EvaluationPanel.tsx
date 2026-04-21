import type { PipelineStage, RunDetail } from "../types";

interface Props {
  stage: PipelineStage;
  run: RunDetail | null;
}

export default function EvaluationPanel({ stage, run }: Props) {
  return (
    <div className="panel flex flex-col gap-2 overflow-auto">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Evaluation</h2>

      {stage === "evaluate" && (
        <div className="flex items-center gap-2 text-sm text-blue-400">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
          Evaluating criteria...
        </div>
      )}

      {!run && !["evaluate"].includes(stage) && (
        <p className="text-sm text-gray-500">Criteria will appear after evidence is collected.</p>
      )}

      {run?.evaluation?.criteria && (
        <div className="flex flex-col gap-1.5">
          {run.evaluation.criteria.map((c, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded bg-gray-800/50 border border-gray-700/50">
              <span className="mt-0.5 flex-shrink-0">
                {c.passed ? (
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                )}
              </span>
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-gray-400">{c.reason}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
