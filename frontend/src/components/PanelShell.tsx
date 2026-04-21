import { motion } from "framer-motion";
import type { ReactNode } from "react";

export type PanelState = "active" | "completed" | "pending";

interface Props {
  title: string;
  subtitle?: string;
  state: PanelState;
  children: ReactNode;
  className?: string;
}

export function PanelShell({ title, subtitle, state, children, className = "" }: Props) {
  const isActive = state === "active";
  const isCompleted = state === "completed";

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={[
        "relative flex flex-col rounded-[12px] bg-surface-800",
        "border border-surface-border",
        "[box-shadow:var(--shadow-panel)] transition-all duration-500",
        isActive ? "ring-2 ring-accent-cyan/60 border-accent-cyan/40" : "",
        !isActive && !isCompleted ? "opacity-[0.42]" : "",
        isCompleted ? "opacity-80" : "",
        className,
      ].join(" ")}
    >
      <header
        className={[
          "flex items-center justify-between px-4 py-2 border-b border-surface-border shrink-0 rounded-t-[12px]",
          isActive ? "bg-accent-cyan/10" : "",
        ].join(" ")}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            aria-hidden
            className={[
              "inline-block w-1.5 h-1.5 rounded-full shrink-0",
              isActive
                ? "bg-accent-cyan animate-pulse"
                : isCompleted
                  ? "bg-accent-emerald"
                  : "bg-surface-600",
            ].join(" ")}
          />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-surface-text truncate">
            {title}
          </h2>
          {subtitle && (
            <span className="text-[10px] text-surface-muted truncate">
              · {subtitle}
            </span>
          )}
        </div>
      </header>
      <div className="flex-1 min-h-0 overflow-auto p-4">{children}</div>
    </motion.section>
  );
}
