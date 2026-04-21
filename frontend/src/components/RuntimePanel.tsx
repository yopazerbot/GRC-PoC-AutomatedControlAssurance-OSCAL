import { PanelShell, type PanelState } from "./PanelShell";
import type { RunSummary } from "../types";

interface Props {
  state: PanelState;
  runs: RunSummary[];
  activeRunId: string | null;
  onSelect: (runId: string) => void;
}

export function RuntimePanel({ state, runs, activeRunId, onSelect }: Props) {
  return (
    <PanelShell title="Runtime" subtitle={`${runs.length} runs`} state={state} className="col-span-2">
      <div className="flex flex-col gap-3 h-full">
        {runs.length === 0 ? (
          <p className="text-xs text-surface-muted">No runs yet. Execute the pipeline to see history.</p>
        ) : (
          <>
            <div className="flex items-end gap-1.5 overflow-x-auto pb-1">
              {runs.slice().reverse().map((run) => {
                const isActive = run.run_id === activeRunId;
                const isMock = run.mode.startsWith("mock");
                const isPass = run.outcome === "pass";

                const dotColor = isMock
                  ? isPass ? "bg-accent-blue" : "bg-accent-indigo"
                  : isPass ? "bg-accent-emerald" : "bg-accent-red";

                return (
                  <button
                    key={run.run_id}
                    onClick={() => onSelect(run.run_id)}
                    className={[
                      "group flex flex-col items-center gap-0.5 transition-all shrink-0",
                      isActive ? "scale-110" : "hover:scale-105",
                    ].join(" ")}
                    title={`${run.mode} · ${run.outcome} · ${new Date(run.timestamp).toLocaleTimeString()}`}
                  >
                    <div
                      className={[
                        "w-4 h-4 rounded-full transition-all",
                        dotColor,
                        isActive ? "ring-2 ring-accent-cyan/50" : "",
                      ].join(" ")}
                    />
                    <span className="text-[9px] text-surface-muted font-mono">
                      {run.mode.replace("mock-", "m:")}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="overflow-auto flex-1">
              <table className="w-full text-[10px] font-mono">
                <thead>
                  <tr className="text-surface-muted uppercase tracking-wider border-b border-surface-border">
                    <th className="text-left py-1 pr-3 font-semibold">Run ID</th>
                    <th className="text-left py-1 pr-3 font-semibold">Mode</th>
                    <th className="text-left py-1 pr-3 font-semibold">Outcome</th>
                    <th className="text-left py-1 pr-3 font-semibold">Duration</th>
                    <th className="text-left py-1 font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.slice(0, 10).map((run) => (
                    <tr
                      key={run.run_id}
                      onClick={() => onSelect(run.run_id)}
                      className={[
                        "border-b border-surface-border/50 cursor-pointer hover:bg-surface-700/50 transition-colors",
                        run.run_id === activeRunId ? "bg-accent-cyan/5" : "",
                      ].join(" ")}
                    >
                      <td className="py-1 pr-3 text-surface-text">{run.run_id.slice(0, 8)}</td>
                      <td className="py-1 pr-3 text-surface-muted">{run.mode}</td>
                      <td className="py-1 pr-3">
                        <span
                          className={
                            run.outcome === "pass" ? "text-accent-emerald" : "text-accent-red"
                          }
                        >
                          {run.outcome}
                        </span>
                      </td>
                      <td className="py-1 pr-3 text-surface-muted">{run.duration_ms}ms</td>
                      <td className="py-1 text-surface-muted">
                        {new Date(run.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-4 text-[10px] text-surface-muted pt-1 border-t border-surface-border shrink-0">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-accent-emerald inline-block" /> Live pass
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-accent-red inline-block" /> Live fail
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-accent-blue inline-block" /> Mock pass
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-accent-indigo inline-block" /> Mock fail
              </span>
            </div>
          </>
        )}
      </div>
    </PanelShell>
  );
}
