# GRC Proof of Concept — Automated Control Assurance using NIST OSCAL

**Prove your security controls work. Automatically. In real time.**

This is an open-source proof of concept that automates the entire compliance control lifecycle — from evidence collection to audit-ready OSCAL artifacts — in a single container. No spreadsheets. No screenshots. No manual evidence gathering.

## The Problem

Organisations spend thousands of hours per year manually collecting evidence for compliance audits. Security teams screenshot Conditional Access policies, paste them into Word documents, and email them to auditors. By the time the evidence reaches the audit, it's already stale.

## The Solution

This PoC connects directly to your Microsoft Entra ID tenant, evaluates your Conditional Access policies, and produces machine-readable [NIST OSCAL](https://pages.nist.gov/OSCAL/) artifacts — the emerging standard for automated compliance documentation.

**One click. Real evidence. Valid OSCAL.**

## Business value

Traditional control assurance lives in screenshots, Word documents, and quarterly fire-drills. This PoC shows what a different operating model looks like:

| Today | With OSCAL automation |
|---|---|
| Auditor asks "show me MFA is enforced for guests" | Auditor pulls the latest `assessment-results.json` from your evidence drop |
| Analyst opens the Entra portal, takes screenshots, pastes into a spreadsheet | The pipeline queries Microsoft Graph and emits OSCAL the same way every time |
| Evidence is stale by the time it reaches the auditor | Re-run on demand; the audit trail proves when each check was performed |
| Control status is a point-in-time snapshot | Stacked pass/fail histogram bucketed by hour or day shows the actual trend |
| "Did anyone tamper with the evidence?" is unanswerable | immudb is append-only and cryptographically verifiable — every run is a permanent, signed row |

Concretely, for each control automated this way you save the hours of evidence collection per audit cycle, replace screenshot-quality evidence with machine-readable artefacts that downstream GRC tools can consume, and gain a tamper-evident audit trail your compliance and risk functions can both point at.

The PoC covers a single control (ISO 27001 A.8.5 — MFA for guest users) end-to-end so the pattern is concrete; the same architecture scales horizontally to every control you can express as "fetch evidence → evaluate criteria → emit OSCAL".

## What It Demonstrates

This demo evaluates a single control to prove the concept end-to-end:

| | |
|---|---|
| **Control** | Enforce MFA for guest users via Conditional Access |
| **Evidence source** | Microsoft Entra ID via Microsoft Graph API |
| **Output** | OSCAL 1.1.3 Assessment Results with full traceability |

The complete OSCAL chain is generated: **Catalog > Profile > SSP > Assessment Plan > Assessment Results** — downloadable as a zip bundle with SHA-256 hash verification.

## Dashboard

Six-panel dashboard with a 6-phase animated flow: **Control > Evidence > Evaluation > OSCAL > Summary > History**

- **Control Definition** — ISO 27001 A.8.5 scope and objective
- **Evidence Collection** — Conditional Access policies with state, dates, and policy ID
- **Evaluation** — Four-criteria checklist (policy exists, targets guests, enabled, requires MFA)
- **OSCAL Artifacts** — Generated assessment results with download button
- **Summary** — Pass/fail outcome with evidence basis
- **History** — Run history with duration bar chart, clickable entries

Three scenarios: **Mock Pass**, **Mock Fail**, and **Live** (real Entra ID tenant).

A dedicated **Audit trail** drawer (database icon in the header) surfaces the
immudb-backed compliance history: an outcomes-over-time histogram (pass vs
fail, bucketed by hour or day), a list of persisted runs, and the
allowlisted record stored for each run.

## Quick Start

```bash
docker compose up --build
```

Two containers start: the app on port 8000 and an immudb sidecar on the internal network. Open the dashboard at the URL shown in the terminal, click **Run** to execute the pipeline with mock data — no Azure credentials needed — then open the database icon in the header to see the Audit trail drawer populate as you trigger more runs.

To run without persistence (e.g. for a smoke test), leave `IMMUDB_HOST` unset: the app falls back gracefully and the drawer shows an "unavailable" notice while the rest of the dashboard keeps working.

## Live Mode

1. Register a **dedicated** app in Azure Entra ID with only `Policy.Read.All` (application permission) + admin consent
2. Open Settings in the dashboard, enter Tenant ID, Client ID, and Client Secret
3. Acknowledge the security prompt — the app switches to Live mode automatically
4. Click **Run** to query your real Conditional Access policies
5. After testing, delete the app registration or revoke its permissions

## Security

This app is designed to be safe for public deployment where untrusted users supply their own Entra credentials.

| Layer | How it works |
|---|---|
| **Storage** | Credentials are never written to any file, log, cache, or environment variable. The optional immudb audit store persists **only run results** (run id, mode, outcome, duration, timestamp, control id, finding state, summary, per-criterion result) — no tenant info, no evidence, no PII. See _Audit store_ below. |
| **Browser** | Credentials stored in `sessionStorage` (base64-encoded), cleared when the tab closes. Never sent to `localStorage`, cookies, or any endpoint other than `POST /api/runs`. |
| **Server** | Credentials exist as function parameters for one HTTP request — used for a single OAuth2 token call to Microsoft, then garbage-collected. Never returned in any API response. |
| **Evidence** | All Graph API responses are scrubbed: fields matching `*secret*`, `*password*`, `*token*` are replaced with `[REDACTED]`. Evidence is never sent to the audit store. |
| **API** | Optional `API_TOKEN` env var for Bearer auth. Rate limited to 1 concurrent run (HTTP 429). CORS same-origin by default. Path traversal protection on static file serving. |
| **Container** | Non-root user (UID 1000). No secrets in the image. `.env` excluded via `.dockerignore`. |

### Audit store (immudb)

immudb runs as a sidecar container (see `docker-compose.yml`). It is
append-only and cryptographically verifiable, which makes it a good fit
for compliance evidence — but it also means anything written is
permanent. To stay aligned with GDPR data-minimisation, the server
operates on a strict allowlist defined in
[`backend/immudb_store.py`](backend/immudb_store.py):

**Stored** per run: `run_id`, `mode`, `outcome`, `duration_ms`,
`timestamp`, `control_id`, `finding_state`, `summary`, and per
criterion `name` / `passed` / `reason`. All values are either
server-generated or structural constants from `evaluator.py`.

**Never stored**: tenant id, client id, client secret, the full OSCAL
`assessment-results` document, the sanitized evidence list, or any
property fetched from Microsoft Graph at runtime.

A defence-in-depth `_assert_no_pii` guard rejects any write whose
allowlist values match email / GUID / IP / known-PII substring
patterns. Persistence is best-effort: if immudb is unreachable the
pipeline still returns 200 and only the histogram / persisted-runs
list goes dark in the Audit trail drawer.

To disable the audit store entirely, leave `IMMUDB_HOST` unset.

## API

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/health` | Liveness check |
| `GET` | `/api/health/immudb` | Audit-store status |
| `GET` | `/api/artifacts` | List static OSCAL artifacts |
| `GET` | `/api/artifacts/{type}` | Full OSCAL document |
| `POST` | `/api/runs` | Execute the pipeline |
| `POST` | `/api/bundle` | Download OSCAL zip bundle with SHA-256 hashes |
| `GET` | `/api/runs` | Persisted run summaries from the audit store |
| `GET` | `/api/runs/{run_id}` | Persisted run detail (allowlisted fields only) |
| `GET` | `/api/metrics/outcomes-histogram` | Pass/fail counts bucketed by `hour` or `day` |

## Architecture

```
                    ┌────────────────────────┐
                    │  Microsoft Entra ID    │
                    │  (Graph API, read-only)│
                    └────────────▲───────────┘
                                 │ OAuth2 + Policy.Read.All
                                 │ (live mode only)
                    ┌────────────┴───────────┐
   ┌────────────┐   │  FastAPI backend       │   ┌───────────────────────┐
   │  React SPA │◀──┤  pipeline:             ├──▶│  immudb sidecar       │
   │  (browser) │   │  collect → sanitize    │   │  append-only audit    │
   │            │──▶│  → evaluate → OSCAL    │◀──│  store (run results)  │
   └────────────┘   │  + PII guard + writer  │   └───────────────────────┘
                    └────────────────────────┘     private network only
```

- **Backend** — Python FastAPI, single process. Owns the four-stage pipeline (collect → sanitize → evaluate → emit OSCAL), the PII-guard layer, and the immudb writer.
- **Frontend** — React 19 + Vite + Tailwind CSS v4 + Framer Motion. Six-panel dashboard for the live run + a slide-out Audit trail drawer reading from the audit store.
- **Audit store** — immudb, deployed as a sidecar. Append-only, cryptographically verifiable, used only for compliance run-result rows (strict allowlist). Reachable only on the project's private network.
- **Container** — multi-stage Dockerfile (Node build → Python runtime, non-root UID 1000). `docker-compose.yml` wires the app + immudb services with a named volume for immudb data.

### Why these choices

- **OSCAL** is the NIST standard for machine-readable security and compliance content. It defines a layered chain — Catalog → Profile → SSP → Assessment Plan → Assessment Results — that maps naturally onto what a compliance team already produces, except in JSON/XML instead of Word. Picking OSCAL over a proprietary format means anything you generate here flows into other OSCAL-aware tools without translation.
- **immudb** was chosen for the audit store because the security property "you can't quietly rewrite history" is exactly what an audit trail needs. Every row is hashed and verifiable; reverting a failed assessment after the fact would be detectable. The append-only nature is also why the writer is so paranoid about what it persists (see _Audit store_).
- **Stateless FastAPI + sidecar persistence** keeps the trust boundary small. Credentials touch one HTTP handler and are garbage-collected; the audit store is reachable only on the private network and never sees credentials by design.

### Pipeline stages

1. **Collect** (`backend/collector.py`) — load mock fixture or hit Microsoft Graph for Conditional Access policies.
2. **Sanitize** (`backend/collector.py::sanitize_evidence`) — redact any field name matching `secret|password|token`.
3. **Evaluate** (`backend/evaluator.py`) — apply the 4-criterion checklist (policy exists, targets guests, enabled, requires MFA).
4. **Emit OSCAL** (`backend/oscal_generator.py`) — assemble an OSCAL 1.1.3 assessment-results document with observations, findings, and risks.
5. **Persist** (`backend/immudb_store.py`) — best-effort write of the allowlisted run-result record to immudb.

Each stage is independently testable; the same pattern (`collect → sanitize → evaluate → OSCAL → persist`) generalises to any control that can be expressed as evidence + criteria.

## Development

```bash
# Backend
cd backend && pip install -r requirements.txt && python main.py

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

The Vite dev server proxies `/api` requests to `localhost:8000`.

## License

MIT — use at your own risk.

---

Made by [Yoshi Parlevliet](https://www.linkedin.com/in/yoshiparlevliet/)
