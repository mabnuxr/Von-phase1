/**
 * Self-describing artifact envelope types.
 *
 * The backend tool that produces data also describes how to render it.
 * The frontend dispatches on `kind` and reads `metadata` for labels/icons.
 * No frontend registry, no per-tool if/else, no drift.
 */

// -- Metadata (rendering hints from the backend) --

export interface ArtifactMetadata {
  /** Human-readable name for the pill/tab (e.g., "BigQuery Query") */
  display_name: string;
  /** Label for the collapsible query section (e.g., "BigQuery SQL", "SOQL Query") */
  query_label?: string;
  /** SQL dialect for syntax highlighting (e.g., "sql", "soql") */
  dialect?: string;
  /** Integration ID (e.g., "bigquery", "salesforce", "databricks") */
  integration_id: string;
  /** Icon identifier for the integration */
  icon_id?: string;
}

// -- Column / Row (shared across payloads) --

export interface ArtifactColumn {
  name: string;
  display_name?: string;
  type?: string;
}

export type ArtifactRow = Record<string, unknown>;

// -- Payloads per kind --

export interface QueryResultPayload {
  query?: string;
  query_name?: string;
  columns: ArtifactColumn[];
  rows: ArtifactRow[];
  row_count?: number;
  execution_time_ms?: number;
}

export interface RecordListPayload {
  columns: ArtifactColumn[];
  rows: ArtifactRow[];
  row_count?: number;
}

// -- Base envelope --

interface BaseArtifact<K extends string, P> {
  kind: K;
  schema_version: number;
  metadata: ArtifactMetadata;
  payload: P;
}

// -- Concrete kinds --

export type QueryResultArtifact = BaseArtifact<
  "query_result",
  QueryResultPayload
>;
export type RecordListArtifact = BaseArtifact<"record_list", RecordListPayload>;

// -- Discriminated union of all self-describing artifacts --

export type SelfDescribingArtifact = QueryResultArtifact | RecordListArtifact;

// -- Type utilities --

/** Extract a specific kind from the union */
export type ArtifactOfKind<K extends SelfDescribingArtifact["kind"]> = Extract<
  SelfDescribingArtifact,
  { kind: K }
>;

// -- Type guard --

/** Check if artifact content uses the self-describing envelope format */
export function isSelfDescribingArtifact(
  content: unknown,
): content is SelfDescribingArtifact {
  if (typeof content !== "object" || content === null) return false;
  const c = content as Record<string, unknown>;
  return (
    typeof c.kind === "string" &&
    typeof c.schema_version === "number" &&
    c.metadata != null &&
    typeof c.metadata === "object" &&
    c.payload != null &&
    typeof c.payload === "object"
  );
}
