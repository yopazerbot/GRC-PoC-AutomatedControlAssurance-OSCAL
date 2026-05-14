import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Database, ShieldCheck, AlertTriangle, Check } from "lucide-react";
import {
  fetchImmudbHealth,
  fetchOutcomesHistogram,
  fetchPersistedRun,
  fetchPersistedRuns,
  type HistogramBucket,
  type ImmudbHealth,
  type PersistedRun,
} from "../api";

interface Props {
  open: boolean;
  onClose: () => void;
  reloadKey?: number;
}

const HISTO_HEIGHT_PX = 96;

function formatBucket(iso: string, bucket: "hour" | "day"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  if (bucket === "hour") {
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
    });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function OutcomeHistogram({
  buckets,
  bucket,
}: {
  buckets: HistogramBucket[];
  bucket: "hour" | "day";
}) {
  const max = Math.max(...buckets.map((b) => b.pass + b.fail), 1);
  if (buckets.length === 0) {
    return (
      <div className="text-xs text-surface-muted py-4 text-center">
        No persisted runs yet. Trigger a few pipeline runs to populate the histogram.
      </div>
    );
  }
  return (
    <div>
      <div
        className="flex items-end gap-[3px] px-1"
        style={{ height: `${HISTO_HEIGHT_PX}px` }}
      >
        {buckets.map((b) => {
          const total = b.pass + b.fail;
          const totalH = Math.max(2, Math.round((total / max) * HISTO_HEIGHT_PX));
          const passH = total === 0 ? 0 : Math.round((b.pass / total) * totalH);
          const failH = totalH - passH;
          return (
            <div
              key={b.bucket}
              className="flex-1 min-w-[8px] max-w-[28px] flex flex-col justify-end"
              title={`${formatBucket(b.bucket, bucket)} · ${b.pass} pass · ${b.fail} fail`}
            >
              {failH > 0 && (
                <div className="bg-accent-red w-full" style={{ height: `${failH}px` }} />
              )}
              {passH > 0 && (
                <div
                  className="bg-accent-emerald w-full rounded-t-sm"
                  style={{ height: `${passH}px` }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] text-surface-muted mt-0.5 px-1">
        <span>{buckets[0] ? formatBucket(buckets[0].bucket, bucket) : ""}</span>
        <span>
          {buckets[buckets.length - 1]
            ? formatBucket(buckets[buckets.length - 1].bucket, bucket)
            : ""}
        </span>
      </div>
    </div>
  );
}

function RunDetailView({ run }: { run: PersistedRun | null }) {
  if (!run) {
    return (
      <div className="text-xs text-surface-muted py-4 text-center">
        Select a run to view its persisted record.
      </div>
    );
  }
  return (
    <div className="space-y-3 text-xs">
      <div className="rounded-md border border-accent-amber/30 bg-accent-amber/5 p-2 text-[10px] text-accent-amber leading-snug">
        Stored fields only — no tenant, evidence or PII. The full OSCAL
        assessment-results document remains available from the live API
        response and the downloadable zip bundle.
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
        <div className="text-surface-muted">run_id</div>
        <div className="text-surface-text truncate" title={run.run_id}>
          {run.run_id}
        </div>
        <div className="text-surface-muted">mode</div>
        <div className="text-surface-text">{run.mode}</div>
        <div className="text-surface-muted">outcome</div>
        <div
          className={
            run.outcome === "pass" ? "text-accent-emerald" : "text-accent-red"
          }
        >
          {run.outcome}
        </div>
        <div className="text-surface-muted">duration_ms</div>
        <div className="text-surface-text">{run.duration_ms}</div>
        <div className="text-surface-muted">timestamp</div>
        <div className="text-surface-text">{new Date(run.timestamp).toLocaleString()}</div>
        <div className="text-surface-muted">control_id</div>
        <div className="text-surface-text">{run.control_id}</div>
        <div className="text-surface-muted">finding_state</div>
        <div className="text-surface-text">{run.finding_state}</div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider font-semibold text-surface-muted mb-1">
          Summary
        </div>
        <div className="text-surface-text">{run.summary || "—"}</div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider font-semibold text-surface-muted mb-1">
          Criteria
        </div>
        <ul className="space-y-1">
          {(run.criteria ?? []).map((c) => (
            <li
              key={c.name}
              className="flex items-start gap-2 rounded-md border border-surface-border bg-surface-700/30 px-2 py-1"
            >
              <span
                className={
                  c.passed
                    ? "text-accent-emerald shrink-0 mt-0.5"
                    : "text-accent-red shrink-0 mt-0.5"
                }
              >
                {c.passed ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3" />
                )}
              </span>
              <div>
                <div className="font-semibold text-surface-text">{c.name}</div>
                <div className="text-surface-muted text-[10px] leading-snug">
                  {c.reason}
                </div>
              </div>
            </li>
          ))}
          {(run.criteria ?? []).length === 0 && (
            <li className="text-surface-muted text-[10px]">No criteria recorded.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default function AuditTrailDrawer({ open, onClose, reloadKey }: Props) {
  const [health, setHealth] = useState<ImmudbHealth | null>(null);
  const [runs, setRuns] = useState<PersistedRun[]>([]);
  const [bucket, setBucket] = useState<"hour" | "day">("day");
  const [histogram, setHistogram] = useState<HistogramBucket[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<PersistedRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [h, r, b] = await Promise.all([
        fetchImmudbHealth().catch((e) => ({
          status: "unavailable" as const,
          reason: e instanceof Error ? e.message : String(e),
        })),
        fetchPersistedRuns(50).catch(() => [] as PersistedRun[]),
        fetchOutcomesHistogram(bucket, 30).catch(() => [] as HistogramBucket[]),
      ]);
      setHealth(h);
      setRuns(r);
      setHistogram(b);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [bucket]);

  useEffect(() => {
    if (!open) return;
    loadAll();
  }, [open, loadAll, reloadKey]);

  useEffect(() => {
    if (!open || !activeRunId) {
      setActiveRun(null);
      return;
    }
    let cancelled = false;
    fetchPersistedRun(activeRunId)
      .then((r) => {
        if (!cancelled) setActiveRun(r);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [open, activeRunId]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const statusBadge = useMemo(() => {
    if (!health) return null;
    const ok = health.status === "ok";
    return (
      <span
        className={[
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-wider font-mono",
          ok
            ? "border-accent-emerald/40 bg-accent-emerald/10 text-accent-emerald"
            : "border-accent-red/40 bg-accent-red/10 text-accent-red",
        ].join(" ")}
        title={ok ? `${health.host} · ${health.database}` : health.reason || "unreachable"}
      >
        <span
          aria-hidden
          className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-accent-emerald" : "bg-accent-red"}`}
        />
        {ok ? `connected · ${health.database ?? "defaultdb"}` : "unavailable"}
      </span>
    );
  }, [health]);

  const unavailable = health?.status !== "ok";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-label="Audit trail"
            aria-modal="true"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 250, damping: 32 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[640px] bg-surface-800 border-l border-surface-border z-50 flex flex-col [box-shadow:var(--shadow-panel)]"
          >
            <header className="flex items-center justify-between px-4 h-12 border-b border-surface-border shrink-0">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-accent-cyan" aria-hidden />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-surface-text">
                    Audit trail
                  </div>
                  <div className="text-[10px] text-surface-muted">
                    immudb · append-only · allowlisted fields
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-2 rounded-md border border-surface-border bg-surface-700 hover:bg-surface-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="flex-1 overflow-auto p-4 space-y-4">
              <section className="flex items-center gap-2">
                {statusBadge}
                <button
                  onClick={loadAll}
                  disabled={loading}
                  className="ml-auto px-2 py-0.5 rounded-md border border-surface-border bg-surface-700 hover:bg-surface-600 transition-colors text-[10px] disabled:opacity-50"
                >
                  {loading ? "Refreshing…" : "Refresh"}
                </button>
              </section>

              {error && (
                <div className="flex items-start gap-1.5 rounded-md border border-accent-red/30 bg-accent-red/5 p-2 text-[11px] text-accent-red">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {unavailable ? (
                <div className="rounded-md border border-accent-amber/30 bg-accent-amber/5 p-3 text-[11px] text-accent-amber leading-snug">
                  <div className="flex items-center gap-1.5 font-semibold mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Audit store unavailable
                  </div>
                  Pipeline runs still work — they're just not being persisted.
                  Start the <span className="font-mono">immudb</span> service to
                  enable the histogram and the persisted-runs list.
                  {health?.reason && (
                    <div className="mt-1.5 text-surface-muted font-mono text-[10px]">
                      {health.reason}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <section>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-surface-muted">
                        Outcomes over time
                      </div>
                      <div className="inline-flex rounded-md border border-surface-border overflow-hidden text-[10px]">
                        {(["hour", "day"] as const).map((b) => (
                          <button
                            key={b}
                            onClick={() => setBucket(b)}
                            className={[
                              "px-2 py-0.5 transition-colors",
                              bucket === b
                                ? "bg-accent-cyan/20 text-accent-cyan"
                                : "bg-surface-700 text-surface-muted hover:bg-surface-600",
                            ].join(" ")}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-md border border-surface-border bg-surface-700/30 p-2">
                      <OutcomeHistogram buckets={histogram} bucket={bucket} />
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-surface-muted mt-1">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-accent-emerald inline-block" />{" "}
                        pass
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-accent-red inline-block" />{" "}
                        fail
                      </span>
                    </div>
                  </section>

                  <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-surface-muted mb-1">
                        Persisted runs ({runs.length})
                      </div>
                      <div className="rounded-md border border-surface-border bg-surface-700/30 overflow-hidden">
                        <table className="w-full text-[10px] font-mono">
                          <thead>
                            <tr className="text-surface-muted uppercase tracking-wider border-b border-surface-border">
                              <th className="text-left py-1 px-2 font-semibold">Run</th>
                              <th className="text-left py-1 pr-2 font-semibold">Mode</th>
                              <th className="text-left py-1 pr-2 font-semibold">Outcome</th>
                              <th className="text-left py-1 pr-2 font-semibold">Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {runs.map((r) => (
                              <tr
                                key={r.run_id}
                                onClick={() => setActiveRunId(r.run_id)}
                                className={[
                                  "border-b border-surface-border/50 cursor-pointer hover:bg-surface-700/50 transition-colors",
                                  r.run_id === activeRunId ? "bg-accent-cyan/5" : "",
                                ].join(" ")}
                              >
                                <td className="py-1 px-2 text-surface-text">
                                  {r.run_id.slice(0, 8)}
                                </td>
                                <td className="py-1 pr-2 text-surface-muted">{r.mode}</td>
                                <td className="py-1 pr-2">
                                  <span
                                    className={
                                      r.outcome === "pass"
                                        ? "text-accent-emerald"
                                        : "text-accent-red"
                                    }
                                  >
                                    {r.outcome}
                                  </span>
                                </td>
                                <td className="py-1 pr-2 text-surface-muted">
                                  {new Date(r.timestamp).toLocaleTimeString()}
                                </td>
                              </tr>
                            ))}
                            {runs.length === 0 && (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="py-3 text-center text-surface-muted"
                                >
                                  No persisted runs yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-surface-muted mb-1 flex items-center gap-1.5">
                        <ShieldCheck className="w-3 h-3 text-accent-emerald" />
                        Persisted record
                      </div>
                      <div className="rounded-md border border-surface-border bg-surface-700/30 p-2">
                        <RunDetailView run={activeRun} />
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
