export type Mode = "mock-pass" | "mock-fail" | "live";

export type Outcome = "pass" | "fail";

export type PipelineStage = "idle" | "collect" | "evaluate" | "generate" | "done" | "error";

export interface Credentials {
  tenant_id: string;
  client_id: string;
  client_secret: string;
}

export interface CriterionResult {
  name: string;
  passed: boolean;
  reason: string;
}

export interface Evaluation {
  passed: boolean;
  summary: string;
  criteria: CriterionResult[];
}

export interface RunSummary {
  run_id: string;
  mode: Mode;
  timestamp: string;
  outcome: Outcome;
  duration_ms: number;
}

export interface RunDetail extends RunSummary {
  evaluation: Evaluation;
  assessment_results: Record<string, unknown>;
  sanitized_evidence: Record<string, unknown>[];
}

export interface ArtifactMeta {
  type: string;
  filename: string;
  title: string;
  oscal_document_type: string;
  uuid: string;
}
