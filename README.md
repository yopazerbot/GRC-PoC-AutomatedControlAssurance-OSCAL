# GRC Proof of Concept — Automated Control Assurance using NIST OSCAL

**Prove your security controls work. Automatically. In real time.**

This is an open-source proof of concept that automates the entire compliance control lifecycle — from evidence collection to audit-ready OSCAL artifacts — in a single container. No spreadsheets. No screenshots. No manual evidence gathering.

## The Problem

Organisations spend thousands of hours per year manually collecting evidence for compliance audits. Security teams screenshot Conditional Access policies, paste them into Word documents, and email them to auditors. By the time the evidence reaches the audit, it's already stale.

## The Solution

GRC Lab connects directly to your Microsoft Entra ID tenant, evaluates your Conditional Access policies, and produces machine-readable [NIST OSCAL](https://pages.nist.gov/OSCAL/) artifacts — the emerging standard for automated compliance documentation.

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
| **Storage** | No database. Credentials are never written to any file, log, cache, or environment variable. Run history is in-memory only (max 50, cleared on restart). |
| **Browser** | Credentials stored in `sessionStorage` (base64-encoded), cleared when the tab closes. Never sent to `localStorage`, cookies, or any endpoint other than `POST /api/runs`. |
| **Server** | Credentials exist as function parameters for one HTTP request — used for a single OAuth2 token call to Microsoft, then garbage-collected. Never returned in any API response. |
| **Evidence** | All Graph API responses are scrubbed: fields matching `*secret*`, `*password*`, `*token*` are replaced with `[REDACTED]`. |
| **API** | Optional `API_TOKEN` env var for Bearer auth. Rate limited to 1 concurrent run (HTTP 429). CORS same-origin by default. Path traversal protection on static file serving. |
| **Container** | Non-root user (UID 1000). No secrets in the image. `.env` excluded via `.dockerignore`. |
| **Transport** | Railway (or any cloud host) terminates TLS at the edge — credentials encrypted in transit. |

## Railway Deployment

1. Push this repo to GitHub
2. Create a new project on [Railway](https://railway.app) — it detects the Dockerfile automatically
3. Set `API_TOKEN` environment variable to require authentication

## API

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/health` | Liveness check |
| `GET` | `/api/artifacts` | List static OSCAL artifacts |
| `GET` | `/api/artifacts/{type}` | Full OSCAL document |
| `POST` | `/api/runs` | Execute the pipeline |
| `GET` | `/api/runs` | Recent run summaries (max 50) |
| `GET` | `/api/runs/{run_id}` | Full run detail with OSCAL results |
| `GET` | `/api/runs/{run_id}/bundle` | Download OSCAL zip bundle with SHA-256 hashes |
| `DELETE` | `/api/runs` | Clear run history |

## Architecture

- **Backend**: Python FastAPI — stateless, no database, single process
- **Frontend**: React 19 + Vite + Tailwind CSS v4 + Framer Motion
- **Container**: Single multi-stage Dockerfile (Node build + Python runtime)

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
