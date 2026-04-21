import type { PipelineStage } from "../types";

const STAGES: { key: PipelineStage; label: string }[] = [
  { key: "collect", label: "Collect" },
  { key: "evaluate", label: "Evaluate" },
  { key: "generate", label: "Generate OSCAL" },
  { key: "done", label: "Done" },
];

const ORDER: Record<string, number> = { idle: -1, collect: 0, evaluate: 1, generate: 2, done: 3, error: -1 };

interface Props {
  stage: PipelineStage;
}

export default function FlowTimeline({ stage }: Props) {
  const current = ORDER[stage] ?? -1;

  return (
    <div className="panel flex items-center justify-center gap-2 py-3">
      {STAGES.map((s, i) => {
        const idx = ORDER[s.key];
        const isActive = idx === current;
        const isDone = idx < current && current >= 0;
        const isPending = idx > current || current < 0;

        return (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${isActive ? "bg-blue-600 text-white animate-pulse-stage" : ""}
              ${isDone ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30" : ""}
              ${isPending ? "bg-gray-800/50 text-gray-500 border border-gray-700/50" : ""}
              ${stage === "error" && idx === current ? "bg-red-600 text-white" : ""}
            `}>
              {isDone && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
              {s.label}
            </div>
            {i < STAGES.length - 1 && (
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}
