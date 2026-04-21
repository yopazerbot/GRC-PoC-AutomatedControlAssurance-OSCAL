# GRC Proof of Concept - Automated Control Assurance using NIST OSCAL

**Prove your security controls work. Automatically. In real time.**

This is an open-source proof of concept that automates the entire compliance control lifecycle for the control "enforce MFA for Guests in Entra" — from evidence collection to audit-ready OSCAL artifacts — in a single container. No spreadsheets. No screenshots. No manual evidence gathering.

## The Problem

Organisations spend thousands of hours per year manually collecting evidence for compliance audits. Security teams screenshot Conditional Access policies, paste them into Word documents, and email them to auditors. By the time the evidence reaches the audit, it's already stale.

## The Solution

GRC Lab connects directly to your Microsoft Entra ID tenant, evaluates your security controls against ISO 27001 requirements, and produces machine-readable [NIST OSCAL](https://pages.nist.gov/OSCAL/) artifacts — the emerging standard for automated compliance documentation.

**One click. Real evidence. Valid OSCAL.**

## What It Demonstrates

This demo evaluates a single control to prove the concept end-to-end:

| | |
|---|---|
| **Standard** | ISO/IEC 27001:2022 |
| **Control** | Annex A 8.5 — Secure Authentication |
| **Scope** | Guest users must be protected by MFA via Conditional Access |
| **Evidence source** | Microsoft Entra ID via Microsoft Graph API |
| **Output** | OSCAL 1.1.3 Assessment Results with full traceability |

The complete OSCAL chain is generated: **Catalog > Profile > SSP > Assessment Plan > Assessment Results**.

## Quick Start

```bash
docker compose up --build
```

Open the dashboard at the URL shown in the terminal. Click **Run** to execute the pipeline with mock data — no Azure credentials needed.

## Live Mode (Real Entra ID)

To evaluate a real tenant:

1. Register an app in Azure Entra ID
2. Grant **Policy.Read.All** application permission + admin consent
3. Open Settings in the dashboard, enter your credentials
4. The app automatically switches to Live mode
5. Click **Run** to query your real Conditional Access policies

## Security Architecture

This application is designed to be safe for public deployment where untrusted users supply their own Entra credentials. Security is the top priority.

### Zero server-side credential storage

- The backend has **no database** — no SQLite, no Redis, no filesystem writes for credential data
- The server is fully stateless for credentials: they exist in memory only during the single HTTP request that calls the Graph API, then are discarded
- Credentials are never written to logs, stdout, stderr, environment variables, or any API response — not even in masked form
- Assessment run history is held in-memory (capped at 50 entries) and cleared on container restart

### Browser-side credential lifecycle

- Credentials are stored in `sessionStorage` only — automatically cleared when the browser tab closes
- They are never written to `localStorage`, cookies, or IndexedDB
- The frontend sends credentials exclusively in the POST body of `/api/runs` requests — never in headers, query params, or to any other endpoint

### Evidence sanitization

- All evidence returned from Microsoft Graph is scrubbed before inclusion in any API response or OSCAL document
- Fields matching patterns like `*secret*`, `*password*`, `*token*` (case-insensitive) are replaced with `[REDACTED]`
- This applies regardless of mode (live or mock)

### API hardening

- **Authentication**: Optional `API_TOKEN` env var enables Bearer token auth on all `/api/*` routes (except `/api/health`)
- **CORS**: Configurable via `CORS_ORIGINS` env var, defaults to same-origin only
- **Rate limiting**: Maximum 1 concurrent pipeline run per process (HTTP 429 if a run is already in progress)
- **No credential echo**: Credentials are never included in any API response

### Container security

- Docker image runs as non-root user (UID 1000)
- No secrets baked into the image; `.env` is excluded via `.dockerignore`
- Health check endpoint at `GET /api/health`

## Railway Deployment

1. Push this repo to GitHub
2. Create a new project on [Railway](https://railway.app)
3. Connect the GitHub repo — Railway detects the `Dockerfile` automatically
4. Optionally set `API_TOKEN` and `CORS_ORIGINS` environment variables

## API

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/health` | Liveness check |
| GET | `/api/artifacts` | List static OSCAL artifacts (catalog, profile, SSP, assessment plan) |
| GET | `/api/artifacts/{type}` | Get full OSCAL document |
| POST | `/api/runs` | Execute the compliance pipeline |
| GET | `/api/runs` | List recent run summaries (max 50) |
| GET | `/api/runs/{run_id}` | Full run detail with OSCAL Assessment Results |

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
