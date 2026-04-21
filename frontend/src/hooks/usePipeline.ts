import { useState, useCallback, useRef } from "react";
import type { Mode, PipelineStage, RunDetail, RunSummary } from "../types";
import { triggerRun, fetchRuns, fetchRunDetail } from "../api";

export function usePipeline() {
  const [stage, setStage] = useState<PipelineStage>("idle");
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
      setStage("collect");
      await new Promise((r) => setTimeout(r, 400));
      setStage("evaluate");
      await new Promise((r) => setTimeout(r, 300));
      setStage("generate");

      const result = await triggerRun(mode);

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
    setCurrentRun(null);
    setError(null);
  }, []);

  return { stage, currentRun, runs, error, execute, loadRun, refreshRuns, reset };
}
