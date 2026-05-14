# GRC Proof of Concept — Automated Control Assurance using NIST OSCAL

**Prove your security controls work. Automatically. In real time.**

This is an open-source proof of concept that automates the entire compliance control lifecycle — from evidence collection to audit-ready OSCAL artifacts — in a single container. No spreadsheets. No screenshots. No manual evidence gathering.

## The Problem

Organisations spend thousands of hours per year manually collecting evidence for compliance audits. Security teams screenshot Conditional Access policies, paste them into Word documents, and email them to auditors. By the time the evidence reaches the audit, it's already stale.

## The Solution

This PoC connects directly to your Microsoft Entra ID tenant, evaluates your Conditional Access policies, and produces machine-readable [NIST OSCAL](https://pages.nist.gov/OSCAL/) artifacts — the emerging standard for automated compliance documentation.

**One click. Real evidence. Valid OSCAL.**

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

Open the dashboard at the URL shown in the terminal. Click **Run** to execute the pipeline with mock data — no Azure credentials needed.

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

- **Backend**: Python FastAPI — single process, optional immudb sidecar for the audit store
- **Frontend**: React 19 + Vite + Tailwind CSS v4 + Framer Motion
- **Container**: Multi-stage Dockerfile (Node build + Python runtime), plus an `immudb` service in `docker-compose.yml`

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
