import { Globe, Server, Database } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { RunDetail } from "../types";
import { getStoredCredentials } from "../api";

interface PillProps {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "ok" | "bad" | "default";
}

function Pill({ icon: Icon, label, value, tone = "default" }: PillProps) {
  const toneClass =
    tone === "ok"
      ? "text-accent-emerald"
      : tone === "bad"
        ? "text-accent-red"
        : "";

  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-surface-700/50">
      <Icon className="w-3.5 h-3.5 shrink-0 text-surface-muted" aria-hidden />
      <span className="text-[10px] uppercase tracking-wider text-surface-muted">{label}</span>
      <span className={`text-xs font-mono ${toneClass}`}>{value}</span>
    </div>
  );
}

interface Props {
  runs: RunDetail[];
  apiOk: boolean;
}

export function OrgContext({ runs, apiOk }: Props) {
  const tenantId = getStoredCredentials()?.tenant_id ?? null;

  return (
    <div className="flex items-center gap-2 px-4 h-10 border-b border-surface-border bg-surface-800/60 shrink-0 overflow-x-auto">
      <Pill
        icon={Globe}
        label="tenant"
        value={tenantId ?? "not configured"}
      />
      <Pill icon={Server} label="api" value={apiOk ? "connected" : "offline"} tone={apiOk ? "ok" : "bad"} />
      <Pill icon={Database} label="history" value={`${runs.length} runs`} />
    </div>
  );
}
