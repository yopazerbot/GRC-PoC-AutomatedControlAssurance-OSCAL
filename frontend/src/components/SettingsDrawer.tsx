import { useState, useEffect } from "react";
import { saveCredentials, clearCredentials, hasCredentials, triggerRun } from "../api";
import type { Credentials } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDrawer({ open, onClose }: Props) {
  const [tenantId, setTenantId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [hasCreds, setHasCreds] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [testError, setTestError] = useState("");

  useEffect(() => {
    if (open) {
      setHasCreds(hasCredentials());
      const raw = sessionStorage.getItem("entra_credentials");
      if (raw) {
        try {
          const c = JSON.parse(raw) as Credentials;
          setTenantId(c.tenant_id);
          setClientId(c.client_id);
          setClientSecret("");
        } catch {}
      }
    }
  }, [open]);

  const handleSave = () => {
    if (!tenantId || !clientId || !clientSecret) return;
    saveCredentials({ tenant_id: tenantId, client_id: clientId, client_secret: clientSecret });
    setHasCreds(true);
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
    if (!tenantId || !clientId || !clientSecret) {
      handleSave();
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

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-96 bg-[var(--color-panel)] border-l border-[var(--color-panel-border)] z-50 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-panel-border)]">
          <h2 className="font-semibold">Settings</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 p-4 space-y-4 overflow-auto">
          <div>
            <h3 className="text-sm font-semibold mb-3">Entra ID Credentials</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Tenant ID</label>
                <input
                  type="text"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Client ID</label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Client Secret</label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Enter client secret"
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!tenantId || !clientId || !clientSecret}
              className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-sm font-medium rounded transition-colors"
            >
              Save to session
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-sm rounded transition-colors"
            >
              Clear
            </button>
          </div>

          <button
            onClick={handleTest}
            disabled={testStatus === "testing" || (!hasCreds && (!tenantId || !clientId || !clientSecret))}
            className="w-full px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-sm rounded transition-colors"
          >
            {testStatus === "testing" ? "Testing..." : "Test connectivity"}
          </button>

          {testStatus === "ok" && (
            <p className="text-sm text-emerald-400">Authentication successful.</p>
          )}
          {testStatus === "error" && (
            <p className="text-sm text-red-400">{testError}</p>
          )}

          <div className="p-3 bg-amber-900/20 border border-amber-700/30 rounded text-xs text-amber-300/80 leading-relaxed">
            Credentials are stored in your browser session only. They are sent to the server exclusively for Graph API calls and are never logged or persisted.
          </div>
        </div>
      </div>
    </>
  );
}
