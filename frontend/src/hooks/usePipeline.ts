import { useState, useCallback, useRef } from "react";
import type { Mode, PipelineStage, RunDetail } from "../types";
import { triggerRun, loadRunsFromSession, saveRunsToSession, clearRunsFromSession } from "../api";
import type { Phase } from "../components/FlowTimeline";
import { PHASES } from "../components/FlowTimeline";

export function usePipeline() {
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [phaseIndex, setPhaseIndex] = useState(-1);
  const [currentRun, setCurrentRun] = useState<RunDetail | null>(null);
  const [runs, setRuns] = useState<RunDetail[]>(() => loadRunsFromSession());
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);

  const execute = useCallback(async (mode: Mode) => {
    if (running.current) return;
    running.current = true;
    setError(null);
    setCurrentRun(null);

    try {
      setPhaseIndex(0);
      setStage("collect");
      await new Promise((r) => setTimeout(r, 350));

      setPhaseIndex(1);
      await new Promise((r) => setTimeout(r, 350));

      setStage("evaluate");
      setPhaseIndex(2);
      await new Promise((r) => setTimeout(r, 350));

      setStage("generate");
      setPhaseIndex(3);

      const result = await triggerRun(mode);

      setPhaseIndex(4);
      await new Promise((r) => setTimeout(r, 250));

      setPhaseIndex(5);
      setStage("done");
      setCurrentRun(result);

      setRuns((prev) => {
        const updated = [result, ...prev].slice(0, 50);
        saveRunsToSession(updated);
        return updated;
      });
    } catch (e) {
      setStage("error");
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      running.current = false;
    }
  }, []);

  const loadRun = useCallback((runId: string) => {
    const found = runs.find((r) => r.run_id === runId);
    if (found) {
      setCurrentRun(found);
      setStage("done");
      setPhaseIndex(5);
      setError(null);
    }
  }, [runs]);

  const reset = useCallback(() => {
    setStage("idle");
    setPhaseIndex(-1);
    setCurrentRun(null);
    setError(null);
  }, []);

  const jumpToPhase = useCallback((phase: Phase) => {
    const idx = PHASES.indexOf(phase);
    if (idx >= 0) setPhaseIndex(idx);
  }, []);

  const prevPhase = useCallback(() => {
    setPhaseIndex((i) => Math.max(0, i - 1));
  }, []);

  const nextPhase = useCallback(() => {
    setPhaseIndex((i) => Math.min(PHASES.length - 1, i + 1));
  }, []);

  const clearHistory = useCallback(() => {
    clearRunsFromSession();
    setRuns([]);
    setCurrentRun(null);
    setStage("idle");
    setPhaseIndex(-1);
    setError(null);
  }, []);

  return {
    stage,
    phaseIndex,
    currentRun,
    runs,
    error,
    execute,
    loadRun,
    reset,
    jumpToPhase,
    prevPhase,
    nextPhase,
    clearHistory,
    isRunning: running.current || !["idle", "done", "error"].includes(stage),
  };
}
