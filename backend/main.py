from __future__ import annotations

import hashlib
import io
import json
import os
import zipfile
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel

from security import AuthMiddleware, RateLimitMiddleware
from pipeline import execute_pipeline, run_store
from collector import collect_live_dry_run

OSCAL_DIR = Path(__file__).parent / "oscal"
STATIC_DIR = Path(__file__).parent / "static"

app = FastAPI(title="GRC-OSCAL Demo", version="1.0.0")

cors_origins = os.environ.get("CORS_ORIGINS", "")
if cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in cors_origins.split(",")],
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.add_middleware(RateLimitMiddleware)
app.add_middleware(AuthMiddleware)

ARTIFACT_MAP = {
    "catalog": ("catalog.json", "ISO 27001:2022 - Selected Controls", "catalog"),
    "profile": ("profile.json", "MFA Guest Enforcement Profile", "profile"),
    "ssp": ("ssp.json", "System Security Plan - Entra ID MFA", "system-security-plan"),
    "assessment-plan": ("assessment-plan.json", "Assessment Plan - MFA Enforcement", "assessment-plan"),
}


class Credentials(BaseModel):
    tenant_id: str
    client_id: str
    client_secret: str


class RunRequest(BaseModel):
    mode: str
    credentials: Optional[Credentials] = None


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/artifacts")
async def list_artifacts():
    items = []
    for key, (filename, title, doc_type) in ARTIFACT_MAP.items():
        filepath = OSCAL_DIR / filename
        data = json.loads(filepath.read_text())
        root_key = list(data.keys())[0]
        uuid_val = data[root_key].get("uuid", "")
        items.append({
            "type": key,
            "filename": filename,
            "title": title,
            "oscal_document_type": doc_type,
            "uuid": uuid_val,
        })
    return items


@app.get("/api/artifacts/{artifact_type}")
async def get_artifact(artifact_type: str):
    if artifact_type not in ARTIFACT_MAP:
        raise HTTPException(status_code=404, detail=f"Unknown artifact type: {artifact_type}")
    filename = ARTIFACT_MAP[artifact_type][0]
    data = json.loads((OSCAL_DIR / filename).read_text())
    return data


@app.post("/api/runs")
async def create_run(req: RunRequest, dry_run: bool = False):
    if req.mode not in ("mock-pass", "mock-fail", "live"):
        raise HTTPException(status_code=400, detail="Mode must be mock-pass, mock-fail, or live.")

    if req.mode == "live":
        if not req.credentials:
            raise HTTPException(status_code=400, detail="Live mode requires credentials.")

        if dry_run:
            try:
                await collect_live_dry_run(
                    req.credentials.tenant_id,
                    req.credentials.client_id,
                    req.credentials.client_secret,
                )
                return {"status": "ok", "message": "Authentication successful."}
            except RuntimeError as e:
                raise HTTPException(status_code=400, detail=str(e))

    try:
        run = await execute_pipeline(
            mode=req.mode,
            tenant_id=req.credentials.tenant_id if req.credentials else None,
            client_id=req.credentials.client_id if req.credentials else None,
            client_secret=req.credentials.client_secret if req.credentials else None,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    return {
        "run_id": run.run_id,
        "mode": run.mode,
        "timestamp": run.timestamp,
        "outcome": run.outcome,
        "duration_ms": run.duration_ms,
        "evaluation": run.evaluation,
        "assessment_results": run.assessment_results,
        "sanitized_evidence": run.sanitized_evidence,
    }


@app.get("/api/runs")
async def list_runs():
    return run_store.list_summaries()


@app.get("/api/runs/{run_id}")
async def get_run(run_id: str):
    run = run_store.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")
    return {
        "run_id": run.run_id,
        "mode": run.mode,
        "timestamp": run.timestamp,
        "outcome": run.outcome,
        "duration_ms": run.duration_ms,
        "evaluation": run.evaluation,
        "assessment_results": run.assessment_results,
        "sanitized_evidence": run.sanitized_evidence,
    }


@app.get("/api/runs/{run_id}/bundle")
async def download_bundle(run_id: str):
    run = run_store.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")

    files: dict[str, bytes] = {}
    for key, (filename, _, _) in ARTIFACT_MAP.items():
        files[filename] = (OSCAL_DIR / filename).read_bytes()
    ar_json = json.dumps(run.assessment_results, indent=2).encode()
    files["assessment-results.json"] = ar_json

    hashes: dict[str, str] = {}
    for name, content in files.items():
        hashes[name] = hashlib.sha256(content).hexdigest()
    manifest = "SHA-256 verification hashes\n" + "=" * 40 + "\n\n"
    for name in sorted(hashes):
        manifest += f"{hashes[name]}  {name}\n"
    manifest += f"\nGenerated: {run.timestamp}\nRun ID: {run.run_id}\n"
    files["SHA256SUMS.txt"] = manifest.encode()

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, content in sorted(files.items()):
            zf.writestr(f"oscal-bundle/{name}", content)
    buf.seek(0)

    filename = f"oscal-bundle-{run_id[:8]}.zip"
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


if STATIC_DIR.is_dir() and (STATIC_DIR / "index.html").is_file():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/")
    async def serve_index():
        return FileResponse(STATIC_DIR / "index.html")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        file_path = STATIC_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "8000"))

    dash_url = f"http://localhost:{port}"
    health_url = f"http://localhost:{port}/api/health"
    banner = (
        "\n"
        "  +--------------------------------------------------------------+\n"
        "  |                                                              |\n"
        "  |   GRC Lab -- OSCAL-native Continuous Compliance Automation   |\n"
        "  |                                                              |\n"
       f"  |   Dashboard:  {dash_url:<45s}|\n"
       f"  |   Health:     {health_url:<45s}|\n"
        "  |                                                              |\n"
        "  |   Made by Yoshi Parlevliet                                   |\n"
        "  |   MIT License -- use at your own risk                        |\n"
        "  |                                                              |\n"
        "  +--------------------------------------------------------------+\n"
    )
    print(banner)

    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
