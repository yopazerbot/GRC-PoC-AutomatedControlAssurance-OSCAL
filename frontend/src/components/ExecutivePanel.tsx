import { useEffect, useState } from "react";
import { PanelShell, type PanelState } from "./PanelShell";
import type { ArtifactMeta, RunDetail } from "../types";
import { fetchArtifacts } from "../api";

interface Props {
  state: PanelState;
  run: RunDetail | null;
}

const CHAIN = [
  { label: "Catalog", type: "catalog" },
  { label: "Profile", type: "profile" },
  { label: "SSP", type: "ssp" },
  { label: "Assessment Plan", type: "assessment-plan" },
  { label: "Assessment Results", type: "assessment-results" },
];

export function ExecutivePanel({ state, run }: Props) {
  const [artifacts, setArtifacts] = useState<ArtifactMeta[]>([]);

  useEffect(() => {
    fetchArtifacts().then(setArtifacts).catch(() => {});
  }, []);

  const resultUuid = run
    ? (run.assessment_results as any)?.["assessment-results"]?.uuid
    : null;

  return (
    <PanelShell title="Executive" subtitle="OSCAL trace" state={state}>
      <div className="flex flex-col gap-3">
        <div className="text-[11px] uppercase tracking-wider font-semibold text-surface-text">
          Traceability chain
        </div>

        <div className="flex flex-col gap-0.5">
          {CHAIN.map((item, i) => {
            const artifact = artifacts.find((a) => a.type === item.type);
            const uuid = item.type === "assessment-results" ? resultUuid : artifact?.uuid;
            const hasData = item.type === "assessment-results" ? !!run : !!artifact;

            return (
              <div key={item.type}>
                <div
                  className={[
                    "flex items-center gap-2 p-2 rounded-md text-xs transition-colors",
                    hasData ? "text-surface-text" : "text-surface-muted",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "w-2 h-2 rounded-full shrink-0 transition-colors",
                      hasData ? "bg-accent-emerald" : "bg-surface-600",
                    ].join(" ")}
                  />
                  <span className="font-medium">{item.label}</span>
                  {uuid && (
                    <span className="text-[10px] font-mono text-surface-muted ml-auto">
                      {uuid.slice(0, 8)}...
                    </span>
                  )}
                </div>
                {i < CHAIN.length - 1 && (
                  <div className="ml-[11px] h-3 border-l border-surface-border" />
                )}
              </div>
            );
          })}
        </div>

        {run && (
          <div className="rounded-md border border-surface-border bg-surface-700/60 p-3 mt-auto">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-surface-muted mb-1">
              Summary
            </div>
            <p className="text-xs text-surface-text leading-relaxed">
              {run.evaluation?.summary}
            </p>
          </div>
        )}

        <div className="text-[10px] text-surface-muted">
          End-to-end OSCAL traceability chain
        </div>
      </div>
    </PanelShell>
  );
}
