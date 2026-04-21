const STATUS_COLOUR: Record<string, string> = {
  pass: "text-accent-emerald border-accent-emerald/40 bg-accent-emerald/10",
  fail: "text-accent-red border-accent-red/40 bg-accent-red/10",
  error: "text-accent-amber border-accent-amber/40 bg-accent-amber/10",
  unknown: "text-surface-muted border-surface-border bg-surface-700",
};

const RISK_COLOUR: Record<string, string> = {
  low: "text-accent-emerald border-accent-emerald/40 bg-accent-emerald/10",
  medium: "text-accent-amber border-accent-amber/40 bg-accent-amber/10",
  high: "text-accent-red border-accent-red/40 bg-accent-red/10",
  critical: "text-accent-red border-accent-red/60 bg-accent-red/15",
  none: "text-accent-emerald border-accent-emerald/40 bg-accent-emerald/10",
  unknown: "text-surface-muted border-surface-border bg-surface-700",
};

interface Props {
  kind: "status" | "risk";
  value: string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ kind, value, size = "md" }: Props) {
  const map = kind === "risk" ? RISK_COLOUR : STATUS_COLOUR;
  const cls = map[value.toLowerCase()] ?? map.unknown;
  const sizeClasses =
    size === "lg"
      ? "text-sm px-3 py-1"
      : size === "sm"
        ? "text-[10px] px-1.5 py-0.5"
        : "text-xs px-2 py-0.5";

  return (
    <span
      className={[
        "inline-flex items-center justify-center gap-1 rounded-md border font-semibold uppercase tracking-wider",
        cls,
        sizeClasses,
      ].join(" ")}
    >
      {kind === "risk" && (
        <span className="font-normal tracking-normal lowercase opacity-70">risk:</span>
      )}
      {value}
    </span>
  );
}
