# GRC-OSCAL: Continuous Compliance, Demonstrated

A single-container web application that automates the full compliance control lifecycle for MFA enforcement on guest users in Microsoft Entra ID, producing valid OSCAL artifacts as audit evidence.

## What it does

This demo evaluates **ISO 27001:2022 Annex A 8.5 (Secure Authentication)** by:

1. Collecting Conditional Access policies from Microsoft Entra ID (or using mock fixtures)
2. Evaluating whether guest users are protected by MFA
3. Generating a valid OSCAL Assessment Results document with findings, observations, and risk entries
4. Displaying the full pipeline in a real-time dashboard

The complete OSCAL chain is generated: **Catalog → Profile → SSP → Assessment Plan → Assessment Results**.

## Quick Start (Docker)

```bash
docker compose up --build
```

Open [http://localhost:8000](http://localhost:8000) and click **Mock Pass** or **Mock Fail** to run the pipeline.

## Railway Deployment

1. Push this repo to GitHub
2. Create a new project on [Railway](https://railway.app)
3. Connect the GitHub repo — Railway will detect the `railway.json` and `Dockerfile` automatically
4. Set environment variables (optional):
   - `API_TOKEN` — require Bearer token auth for all `/api/*` routes
   - `CORS_ORIGINS` — comma-separated allowed origins
   - `PORT` — defaults to `8000`, Railway sets this automatically

## Live Mode (Entra ID)

To test against a real Microsoft Entra ID tenant:

1. Register an app in Azure Entra ID
2. Grant the **Policy.Read.All** application permission
3. Grant admin consent
4. Open the dashboard → Settings (gear icon)
5. Enter Tenant ID, Client ID, and Client Secret
6. Click **Test connectivity** to verify
7. Select **Live** mode and click **Run**

### Security

- Credentials are stored in `sessionStorage` only (cleared when the tab closes)
- The server uses credentials for a single Graph API call, then discards them
- Credentials are never logged, persisted, or returned in any API response
- Set `API_TOKEN` in production to require Bearer authentication

## API

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/health` | Liveness check |
| GET | `/api/artifacts` | List static OSCAL artifacts |
| GET | `/api/artifacts/{type}` | Get full OSCAL document (catalog, profile, ssp, assessment-plan) |
| POST | `/api/runs` | Trigger pipeline run |
| GET | `/api/runs` | List recent runs (max 50) |
| GET | `/api/runs/{run_id}` | Get full run detail with OSCAL results |

## Architecture

- **Backend**: Python FastAPI (stateless, no database)
- **Frontend**: React 19 + Vite + Tailwind CSS v4
- **Container**: Single multi-stage Dockerfile, non-root user

## Development

```bash
# Backend
cd backend
pip install -r requirements.txt
python main.py

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to `localhost:8000`.
