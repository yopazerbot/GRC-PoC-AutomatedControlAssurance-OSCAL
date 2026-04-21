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
        "relative flex flex-col rounded-[12px] bg-surface-800 min-h-[280px] lg:min-h-0",
        "border transition-all duration-500",
        isActive
          ? "border-accent-cyan/50 ring-2 ring-accent-cyan/30 [box-shadow:0_0_20px_rgba(8,145,178,0.15)]"
          : isCompleted
            ? "border-accent-cyan/20"
            : "border-surface-border",
        "[box-shadow:var(--shadow-panel)]",
        !isActive && !isCompleted ? "opacity-[0.42]" : "",
        isCompleted ? "opacity-85" : "",
        className,
      ].join(" ")}
    >
      <header
        className={[
          "flex items-center justify-between px-4 py-2.5 border-b shrink-0 rounded-t-[12px] transition-all duration-500",
          isActive
            ? "bg-accent-cyan/15 border-accent-cyan/30"
            : isCompleted
              ? "bg-accent-cyan/5 border-accent-cyan/10"
              : "bg-surface-700/30 border-surface-border",
        ].join(" ")}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            aria-hidden
            className={[
              "inline-block w-2 h-2 rounded-full shrink-0",
              isActive
                ? "bg-accent-cyan animate-pulse"
                : isCompleted
                  ? "bg-accent-emerald"
                  : "bg-surface-600",
            ].join(" ")}
          />
          <h2 className={[
            "text-xs font-bold uppercase tracking-wider truncate transition-colors duration-500",
            isActive ? "text-accent-cyan" : "text-surface-text",
          ].join(" ")}>
            {title}
          </h2>
          {subtitle && (
            <span className="text-[10px] text-surface-muted truncate">
              · {subtitle}
            </span>
          )}
        </div>
      </header>
      <div className="p-4 lg:flex-1 lg:min-h-0 lg:overflow-auto">{children}</div>
    </motion.section>
  );
}
