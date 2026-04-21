import { PanelShell, type PanelState } from "./PanelShell";
import type { RunSummary } from "../types";

interface Props {
  state: PanelState;
  runs: RunSummary[];
  activeRunId: string | null;
  onSelect: (runId: string) => void;
}

const BAR_HEIGHT_PX = 56;

function MiniBarChart({ runs, onSelect }: { runs: RunSummary[]; onSelect: (id: string) => void }) {
  const displayed = runs.slice(0, 25).reverse();
  const maxDuration = Math.max(...displayed.map((r) => r.duration_ms), 1);

  return (
    <div className="flex items-end gap-[3px] px-1" style={{ height: `${BAR_HEIGHT_PX}px` }}>
      {displayed.map((run) => {
        const pct = Math.max(0.08, run.duration_ms / maxDuration);
        const barH = Math.round(pct * BAR_HEIGHT_PX);
        const isPass = run.outcome === "pass";
        const isMock = run.mode.startsWith("mock");
        const color = isMock
          ? isPass ? "bg-accent-blue" : "bg-accent-indigo"
          : isPass ? "bg-accent-emerald" : "bg-accent-red";

        return (
          <div
            key={run.run_id}
            onClick={() => onSelect(run.run_id)}
            className={`flex-1 min-w-[6px] max-w-[24px] rounded-t-sm cursor-pointer transition-all hover:brightness-125 ${color}`}
            style={{ height: `${barH}px` }}
            title={`${run.mode} · ${run.outcome} · ${run.duration_ms}ms · ${new Date(run.timestamp).toLocaleTimeString()}`}
          />
        );
      })}
      {displayed.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-[10px] text-surface-muted">
          No data yet
        </div>
      )}
    </div>
  );
}

export function HistoryPanel({ state, runs, activeRunId, onSelect }: Props) {
  return (
    <PanelShell title="History" subtitle={`${runs.length} runs`} state={state} className="col-span-3">
      <div className="flex flex-col gap-3 h-full">
        {runs.length === 0 ? (
          <p className="text-xs text-surface-muted">No runs yet. Execute the pipeline to see history.</p>
        ) : (
          <>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-surface-muted mb-1">
                Run duration (ms)
              </div>
              <div className="rounded-md border border-surface-border bg-surface-700/30 p-2">
                <MiniBarChart runs={runs} onSelect={onSelect} />
              </div>
              <div className="flex justify-between text-[9px] text-surface-muted mt-0.5 px-1">
                <span>oldest</span>
                <span>latest</span>
              </div>
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
