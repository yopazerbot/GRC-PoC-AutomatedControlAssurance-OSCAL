import { Play, Loader2, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { GitHubMark } from "./GitHubMark";
import type { Mode } from "../types";

interface Props {
  running: boolean;
  mode: Mode;
  onRun: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  canPrev: boolean;
  canNext: boolean;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-1.5 py-0.5 rounded border border-surface-border bg-surface-700 text-[10px] font-mono text-surface-muted">
      {children}
    </kbd>
  );
}

export function PhaseControls({ running, mode, onRun, onPrev, onNext, onReset, canPrev, canNext }: Props) {
  return (
    <footer className="flex flex-wrap items-center gap-3 px-4 min-h-10 py-2 lg:flex-nowrap lg:h-10 lg:py-0 border-t border-surface-border bg-surface-800 shrink-0 text-xs">
      <button
        onClick={onRun}
        disabled={running}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-semibold bg-accent-cyan text-white hover:brightness-110 transition disabled:opacity-70"
      >
        {running ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Play className="w-3.5 h-3.5" />
        )}
        {running ? "Running pipeline..." : `Run (${mode})`}
      </button>

      <div className="flex items-center gap-1">
        <button
          aria-label="Prev"
          onClick={onPrev}
          disabled={!canPrev}
          className="p-1.5 rounded-md border border-surface-border bg-surface-700 hover:bg-surface-600 transition-colors disabled:opacity-50"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          aria-label="Next"
          onClick={onNext}
          disabled={!canNext}
          className="p-1.5 rounded-md border border-surface-border bg-surface-700 hover:bg-surface-600 transition-colors disabled:opacity-50"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          aria-label="Reset"
          onClick={onReset}
          className="p-1.5 rounded-md border border-surface-border bg-surface-700 hover:bg-surface-600 transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1" />

      <div className="hidden lg:flex items-center gap-3 text-[11px] text-surface-muted">
        <span className="flex items-center gap-1"><Kbd>R</Kbd> run</span>
        <span className="flex items-center gap-1">
          <Kbd>&larr;</Kbd><Kbd>&rarr;</Kbd> flow
        </span>
        <span className="flex items-center gap-1"><Kbd>0</Kbd> reset</span>
        <span className="flex items-center gap-1"><Kbd>T</Kbd> theme</span>
      </div>

      <span className="hidden lg:inline text-surface-border">|</span>

      <div className="flex items-center gap-3 text-[11px] text-surface-muted">
        <a
          href="https://www.linkedin.com/in/yoshiparlevliet/"
          target="_blank"
          rel="noreferrer noopener"
          className="hover:text-accent-cyan transition-colors whitespace-nowrap"
        >
          made by <span className="text-surface-text">Yoshi Parlevliet</span>
        </a>
        <span className="text-surface-border">&middot;</span>
        <a
          href="https://github.com/yopazerbot/GRC-PoC-AutomatedControlAssurance-OSCAL"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 hover:text-accent-cyan transition-colors whitespace-nowrap"
        >
          <GitHubMark className="w-3 h-3" />
          View on GitHub
        </a>
      </div>
    </footer>
  );
}
