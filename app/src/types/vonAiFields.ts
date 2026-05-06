// ─── AI Field Definition ─────────────────────────────────────
export type AiFieldStatus = "draft" | "live" | "disabled";
export type AiFieldObjectType = "opportunity" | "account";

export interface ColumnToGenerate {
  name: string;
  description: string;
  type: string;
}

export interface DisplayFilterCondition {
  field: string;
  operator: string;
  value: string;
  connector: "AND" | "OR" | null;
}

export interface AiField {
  id: string;
  fieldId: string;
  name: string;
  displayName?: string;
  description: string;
  objectType: AiFieldObjectType;
  columnsToGenerate: ColumnToGenerate[];
  sources: string[];
  opportunityFilter: string | null;
  displayFilter?: DisplayFilterCondition[];
  matchCount?: number | null;
  totalRecords?: number | null;
  status: AiFieldStatus;
  workflowId: string | null;
  conversationId: string | null;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string | null;
  lastRunAt?: string | null;
  applied?: boolean;
}

// ─── AI Field Draft (from AI_FIELD_READY event) ─────────────
export interface AiFieldDraft {
  fieldId?: string | null;
  workflowId: string;
  name: string;
  displayName?: string;
  description: string;
  objectType: AiFieldObjectType;
  columnsToGenerate: ColumnToGenerate[];
  columnsGenerated: string[];
  sources: string[];
  opportunityFilter: string | null;
  displayFilter?: DisplayFilterCondition[];
  matchCount?: number | null;
  totalRecords?: number | null;
  sampleOpportunities?: SampleOpportunity[];
  conversationId: string | null;
}

export interface SampleOpportunity {
  id: string;
  name: string;
  amount?: number | null;
  stage?: string;
  owner?: string;
}

// ─── Create AI Field Request / Response ─────────────────────
export interface CreateAiFieldRequest {
  name: string;
  description: string;
  objectType: AiFieldObjectType;
  columnsToGenerate: ColumnToGenerate[];
  sources: string[];
  opportunityFilter: string | null;
  conversationId: string | null;
  workflowId: string;
}

export interface CreateAiFieldResponse {
  field: AiField;
  executionId: string;
  pusherChannel: string;
}

// ─── Pagination ──────────────────────────────────────────────
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export type AiFieldListResponse = PaginatedResponse<AiField>;

// ─── Activate / Playground Started ───────────────────────────
export interface AiFieldActionResponse {
  executionId: string;
  pusherChannel: string;
}

// ─── Playground ──────────────────────────────────────────────
export interface PlaygroundRequest {
  opportunityIds: string[];
  columnsToGenerate: ColumnToGenerate[];
  sources: string[];
}

export interface OpportunitySearchResult {
  opportunityId: string;
  name: string;
  amount: number | null;
  stage: string;
  owner?: string;
}

// ─── Run History ─────────────────────────────────────────────
export interface RunHistoryEntry {
  executionId: string;
  status: string;
  triggerType: string;
  totalRowsProcessed: number;
  createdAt: string;
}

export type RunHistoryResponse = PaginatedResponse<RunHistoryEntry>;

// ─── Associated Conversations ────────────────────────────────
export interface AiFieldConversation {
  conversationId: string;
  title: string;
  firstReferencedAt: string;
  lastReferencedAt: string;
}

export type AiFieldConversationsResponse =
  PaginatedResponse<AiFieldConversation>;

// ─── Error ───────────────────────────────────────────────────
export interface AiFieldError {
  error: {
    code: string;
    message: string;
  };
}

// ─── Pusher Events ───────────────────────────────────────────
export interface ActivateStartedEvent {
  executionId: string;
}

export interface ActivateProgressEvent {
  executionId: string;
  nodeId: string;
  nodeName: string;
  status: string;
}

export interface ActivateCompletedEvent {
  executionId: string;
  nodesExecuted: number;
  nodesFailed: number;
}

export interface ActivateFailedEvent {
  executionId: string;
  error: string;
}

export interface PlaygroundResultEvent {
  opportunityId: string;
  opportunityName?: string;
  success: boolean;
  insights?: string | Record<string, unknown>;
  callsCount?: number;
  emailsCount?: number;
  error?: string;
}

export interface PlaygroundCompleteEvent {
  executionId: string;
  total: number;
  succeeded: number;
}

export interface PlaygroundErrorEvent {
  executionId: string;
  error: string;
}
