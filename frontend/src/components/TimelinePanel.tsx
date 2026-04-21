import type { RunSummary } from "../types";

interface Props {
  runs: RunSummary[];
  onSelect: (runId: string) => void;
  activeRunId: string | null;
}

export default function TimelinePanel({ runs, onSelect, activeRunId }: Props) {
  return (
    <div className="panel flex flex-col gap-2 col-span-2 overflow-auto">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Timeline</h2>

      {runs.length === 0 ? (
        <p className="text-sm text-gray-500">No runs yet. Execute the pipeline to see history.</p>
      ) : (
        <div className="flex items-end gap-1.5 h-16 overflow-x-auto pb-1">
          {runs.slice().reverse().map((run) => {
            const isActive = run.run_id === activeRunId;
            const color = run.mode.startsWith("mock")
              ? run.outcome === "pass" ? "bg-blue-500" : "bg-blue-400"
              : run.outcome === "pass" ? "bg-emerald-500" : "bg-red-500";

            return (
              <button
                key={run.run_id}
                onClick={() => onSelect(run.run_id)}
                className={`group relative flex flex-col items-center gap-0.5 transition-all ${isActive ? "scale-110" : "hover:scale-105"}`}
                title={`${run.mode} - ${run.outcome} - ${new Date(run.timestamp).toLocaleTimeString()}`}
              >
                <div className={`w-4 h-4 rounded-full ${color} ${isActive ? "ring-2 ring-white/50" : ""} transition-all`} />
                <span className="text-[9px] text-gray-500">{run.mode.replace("mock-", "m:")}</span>
              </button>
            );
          })}
        </div>
      )}

      {runs.length > 0 && (
        <div className="flex gap-4 text-xs text-gray-500 mt-auto pt-1 border-t border-gray-700/50">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Live pass</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Live fail</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Mock pass</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Mock fail</span>
        </div>
      )}
    </div>
  );
}
