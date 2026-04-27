// ─── Column Definition ────────────────────────────────────────
export type IqColumnType =
  | "numeric"
  | "string"
  | "array"
  | "boolean"
  | "integer"
  | "object";
export type IqColumnScope = "opportunity" | "account";
export type IqColumnStatus = "draft" | "active" | "archived";

export interface IqColumn {
  column_id: string;
  name: string;
  prompt: string;
  column_type: IqColumnType;
  scope: IqColumnScope;
  status: IqColumnStatus;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateIqColumnRequest {
  name: string;
  prompt: string;
  column_type: IqColumnType;
  scope: IqColumnScope;
}

export interface UpdateIqColumnRequest {
  name?: string;
  prompt?: string;
  column_type?: IqColumnType;
  scope?: IqColumnScope;
  status?: IqColumnStatus;
}

// ─── List Response ────────────────────────────────────────────
export interface IqColumnsListResponse {
  columns: IqColumn[];
  total: number;
}

// ─── Execution ────────────────────────────────────────────────
export type ExecutionStatus = "running" | "completed" | "failed";

export interface DryRunColumnSpec {
  name: string;
  prompt: string;
  column_type: IqColumnType;
  scope: IqColumnScope;
}

export interface DryRunRequest {
  sample_size?: number;
  opportunity_ids?: string[];
  column?: DryRunColumnSpec;
}

// ─── Opportunity Search ───────────────────────────────────────
export interface OpportunityRecord {
  id: string;
  name: string;
  stagename: string;
  amount: number;
  closedate: string;
}

export interface OpportunitySearchResponse {
  opportunities: OpportunityRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DryRunResponse {
  status: string;
  sample_size: number;
  results: unknown[];
  columns_generated: string[];
  execution_id: string;
}

export interface ExecuteResponse {
  status: string;
  execution_id: string;
  message: string;
}

export interface Execution {
  execution_id: string;
  status: ExecutionStatus;
  node_results: Record<string, unknown>;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

// ─── Results ──────────────────────────────────────────────────
export interface IqColumnResultRecord {
  record_id: string;
  record_name: string;
  [key: string]: unknown;
}

export interface IqColumnResults {
  execution_id: string;
  tenant_id: string;
  record_count: number;
  columns: string[];
  record_ids: string[];
  results: IqColumnResultRecord[];
}

// ─── Schedule ─────────────────────────────────────────────────
export type ScheduleFrequency =
  | "minutely"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly";

export interface IqScheduleConfigRequest {
  frequency: ScheduleFrequency;
  interval?: number | null;
  time?: string | null;
  days?: string[] | null;
  dayOfMonth?: number | null;
  enabled?: boolean;
}

export interface IqScheduleResponse {
  schedule_config: IqScheduleConfigRequest | null;
  schedule_trigger_id: string | null;
  is_scheduled: boolean;
  status: "active" | "paused" | "none";
}
