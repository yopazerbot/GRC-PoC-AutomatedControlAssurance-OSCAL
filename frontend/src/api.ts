import type { Mode, Credentials, RunDetail, RunSummary, ArtifactMeta } from "./types";

const CRED_KEY = "entra_credentials_b64";

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = sessionStorage.getItem("api_token");
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

function getCredentials(): Credentials | null {
  const encoded = sessionStorage.getItem(CRED_KEY);
  if (!encoded) return null;
  try {
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}

export function saveCredentials(creds: Credentials): void {
  sessionStorage.setItem(CRED_KEY, btoa(JSON.stringify(creds)));
}

export function clearCredentials(): void {
  sessionStorage.removeItem(CRED_KEY);
}

export function hasCredentials(): boolean {
  return getCredentials() !== null;
}

export function getStoredCredentials(): Credentials | null {
  return getCredentials();
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchHealth(): Promise<{ status: string }> {
  const res = await fetch("/api/health");
  return handleResponse(res);
}

export async function fetchArtifacts(): Promise<ArtifactMeta[]> {
  const res = await fetch("/api/artifacts", { headers: getHeaders() });
  return handleResponse(res);
}

export async function fetchArtifact(type: string): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/artifacts/${type}`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function triggerRun(mode: Mode, dryRun = false): Promise<RunDetail> {
  const body: Record<string, unknown> = { mode };
  if (mode === "live") {
    const creds = getCredentials();
    if (!creds) throw new Error("No credentials stored. Open Settings to enter Entra credentials.");
    body.credentials = creds;
  }
  const url = dryRun ? "/api/runs?dry_run=true" : "/api/runs";
  const res = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function fetchRuns(): Promise<RunSummary[]> {
  const res = await fetch("/api/runs", { headers: getHeaders() });
  return handleResponse(res);
}

export async function clearRuns(): Promise<void> {
  const res = await fetch("/api/runs", { method: "DELETE", headers: getHeaders() });
  await handleResponse(res);
}

export async function fetchRunDetail(runId: string): Promise<RunDetail> {
  const res = await fetch(`/api/runs/${runId}`, { headers: getHeaders() });
  return handleResponse(res);
}
