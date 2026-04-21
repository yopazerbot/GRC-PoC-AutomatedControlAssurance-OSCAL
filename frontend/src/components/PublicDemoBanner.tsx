import { useState, useEffect } from "react";
import { ShieldCheck, X } from "lucide-react";

const STORAGE_KEY = "grc-lab-banner-dismissed-v1";

interface Props {
  onOpenSettings: () => void;
}

export function PublicDemoBanner({ onOpenSettings }: Props) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 border-b border-accent-emerald/30 bg-accent-emerald/5 shrink-0 text-[11px]">
      <ShieldCheck className="w-3.5 h-3.5 text-accent-emerald shrink-0" aria-hidden />
      <span className="text-surface-text min-w-0 flex-1 truncate sm:whitespace-normal">
        <span className="font-semibold">Public demo.</span>{" "}
        <span className="text-surface-muted">
          Use a <em>dedicated</em> Entra app with{" "}
          <span className="font-mono">Policy.Read.All</span> only — never production
          credentials. Any creds you enter live
          <span className="text-accent-emerald font-semibold"> only in this browser</span>{" "}
          and never persist on our server.
        </span>
      </span>
      <button
        onClick={onOpenSettings}
        className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-surface-border bg-surface-700 hover:bg-surface-600 transition-colors text-[10px] font-medium text-surface-muted hover:text-surface-text shrink-0"
      >
        Settings
      </button>
      <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 text-surface-muted hover:text-surface-text transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
