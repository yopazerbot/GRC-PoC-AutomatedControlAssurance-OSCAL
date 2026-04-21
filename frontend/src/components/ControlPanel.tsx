import { useEffect, useState } from "react";
import { PanelShell, type PanelState } from "./PanelShell";
import { CodeSnippet } from "./CodeSnippet";
import type { ArtifactMeta } from "../types";
import { fetchArtifacts } from "../api";

interface Props {
  state: PanelState;
}

const SNIPPET = {
  title: "catalog.json structure",
  language: "json" as const,
  lines: [
    '{ "catalog": {',
    '    "uuid": "a1b2c3d4-...",',
    '    "metadata": { "oscal-version": "1.1.3" },',
    '    "groups": [{ "id": "annex-a-8",',
    '      "controls": [{ "id": "a-8-5" }]',
    "    }]",
    "}}",
  ],
  outputs: ["catalog.json"],
};

export default function ControlPanel({ state }: Props) {
  const [artifacts, setArtifacts] = useState<ArtifactMeta[]>([]);

  useEffect(() => {
    fetchArtifacts().then(setArtifacts).catch(() => {});
  }, []);

  const CHAIN = [
    { label: "Catalog", type: "catalog", desc: "Control definition" },
    { label: "Profile", type: "profile", desc: "Control selection" },
    { label: "SSP", type: "ssp", desc: "Implementation statement" },
    { label: "Assessment Plan", type: "assessment-plan", desc: "Evaluation method" },
  ];

  return (
    <PanelShell title="Control Definition" subtitle="ISO 27001 A.8.5" state={state}>
      <div className="flex flex-col gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider font-semibold text-surface-text">
            A.8.5 Secure Authentication
          </div>
          <p className="text-xs text-surface-muted leading-relaxed mt-1.5">
            Secure authentication technologies and procedures shall be established and
            implemented based on information access restrictions.
          </p>
        </div>

        <div className="rounded-md border border-accent-cyan/20 bg-accent-cyan/5 p-3">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-accent-cyan mb-1">
            Scope
          </div>
          <p className="text-xs text-surface-text leading-relaxed">
            Guest users accessing tenant resources MUST be protected by MFA via
            Conditional Access.
          </p>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-surface-muted mb-1.5">
            OSCAL document chain
          </div>
          <div className="flex flex-col gap-1">
            {CHAIN.map((item, i) => {
              const artifact = artifacts.find((a) => a.type === item.type);
              return (
                <div key={item.type}>
                  <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-surface-700/40 text-[10px]">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${artifact ? "bg-accent-emerald" : "bg-surface-600"}`} />
                    <span className="font-semibold text-surface-text">{item.label}</span>
                    <span className="text-surface-muted">{item.desc}</span>
                    {artifact && (
                      <span className="ml-auto font-mono text-surface-muted">{artifact.uuid.slice(0, 8)}</span>
                    )}
                  </div>
                  {i < CHAIN.length - 1 && <div className="ml-[7px] h-1 border-l border-surface-border" />}
                </div>
              );
            })}
          </div>
        </div>

        <CodeSnippet snippet={SNIPPET} />
      </div>
    </PanelShell>
  );
}
