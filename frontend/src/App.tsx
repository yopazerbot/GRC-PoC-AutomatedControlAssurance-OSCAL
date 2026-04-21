import { useState, useEffect, useCallback } from "react";
import type { Mode } from "./types";
import type { PanelState } from "./components/PanelShell";
import { PHASES } from "./components/FlowTimeline";
import { usePipeline } from "./hooks/usePipeline";
import { hasCredentials } from "./api";
import Header from "./components/Header";
import { PublicDemoBanner } from "./components/PublicDemoBanner";
import { OrgContext } from "./components/OrgContext";
import ScenarioSelector from "./components/ScenarioSelector";
import FlowTimeline from "./components/FlowTimeline";
import ControlPanel from "./components/ControlPanel";
import EvidencePanel from "./components/EvidencePanel";
import EvaluationPanel from "./components/EvaluationPanel";
import OscalResultPanel from "./components/OscalResultPanel";
import DecisionPanel from "./components/DecisionPanel";
import { HistoryPanel } from "./components/HistoryPanel";
import { PhaseControls } from "./components/PhaseControls";
import SettingsDrawer from "./components/SettingsDrawer";

const THEME_KEY = "grc-lab-theme";

function panelState(panelPhaseIndex: number, currentPhaseIndex: number, hasDoneRun: boolean): PanelState {
  if (hasDoneRun && currentPhaseIndex >= panelPhaseIndex) return currentPhaseIndex === panelPhaseIndex ? "active" : "completed";
  if (currentPhaseIndex === panelPhaseIndex) return "active";
  if (currentPhaseIndex > panelPhaseIndex) return "completed";
  return "pending";
}

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem(THEME_KEY);
    return stored ? stored === "dark" : false;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<Mode>("mock-pass");
  const [apiOk, setApiOk] = useState(true);
  const pipeline = usePipeline();

  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [isDark]);

  useEffect(() => {
    pipeline.refreshRuns();
    fetch("/api/health").then((r) => setApiOk(r.ok)).catch(() => setApiOk(false));
  }, []);

  const handleSettingsClose = useCallback(() => {
    setSettingsOpen(false);
    if (hasCredentials()) {
      setSelectedMode("live");
    }
  }, []);

  const handleRun = useCallback(() => {
    pipeline.execute(selectedMode);
  }, [pipeline.execute, selectedMode]);

  const isRunning = !["idle", "done", "error"].includes(pipeline.stage);
  const hasDoneRun = pipeline.currentRun !== null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (key === "r") handleRun();
      if (key === "arrowleft") pipeline.prevPhase();
      if (key === "arrowright") pipeline.nextPhase();
      if (key === "0") pipeline.reset();
      if (key === "t") setIsDark((d) => !d);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleRun, pipeline.prevPhase, pipeline.nextPhase, pipeline.reset]);

  const pi = pipeline.phaseIndex;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        onToggleTheme={() => setIsDark((d) => !d)}
        isDark={isDark}
      />
      <PublicDemoBanner onOpenSettings={() => setSettingsOpen(true)} />
      <OrgContext runs={pipeline.runs} apiOk={apiOk} />
      <ScenarioSelector current={selectedMode} onChange={setSelectedMode} />
      <FlowTimeline currentIndex={pi} onJump={pipeline.jumpToPhase} />

      <main className="flex-1 min-h-0 grid grid-cols-4 grid-rows-[1fr_1fr] gap-3 p-3 overflow-hidden">
        <ControlPanel state={panelState(0, pi, hasDoneRun)} />
        <EvidencePanel
          state={panelState(1, pi, hasDoneRun)}
          run={pipeline.currentRun}
          error={pipeline.error}
        />
        <EvaluationPanel
          state={panelState(2, pi, hasDoneRun)}
          run={pipeline.currentRun}
        />
        <OscalResultPanel
          state={panelState(3, pi, hasDoneRun)}
          run={pipeline.currentRun}
        />
        <DecisionPanel
          state={panelState(4, pi, hasDoneRun)}
          run={pipeline.currentRun}
        />
        <HistoryPanel
          state={panelState(5, pi, hasDoneRun)}
          runs={pipeline.runs}
          activeRunId={pipeline.currentRun?.run_id ?? null}
          onSelect={pipeline.loadRun}
        />
      </main>

      <PhaseControls
        running={isRunning}
        mode={selectedMode}
        onRun={handleRun}
        onPrev={pipeline.prevPhase}
        onNext={pipeline.nextPhase}
        onReset={pipeline.reset}
        canPrev={pi > 0}
        canNext={pi < PHASES.length - 1}
      />

      <SettingsDrawer open={settingsOpen} onClose={handleSettingsClose} />
    </div>
  );
}
