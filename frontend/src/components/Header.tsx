import { ShieldCheck, Settings, Sun, Moon } from "lucide-react";
import { GitHubMark } from "./GitHubMark";
import { hasCredentials } from "../api";

interface Props {
  onOpenSettings: () => void;
  onToggleTheme: () => void;
  isDark: boolean;
}

export default function Header({ onOpenSettings, onToggleTheme, isDark }: Props) {
  const ready = hasCredentials();

  return (
    <header className="flex items-center justify-between px-4 h-12 border-b border-surface-border bg-surface-800 shrink-0">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-accent-cyan" aria-hidden />
        <span className="text-base font-bold tracking-tight">GRC Lab</span>
        <span className="text-[11px] text-surface-muted hidden md:inline">
          · OSCAL-native control automation
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span
          title={ready ? "credentials configured - live mode ready" : "mocks only"}
          className={[
            "hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-wider font-mono",
            ready
              ? "border-accent-emerald/40 bg-accent-emerald/10 text-accent-emerald"
              : "border-surface-border bg-surface-700 text-surface-muted",
          ].join(" ")}
        >
          <span
            aria-hidden
            className={`w-1.5 h-1.5 rounded-full ${ready ? "bg-accent-emerald" : "bg-surface-600"}`}
          />
          {ready ? "live ready" : "mocks only"}
        </span>

        <a
          href="https://github.com/yopazerbot/GRC-PoC-AutomatedControlAssurance-OSCAL"
          target="_blank"
          rel="noreferrer noopener"
          className="p-2 rounded-md border border-surface-border bg-surface-700 hover:bg-surface-600 transition-colors text-surface-muted hover:text-surface-text"
        >
          <GitHubMark className="w-4 h-4" />
        </a>

        <button
          aria-label="Settings"
          onClick={onOpenSettings}
          className="p-2 rounded-md border border-surface-border bg-surface-700 hover:bg-surface-600 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          aria-label="Toggle theme"
          onClick={onToggleTheme}
          className="p-2 rounded-md border border-surface-border bg-surface-700 hover:bg-surface-600 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
