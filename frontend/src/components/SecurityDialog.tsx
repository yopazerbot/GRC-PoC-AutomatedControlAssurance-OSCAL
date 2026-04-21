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
            aria-label="Security architecture"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 z-[61] grid place-items-center p-4"
          >
            <div className="max-w-2xl w-full max-h-[90vh] overflow-auto rounded-xl border border-surface-border bg-surface-800 shadow-2xl">
              <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-surface-border sticky top-0 bg-surface-800 z-10">
                <div>
                  <h2 className="text-sm font-bold text-surface-text">Security Architecture</h2>
                  <p className="text-[11px] text-surface-muted mt-0.5">
                    How this application protects your Entra ID credentials
                  </p>
                </div>
                <button onClick={onClose} className="p-2 rounded-md border border-surface-border bg-surface-700 hover:bg-surface-600 transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </header>

              <div className="px-5 py-4 space-y-4 text-xs leading-relaxed">
                <Section icon={HardDrive} title="Zero server-side storage" tone="emerald">
                  <p>
                    This application has <strong>no database</strong>. There is no filesystem write, no SQLite file,
                    no Redis cache, and no environment variable that stores your credentials. The server is fully stateless
                    for credential data.
                  </p>
                </Section>

                <Section icon={Lock} title="Credential lifecycle" tone="cyan">
                  <ul className="list-disc pl-4 space-y-1 mt-1">
                    <li>
                      Your <span className="font-mono">tenant_id</span>, <span className="font-mono">client_id</span>,
                      and <span className="font-mono">client_secret</span> are stored in your browser's{" "}
                      <span className="font-mono">sessionStorage</span> only — they are automatically cleared when you close the tab.
                    </li>
                    <li>
                      Credentials are sent to the server only in the POST request body when you click <strong>Run</strong> in Live mode.
                    </li>
                    <li>
                      The server uses them for a single OAuth2 client-credentials token request to Microsoft,
                      then discards them immediately. They exist in memory only for the duration of that HTTP request.
                    </li>
                    <li>
                      Credentials are never written to logs, stdout, stderr, or any API response — not even masked.
                    </li>
                  </ul>
                </Section>

                <Section icon={ShieldCheck} title="Container security" tone="emerald">
                  <ul className="list-disc pl-4 space-y-1 mt-1">
                    <li>The Docker container runs as a non-root user (UID 1000).</li>
                    <li>No secrets are baked into the image. <span className="font-mono">.env</span> is excluded via <span className="font-mono">.dockerignore</span>.</li>
                    <li>An optional <span className="font-mono">API_TOKEN</span> environment variable enables Bearer token authentication on all API routes.</li>
                    <li>Rate limiting: only one pipeline run can execute at a time (HTTP 429 if concurrent).</li>
                    <li>Any evidence returned is scrubbed for patterns matching secrets, passwords, or tokens before inclusion in responses.</li>
                  </ul>
                </Section>

                <Section icon={Globe} title="Transport & cloud deployment" tone="cyan">
                  <ul className="list-disc pl-4 space-y-1 mt-1">
                    <li>
                      When deployed on Railway (or any cloud host), all traffic is encrypted via TLS/HTTPS.
                      Credentials in the POST body are encrypted in transit between your browser and the server.
                    </li>
                    <li>
                      Railway containers are ephemeral — there is no persistent filesystem. On redeploy or restart, all in-memory run history is cleared.
                    </li>
                    <li>
                      Set the <span className="font-mono">API_TOKEN</span> environment variable on Railway to require Bearer authentication,
                      preventing unauthorized access to the API.
                    </li>
                    <li>
                      CORS is locked to same-origin by default. Set <span className="font-mono">CORS_ORIGINS</span> only if you need cross-origin access.
                    </li>
                  </ul>
                </Section>

                <Section icon={AlertTriangle} title="App registration considerations" tone="amber">
                  <ul className="list-disc pl-4 space-y-1 mt-1">
                    <li>
                      Create a <strong>dedicated</strong> Entra ID app registration with only the{" "}
                      <span className="font-mono">Policy.Read.All</span> application permission. This grants read-only
                      access to Conditional Access policies and nothing else.
                    </li>
                    <li>
                      Do not reuse an app registration that has broader permissions.
                    </li>
                    <li>
                      After testing, we recommend <strong>deleting the app registration</strong> or at minimum revoking
                      its permissions and client secret. This demo does not require persistent access to your tenant.
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
