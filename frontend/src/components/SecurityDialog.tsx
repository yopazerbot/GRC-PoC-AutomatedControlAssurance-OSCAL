import { motion, AnimatePresence } from "framer-motion";
import { X, HardDrive, Lock, ShieldCheck, AlertTriangle, Globe } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

function Section({ icon: Icon, title, tone, children }: {
  icon: typeof ShieldCheck;
  title: string;
  tone: "emerald" | "cyan" | "amber";
  children: React.ReactNode;
}) {
  const toneClasses = {
    emerald: "border-accent-emerald/30 bg-accent-emerald/5",
    cyan: "border-accent-cyan/30 bg-accent-cyan/5",
    amber: "border-accent-amber/30 bg-accent-amber/5",
  };
  const textClasses = {
    emerald: "text-accent-emerald",
    cyan: "text-accent-cyan",
    amber: "text-accent-amber",
  };

  return (
    <section className={`rounded-md border p-3 ${toneClasses[tone]}`}>
      <div className={`flex items-center gap-1.5 font-semibold text-[11px] ${textClasses[tone]}`}>
        <Icon className="w-3.5 h-3.5" aria-hidden /> {title}
      </div>
      <div className="mt-2 text-surface-text">{children}</div>
    </section>
  );
}

export function SecurityDialog({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Security of this demo"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 z-[61] grid place-items-center p-4"
          >
            <div className="max-w-2xl w-full max-h-[90vh] overflow-auto rounded-xl border border-surface-border bg-surface-800 shadow-2xl">
              <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-surface-border sticky top-0 bg-surface-800 z-10">
                <div>
                  <h2 className="text-sm font-bold text-surface-text">Security of this demo</h2>
                  <p className="text-[11px] text-surface-muted mt-0.5">
                    How this application handles your Entra ID credentials
                  </p>
                </div>
                <button onClick={onClose} className="p-2 rounded-md border border-surface-border bg-surface-700 hover:bg-surface-600 transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </header>

              <div className="px-5 py-4 space-y-4 text-xs leading-relaxed">
                <Section icon={HardDrive} title="Zero server-side credential storage" tone="emerald">
                  <p>
                    This application has <strong>no database</strong> — no SQLite, no Redis, no filesystem writes
                    for credential data. Your <span className="font-mono">tenant_id</span>,{" "}
                    <span className="font-mono">client_id</span>, and <span className="font-mono">client_secret</span>{" "}
                    are never stored on the server in any form. Run history (assessment results, sanitized evidence)
                    is held in process memory only, capped at 50 entries, and cleared on container restart.
                  </p>
                </Section>

                <Section icon={Lock} title="Credential lifecycle" tone="cyan">
                  <ul className="list-disc pl-4 space-y-1 mt-1">
                    <li>
                      <strong>Browser:</strong> Credentials are stored in{" "}
                      <span className="font-mono">sessionStorage</span> — automatically cleared when you close the
                      browser tab. They are never written to <span className="font-mono">localStorage</span>, cookies,
                      or IndexedDB.
                    </li>
                    <li>
                      <strong>In transit:</strong> Credentials are sent to the server only in the POST request body
                      when you click <strong>Run</strong> (live mode) or <strong>Test connectivity</strong>.
                      They are never sent in URL parameters, headers, or to any other endpoint.
                    </li>
                    <li>
                      <strong>On the server:</strong> The server passes your{" "}
                      <span className="font-mono">client_id</span> and{" "}
                      <span className="font-mono">client_secret</span> to Microsoft's OAuth2 token endpoint
                      to obtain an access token, then uses that token to call the Microsoft Graph API.
                      Your credentials exist as Python function parameters for the duration of that single
                      HTTP request and are garbage-collected when the request completes. They are never
                      assigned to any global variable, cache, or persistent data structure.
                    </li>
                    <li>
                      <strong>In responses:</strong> Credentials are never included in any API response —
                      not the run result, not the run history, not error messages, not even in masked form.
                      All evidence returned from Microsoft Graph is scrubbed: any JSON field whose key
                      contains <span className="font-mono">secret</span>,{" "}
                      <span className="font-mono">password</span>, or{" "}
                      <span className="font-mono">token</span> (case-insensitive) is replaced
                      with <span className="font-mono">[REDACTED]</span>.
                    </li>
                    <li>
                      <strong>In logs:</strong> The server uses standard uvicorn request logging (method, path,
                      status code). Request bodies are not logged. No custom logging of credentials exists anywhere
                      in the codebase.
                    </li>
                  </ul>
                </Section>

                <Section icon={ShieldCheck} title="API & container hardening" tone="emerald">
                  <ul className="list-disc pl-4 space-y-1 mt-1">
                    <li>
                      <strong>Authentication:</strong> An optional <span className="font-mono">API_TOKEN</span>{" "}
                      environment variable enables Bearer token authentication on all{" "}
                      <span className="font-mono">/api/*</span> routes
                      (except <span className="font-mono">/api/health</span>). When set, requests without a
                      valid <span className="font-mono">Authorization: Bearer &lt;token&gt;</span> header
                      receive HTTP 401.
                    </li>
                    <li>
                      <strong>Rate limiting:</strong> Only one pipeline run can execute at a time. Concurrent
                      requests to <span className="font-mono">POST /api/runs</span> receive HTTP 429.
                    </li>
                    <li>
                      <strong>CORS:</strong> No CORS headers are sent by default (browsers enforce same-origin).
                      Cross-origin access is only enabled if the <span className="font-mono">CORS_ORIGINS</span>{" "}
                      environment variable is explicitly set.
                    </li>
                    <li>
                      <strong>Container:</strong> The Docker image runs as a non-root user (UID 1000).
                      No secrets are baked into the image;{" "}
                      <span className="font-mono">.env</span> is excluded via{" "}
                      <span className="font-mono">.dockerignore</span>.
                    </li>
                  </ul>
                </Section>

                <Section icon={Globe} title="Cloud deployment (Railway)" tone="cyan">
                  <ul className="list-disc pl-4 space-y-1 mt-1">
                    <li>
                      Railway terminates TLS at its edge proxy — all traffic between your browser and the
                      application is encrypted via HTTPS. Credentials in the POST body are encrypted in transit.
                    </li>
                    <li>
                      Railway containers have an ephemeral filesystem. There is no persistent disk.
                      On every redeploy or restart, all in-memory run history is cleared.
                    </li>
                    <li>
                      Set <span className="font-mono">API_TOKEN</span> as a Railway environment variable
                      to prevent unauthorized API access when the app is publicly reachable.
                    </li>
                  </ul>
                </Section>

                <Section icon={AlertTriangle} title="App registration considerations" tone="amber">
                  <ul className="list-disc pl-4 space-y-1 mt-1">
                    <li>
                      Create a <strong>dedicated</strong> Entra ID app registration with only the{" "}
                      <span className="font-mono">Policy.Read.All</span> application permission
                      (requires admin consent). This grants read-only access to Conditional Access
                      policy definitions and nothing else.
                    </li>
                    <li>
                      Do not reuse an app registration that has broader permissions.
                    </li>
                    <li>
                      After testing, we recommend <strong>deleting the app registration</strong> or
                      at minimum revoking its permissions and rotating or deleting its client secret.
                      This demo does not require persistent access to your tenant.
                    </li>
                  </ul>
                </Section>
              </div>

              <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-surface-border sticky bottom-0 bg-surface-800">
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-md font-semibold bg-accent-cyan text-white hover:brightness-110 transition text-xs"
                >
                  Got it
                </button>
              </footer>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
