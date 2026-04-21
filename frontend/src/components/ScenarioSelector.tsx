import { motion } from "framer-motion";
import type { Mode } from "../types";

const SCENARIOS: { id: Mode; title: string; subtitle: string }[] = [
  { id: "mock-pass", title: "Mock Pass", subtitle: "Simulated compliant Conditional Access config" },
  { id: "mock-fail", title: "Mock Fail", subtitle: "Simulated non-compliant config (policy disabled)" },
  { id: "live", title: "Live", subtitle: "Query real Entra ID tenant via Microsoft Graph API" },
];

interface Props {
  current: Mode;
  onChange: (mode: Mode) => void;
}

export default function ScenarioSelector({ current, onChange }: Props) {
  const active = SCENARIOS.find((s) => s.id === current);

  return (
    <div className="flex items-center gap-2 px-4 h-12 border-b border-surface-border bg-surface-800 shrink-0 overflow-x-auto">
      <span className="text-[10px] uppercase tracking-wider text-surface-muted shrink-0">scenario</span>
      <div className="flex items-center gap-1.5">
        {SCENARIOS.map((s) => {
          const isActive = s.id === current;
          return (
            <button
              key={s.id}
              onClick={() => onChange(s.id)}
              className={[
                "relative px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                isActive ? "text-accent-cyan" : "text-surface-muted hover:text-surface-text",
              ].join(" ")}
            >
              {isActive && (
                <motion.div
                  layoutId="scenario-pill"
                  className="absolute inset-0 rounded-md border border-accent-cyan/40 bg-accent-cyan/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative whitespace-nowrap">{s.title}</span>
            </button>
          );
        })}
      </div>
      <div className="flex-1" />
      <span className="text-[11px] text-surface-muted font-mono hidden md:inline">
        {active?.subtitle}
      </span>
    </div>
  );
}
