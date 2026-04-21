import { PanelShell, type PanelState } from "./PanelShell";
import { CodeSnippet } from "./CodeSnippet";

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

        <div className="text-[10px] text-surface-muted">
          ISO/IEC 27001:2022 · Annex A — Technological Controls
        </div>

        <CodeSnippet snippet={SNIPPET} />
      </div>
    </PanelShell>
  );
}
