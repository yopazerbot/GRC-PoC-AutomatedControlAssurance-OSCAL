import { motion, AnimatePresence } from "framer-motion";
import { X, KeyRound, Settings } from "lucide-react";

interface Props {
  open: boolean;
  onOpenSettings: () => void;
  onCancel: () => void;
}

export default function LiveCredentialsPrompt({ open, onOpenSettings, onCancel }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={onCancel}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Entra credentials required"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 z-[61] grid place-items-center p-4"
          >
            <div className="max-w-md w-full rounded-xl border border-surface-border bg-surface-800 shadow-2xl">
              <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-surface-border">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1.5 rounded-md border border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-surface-text">Entra credentials required</h2>
                    <p className="text-[11px] text-surface-muted mt-0.5">
                      Live mode queries your Entra ID tenant via Microsoft Graph
                    </p>
                  </div>
                </div>
                <button
                  onClick={onCancel}
                  aria-label="Close"
                  className="p-2 rounded-md border border-surface-border bg-surface-700 hover:bg-surface-600 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </header>

              <div className="px-5 py-4 text-xs leading-relaxed text-surface-text">
                <p>
                  You haven't configured any Entra ID credentials yet. Open Settings to add your tenant ID,
                  client ID, and client secret. They're stored in <span className="font-mono">sessionStorage</span> only
                  and cleared when you close this tab.
                </p>
              </div>

              <footer className="flex flex-col gap-2 px-5 py-3 border-t border-surface-border">
                <button
                  onClick={onOpenSettings}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md font-semibold bg-accent-cyan text-white hover:brightness-110 transition text-xs"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Open Settings
                </button>
                <button
                  onClick={onCancel}
                  className="w-full px-4 py-1.5 rounded-md border border-surface-border bg-surface-700 hover:bg-surface-600 transition-colors text-xs text-surface-muted"
                >
                  Cancel
                </button>
              </footer>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
