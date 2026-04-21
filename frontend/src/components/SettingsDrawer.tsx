import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Eye, EyeOff, HardDrive, Lock, AlertTriangle } from "lucide-react";
import { saveCredentials, clearCredentials, hasCredentials, getStoredCredentials, triggerRun } from "../api";

const ACK_KEY = "grc-lab-security-ack-v1";

interface Props {
  open: boolean;
  onClose: () => void;
}

function SecurityConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <AnimatePresence>
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
        aria-label="Security acknowledgement"
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="fixed inset-0 z-[61] grid place-items-center p-4"
      >
        <div className="max-w-lg w-full max-h-[85vh] overflow-auto rounded-xl border border-surface-border bg-surface-800 shadow-2xl">
          <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-surface-border sticky top-0 bg-surface-800 z-10">
            <div>
              <h2 className="text-sm font-bold text-surface-text">Before you continue</h2>
              <p className="text-[11px] text-surface-muted mt-0.5">
                Please review how this application handles your credentials
              </p>
            </div>
            <button onClick={onCancel} className="p-2 rounded-md border border-surface-border bg-surface-700 hover:bg-surface-600 transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </header>

          <div className="px-5 py-4 space-y-3 text-xs leading-relaxed">
            <section className="rounded-md border border-accent-emerald/30 bg-accent-emerald/5 p-3">
              <div className="flex items-center gap-1.5 font-semibold text-[11px] text-accent-emerald">
                <HardDrive className="w-3.5 h-3.5" /> Zero server-side storage
              </div>
              <p className="mt-1.5 text-surface-text">
                This application has no database. Your credentials are never written to any file, log, cache, or environment variable on the server.
              </p>
            </section>

            <section className="rounded-md border border-accent-cyan/30 bg-accent-cyan/5 p-3">
              <div className="flex items-center gap-1.5 font-semibold text-[11px] text-accent-cyan">
                <Lock className="w-3.5 h-3.5" /> Credential lifecycle
              </div>
              <ul className="mt-1.5 list-disc pl-4 space-y-1 text-surface-text">
                <li>Stored in <span className="font-mono">sessionStorage</span> only — cleared when you close this tab.</li>
                <li>Sent to the server only when you click Run in Live mode.</li>
                <li>Used for a single Microsoft Graph API call, then immediately discarded from memory.</li>
                <li>Never returned in any API response, not even masked.</li>
              </ul>
            </section>

            <section className="rounded-md border border-accent-amber/30 bg-accent-amber/5 p-3">
              <div className="flex items-center gap-1.5 font-semibold text-[11px] text-accent-amber">
                <AlertTriangle className="w-3.5 h-3.5" /> App registration considerations
              </div>
              <ul className="mt-1.5 list-disc pl-4 space-y-1 text-surface-text">
                <li>Use a dedicated app registration with only <span className="font-mono">Policy.Read.All</span>.</li>
                <li>After testing, delete the app registration or revoke its permissions and client secret.</li>
              </ul>
            </section>
          </div>

          <footer className="flex flex-col gap-2 px-5 py-3 border-t border-surface-border sticky bottom-0 bg-surface-800">
            <button
              onClick={onConfirm}
              className="w-full px-4 py-2 rounded-md font-semibold bg-accent-cyan text-white hover:brightness-110 transition text-xs"
            >
              I understand the security of this app and the risks
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
    </AnimatePresence>
  );
}

export default function SettingsDrawer({ open, onClose }: Props) {
  const [tenantId, setTenantId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [hasCreds, setHasCreds] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [testError, setTestError] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      setHasCreds(hasCredentials());
      const c = getStoredCredentials();
      if (c) {
        setTenantId(c.tenant_id);
        setClientId(c.client_id);
        setClientSecret(c.client_secret);
      }
    }
  }, [open]);

  const doSave = () => {
    if (!tenantId || !clientId || !clientSecret) return;
    saveCredentials({ tenant_id: tenantId, client_id: clientId, client_secret: clientSecret });
    setHasCreds(true);
    onClose();
  };

  const handleSave = () => {
    if (!tenantId || !clientId || !clientSecret) return;
    if (hasCreds || sessionStorage.getItem(ACK_KEY) === "1") {
      doSave();
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    sessionStorage.setItem(ACK_KEY, "1");
    setShowConfirm(false);
    doSave();
  };

  const handleClear = () => {
    clearCredentials();
    setTenantId("");
    setClientId("");
    setClientSecret("");
    setHasCreds(false);
    setTestStatus("idle");
  };

  const handleTest = async () => {
    if (!hasCreds && tenantId && clientId && clientSecret) {
      handleSave();
      if (!sessionStorage.getItem(ACK_KEY)) return;
    }
    setTestStatus("testing");
    setTestError("");
    try {
      await triggerRun("live", true);
      setTestStatus("ok");
    } catch (e) {
      setTestStatus("error");
      setTestError(e instanceof Error ? e.message : "Connection test failed");
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={onClose}
            />
            <motion.aside
              role="dialog"
              aria-label="Runtime settings"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 250, damping: 32 }}
              className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-surface-800 border-l border-surface-border z-50 flex flex-col [box-shadow:var(--shadow-panel)]"
            >
              <header className="flex items-center justify-between px-4 h-12 border-b border-surface-border shrink-0">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-surface-text">Runtime settings</div>
                  <div className="text-[10px] text-surface-muted">server labels · browser-only Entra creds</div>
                </div>
                <button onClick={onClose} aria-label="Close" className="p-2 rounded-md border border-surface-border bg-surface-700 hover:bg-surface-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </header>

              <div className="flex-1 overflow-auto p-4 space-y-5">
                <section className="rounded-md border border-accent-cyan/20 bg-accent-cyan/5 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-accent-cyan">
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden />
                    Entra ID Credentials
                  </div>
                  <p className="text-[10px] text-surface-muted mt-1 mb-3">
                    Stored in sessionStorage only. Sent to server exclusively for Graph API calls. Never logged or persisted.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-surface-muted mb-1">Tenant ID</label>
                      <input
                        type="text"
                        value={tenantId}
                        onChange={(e) => setTenantId(e.target.value)}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        className="w-full px-2 py-1.5 rounded-md border border-surface-border bg-surface-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent-cyan/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-surface-muted mb-1">Client ID</label>
                      <input
                        type="text"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        className="w-full px-2 py-1.5 rounded-md border border-surface-border bg-surface-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent-cyan/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-surface-muted mb-1">Client Secret</label>
                      <div className="relative">
                        <input
                          type={showSecret ? "text" : "password"}
                          value={clientSecret}
                          onChange={(e) => setClientSecret(e.target.value)}
                          placeholder="Enter client secret"
                          className="w-full px-2 py-1.5 pr-8 rounded-md border border-surface-border bg-surface-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent-cyan/40"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret((s) => !s)}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-surface-muted hover:text-surface-text transition-colors"
                          aria-label={showSecret ? "Hide secret" : "Show secret"}
                        >
                          {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                <button
                  onClick={handleTest}
                  disabled={testStatus === "testing" || (!hasCreds && (!tenantId || !clientId || !clientSecret))}
                  className="w-full px-3 py-1.5 rounded-md border border-surface-border bg-surface-700 hover:bg-surface-600 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testStatus === "testing" ? "Testing..." : "Test connectivity"}
                </button>

                {testStatus === "ok" && (
                  <div className="rounded-md border border-accent-emerald/30 bg-accent-emerald/5 p-2 text-xs text-accent-emerald">
                    Authentication successful.
                  </div>
                )}
                {testStatus === "error" && (
                  <div className="rounded-md border border-accent-red/30 bg-accent-red/5 p-2 text-xs text-accent-red">
                    {testError}
                  </div>
                )}
              </div>

              <footer className="flex items-center gap-2 px-4 h-12 border-t border-surface-border shrink-0">
                <button
                  onClick={handleSave}
                  disabled={!tenantId || !clientId || !clientSecret}
                  className="flex-1 px-3 py-1.5 rounded-md font-semibold bg-accent-cyan text-white hover:brightness-110 transition text-xs disabled:opacity-70"
                >
                  Save to session
                </button>
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 rounded-md border border-surface-border bg-surface-700 hover:bg-surface-600 hover:text-accent-red text-surface-muted transition-colors text-xs"
                >
                  Clear
                </button>
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {showConfirm && (
        <SecurityConfirm
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
