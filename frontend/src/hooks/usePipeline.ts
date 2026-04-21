import { useState, useCallback, useRef } from "react";
import type { Mode, PipelineStage, RunDetail, RunSummary } from "../types";
import { triggerRun, fetchRuns, fetchRunDetail } from "../api";
import type { Phase } from "../components/FlowTimeline";
import { PHASES } from "../components/FlowTimeline";

export function usePipeline() {
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [phaseIndex, setPhaseIndex] = useState(-1);
  const [currentRun, setCurrentRun] = useState<RunDetail | null>(null);
  const [runs, setRuns] = useState<RunSummary[]>([]);
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
      await new Promise((r) => setTimeout(r, 250));

      setPhaseIndex(6);
      setStage("done");
      setCurrentRun(result);

      const updatedRuns = await fetchRuns();
      setRuns(updatedRuns);
    } catch (e) {
      setStage("error");
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      running.current = false;
    }
  }, []);

  const loadRun = useCallback(async (runId: string) => {
    try {
      const detail = await fetchRunDetail(runId);
      setCurrentRun(detail);
      setStage("done");
      setPhaseIndex(6);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load run");
    }
  }, []);

  const refreshRuns = useCallback(async () => {
    try {
      const list = await fetchRuns();
      setRuns(list);
    } catch {}
  }, []);

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

  return {
    stage,
    phaseIndex,
    currentRun,
    runs,
    error,
    execute,
    loadRun,
    refreshRuns,
    reset,
    jumpToPhase,
    prevPhase,
    nextPhase,
    isRunning: running.current || !["idle", "done", "error"].includes(stage),
  };
}
