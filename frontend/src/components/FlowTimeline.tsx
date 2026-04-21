import { Fragment } from "react";
import { motion } from "framer-motion";

export const PHASES = ["control", "evidence", "evaluation", "oscal", "decision", "runtime", "executive"] as const;
export type Phase = (typeof PHASES)[number];

const PHASE_LABELS: Record<Phase, string> = {
  control: "Control",
  evidence: "Evidence",
  evaluation: "Evaluation",
  oscal: "OSCAL",
  decision: "Pass/Fail",
  runtime: "History",
  executive: "Assurance",
};

interface Props {
  currentIndex: number;
  onJump: (phase: Phase) => void;
}

export default function FlowTimeline({ currentIndex, onJump }: Props) {
  return (
    <div className="flex items-center gap-1 px-4 h-16 border-b border-surface-border bg-surface-800/60 shrink-0 overflow-x-auto">
      <span className="text-[10px] uppercase tracking-wider text-surface-muted shrink-0 pr-2">flow</span>
      <div className="flex items-center flex-1 min-w-0">
        {PHASES.map((p, i) => (
          <Fragment key={p}>
            <button onClick={() => onJump(p)} className="group flex flex-col items-center gap-1 shrink-0">
              <motion.div
                animate={{ scale: i === currentIndex ? 1.08 : 1 }}
                transition={{ type: "spring", stiffness: 250, damping: 20 }}
                className={[
                  "w-7 h-7 rounded-full border flex items-center justify-center text-[11px] font-semibold font-mono transition-colors",
                  i === currentIndex
                    ? "bg-accent-cyan text-surface-800 border-accent-cyan"
                    : i < currentIndex
                      ? "bg-accent-emerald/20 text-accent-emerald border-accent-emerald/40"
                      : "bg-surface-700 text-surface-muted border-surface-border",
                ].join(" ")}
              >
                {i + 1}
              </motion.div>
              <span
                className={[
                  "text-[9px] uppercase tracking-wider font-medium transition-colors",
                  i === currentIndex
                    ? "text-accent-cyan"
                    : i < currentIndex
                      ? "text-accent-emerald"
                      : "text-surface-muted",
                ].join(" ")}
              >
                {PHASE_LABELS[p]}
              </span>
            </button>

            {i < PHASES.length - 1 && (
              <div className="flex-1 h-px mx-1 bg-surface-border relative overflow-hidden min-w-[12px]">
                {i < currentIndex && (
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 bg-accent-emerald"
                  />
                )}
                {i === currentIndex && currentIndex >= 0 && (
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "50%" }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 bg-accent-cyan"
                  />
                )}
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
