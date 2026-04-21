import { useState, useEffect, useCallback } from "react";
import type { Mode } from "./types";
import { usePipeline } from "./hooks/usePipeline";
import Header from "./components/Header";
import FlowTimeline from "./components/FlowTimeline";
import ControlPanel from "./components/ControlPanel";
import EvidencePanel from "./components/EvidencePanel";
import EvaluationPanel from "./components/EvaluationPanel";
import OscalResultPanel from "./components/OscalResultPanel";
import DecisionPanel from "./components/DecisionPanel";
import TimelinePanel from "./components/TimelinePanel";
import TracePanel from "./components/TracePanel";
import SettingsDrawer from "./components/SettingsDrawer";

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pipeline = usePipeline();

  useEffect(() => {
    document.documentElement.className = isDark ? "dark" : "light";
  }, [isDark]);

  useEffect(() => {
    pipeline.refreshRuns();
  }, []);

  const handleRun = useCallback((mode: Mode) => {
    pipeline.execute(mode);
  }, [pipeline.execute]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "r" || e.key === "R") handleRun("mock-pass");
      if (e.key === "1") handleRun("mock-pass");
      if (e.key === "2") handleRun("mock-fail");
      if (e.key === "3") handleRun("live");
      if (e.key === "t" || e.key === "T") setIsDark((d) => !d);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleRun]);

  return (
    <div className={`h-screen flex flex-col ${isDark ? "bg-gray-950 text-gray-100" : "bg-gray-100 text-gray-900"}`}>
      <Header
        stage={pipeline.stage}
        onRun={handleRun}
        onToggleTheme={() => setIsDark((d) => !d)}
        onOpenSettings={() => setSettingsOpen(true)}
        isDark={isDark}
      />

      <div className="flex-1 flex flex-col gap-3 p-3 overflow-hidden">
        <FlowTimeline stage={pipeline.stage} />

        <div className="flex-1 grid grid-cols-4 gap-3 min-h-0">
          <ControlPanel />
          <EvidencePanel stage={pipeline.stage} run={pipeline.currentRun} error={pipeline.error} />
          <EvaluationPanel stage={pipeline.stage} run={pipeline.currentRun} />
          <OscalResultPanel stage={pipeline.stage} run={pipeline.currentRun} />
        </div>

        <div className="grid grid-cols-4 gap-3" style={{ height: "200px" }}>
          <DecisionPanel stage={pipeline.stage} run={pipeline.currentRun} />
          <TimelinePanel
            runs={pipeline.runs}
            onSelect={pipeline.loadRun}
            activeRunId={pipeline.currentRun?.run_id ?? null}
          />
          <TracePanel run={pipeline.currentRun} />
        </div>
      </div>

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
