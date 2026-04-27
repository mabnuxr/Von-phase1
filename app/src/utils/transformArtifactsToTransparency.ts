/**
 * Transforms artifact API responses into TransparencyDrawer format
 *
 * The TransparencyDrawer expects data in a specific format with
 * QueryResult objects containing columns, rows, and metadata.
 * This utility transforms the raw artifact responses from the API
 * into that format.
 */

import type { ArtifactResponse } from "../services/conversationsService";
import type {
  TransparencyQueryResult,
  QueryColumn,
  CallTranscript,
} from "@vonlabs/design-components";
import {
  isSelfDescribingArtifact,
  type SelfDescribingArtifact,
} from "../types/artifacts";

/**
 * RAG artifact content structure
 * Based on the execute_conversation_search tool response
 */
interface RagArtifactContent {
  success: boolean;
  dataset_id?: string;
  row_count?: number;
  enrichment_stats?: {
    rag_conversations: number;
    calls_enriched: number;
    emails_enriched: number;
    enriched_conversations: number;
  };
  sample?: {
    columns: Array<{
      name: string;
      display_name: string;
    }>;
    rows: Array<Record<string, unknown>>;
    size: number;
    is_complete: boolean;
  };
}

/**
 * SQL query artifact content structure
 * Based on the execute_sql_query tool response
 */
interface SqlArtifactContent {
  success?: boolean;
  query?: string;
  /** Human-readable name for the query (e.g., "Top 5 Opportunities") */
  query_name?: string;
  row_count?: number;
  execution_time_ms?: number;
  error?: string;
  // Legacy format - columns/rows at top level
  columns?: Array<{
    name: string;
    display_name?: string;
    type?: string;
  }>;
  rows?: Array<Record<string, unknown>>;
  // New format - columns/rows nested under sample
  sample?: {
    columns: Array<{
      name: string;
      display_name?: string;
      type?: string;
    }>;
    rows: Array<Record<string, unknown>>;
    size?: number;
    is_complete?: boolean;
  };
  // New format - queries array with statement
  queries?: Array<{
    label?: string;
    dialect?: string;
    statement: string;
  }>;
}

/**
 * Generic artifact content structure
 * Covers execute_python_code and other tools that use the sample/queries format
 */
interface GenericArtifactContent {
  success?: boolean;
  query?: string;
  query_name?: string;
  row_count?: number;
  columns?: Array<{ name: string; display_name?: string }>;
  rows?: Array<Record<string, unknown>>;
  sample?: {
    columns: Array<{ name: string; display_name?: string }>;
    rows: Array<Record<string, unknown>>;
    size?: number;
    is_complete?: boolean;
  };
  queries?: Array<{
    label?: string;
    dialect?: string;
    statement: string;
  }>;
}

/**
 * Transform raw rows to display-friendly string/number values
 */
function transformRowsForDisplay(
  rawRows: Array<Record<string, unknown>>,
): Record<string, string | number>[] {
  return rawRows.map((row) => {
    const transformedRow: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(row)) {
      if (value === null || value === undefined) {
        transformedRow[key] = "";
      } else if (typeof value === "object") {
        transformedRow[key] = JSON.stringify(value);
      } else {
        transformedRow[key] = value as string | number;
      }
    }
    return transformedRow;
  });
}

/**
 * Memory tool names to exclude from sources
 */
export const MEMORY_TOOL_NAMES = new Set([
  "get_org_memory",
  "save_org_memory",
  "update_org_memory",
  "execute_org_memory",
]);

/**
 * Process columns to handle deep_link: remove the deep_link column and
 * mark an ID-like column with linkKey so the renderer can make it clickable.
 *
 * Matches columns named "id" or ending with "_id" (e.g. conversation_id, call_id).
 * If no suitable target column is found, keeps the deep_link column visible as a fallback.
 */
export function applyDeepLinkTransform(columns: QueryColumn[]): QueryColumn[] {
  const deepLinkColumn = columns.find((col) => col.key === "deep_link");
  if (!deepLinkColumn) return columns;

  const linkTarget = columns.find((col) => {
    const key = col.key.toLowerCase();
    return key === "id" || key.endsWith("_id");
  });

  if (!linkTarget) {
    return columns; // no safe target, keep deep_link visible
  }

  return columns
    .filter((col) => col.key !== "deep_link")
    .map((col) =>
      col === linkTarget ? { ...col, linkKey: "deep_link" } : col,
    );
}

/**
 * Human-readable tool name mapping
 */
const TOOL_NAME_MAP: Record<string, string> = {
  execute_sql_query: "Query",
  execute_salesforce_query: "Query",
  salesforce_tooling_query: "Metadata Query",
  execute_conversation_search: "Conversation Search",
  search_calls: "Call Search",
  search_emails: "Email Search",
  get_account_info: "Account Info",
  get_opportunity_info: "Opportunity Info",
  get_contact_info: "Contact Info",
};

/**
 * Get human-readable name for a tool
 */
function getToolDisplayName(toolName: string): string {
  return TOOL_NAME_MAP[toolName] || toolName.replace(/_/g, " ");
}

// ============================================================================
// Self-describing envelope handler
// ============================================================================

/**
 * Extracted tabular data from a self-describing envelope.
 * Shared by both the transparency drawer and the single-artifact drawer.
 */
export interface EnvelopeTableData {
  columns: QueryColumn[];
  rows: Record<string, string | number>[];
  query?: string;
  queryLabel?: string;
  displayName: string;
  rowCount: number;
  executionTimeMs?: number;
}

/**
 * Extract tabular data from a self-describing envelope.
 * Single source of truth for both rendering paths.
 *
 * @returns Extracted data, or null if the envelope is malformed.
 */
export function extractEnvelopeTableData(
  content: Record<string, unknown>,
): EnvelopeTableData | null {
  if (!isSelfDescribingArtifact(content)) return null;

  const envelope = content as SelfDescribingArtifact;
  const { metadata } = envelope;

  switch (envelope.kind) {
    case "query_result": {
      const p = envelope.payload;
      if (!Array.isArray(p.columns) || !Array.isArray(p.rows)) return null;

      const columns = applyDeepLinkTransform(
        p.columns.map((col) => ({
          key: col.name,
          label: col.display_name || col.name,
          type: (col.type as QueryColumn["type"]) || "string",
        })),
      );
      const rows = transformRowsForDisplay(p.rows);

      return {
        columns,
        rows,
        query: p.query,
        queryLabel: metadata.query_label,
        displayName: p.query_name || metadata.display_name,
        rowCount: p.row_count ?? rows.length,
        executionTimeMs: p.execution_time_ms,
      };
    }

    case "record_list": {
      const p = envelope.payload;
      if (!Array.isArray(p.columns) || !Array.isArray(p.rows)) return null;

      const columns = applyDeepLinkTransform(
        p.columns.map((col) => ({
          key: col.name,
          label: col.display_name || col.name,
          type: (col.type as QueryColumn["type"]) || "string",
        })),
      );
      const rows = transformRowsForDisplay(p.rows);

      return {
        columns,
        rows,
        displayName: metadata.display_name,
        rowCount: p.row_count ?? rows.length,
      };
    }
  }

  // Exhaustive check: if a new kind is added to the union but not handled above,
  // TypeScript will error here because `envelope` won't be assignable to `never`.
  envelope satisfies never;
  return null;
}

/**
 * Transform a self-describing artifact envelope into a QueryResult
 * for the TransparencyDrawer. Uses extractEnvelopeTableData as the
 * single source of truth for envelope parsing.
 */
function transformSelfDescribingArtifact(
  artifact: ArtifactResponse,
  envelope: SelfDescribingArtifact,
): TransparencyQueryResult | null {
  const data = extractEnvelopeTableData(
    envelope as unknown as Record<string, unknown>,
  );
  if (!data) return null;

  return {
    id: artifact.artifact_id,
    name: data.displayName,
    description: `${data.rowCount} rows returned`,
    query: data.query,
    queryLabel: data.queryLabel,
    columns: data.columns,
    rows: data.rows,
    executedAt: new Date(artifact.persisted_at),
    duration: data.executionTimeMs,
  };
}

// ============================================================================
// Main transformer (envelope-first, then legacy fallback)
// ============================================================================

/**
 * Transform a single artifact into a QueryResult for the TransparencyDrawer
 */
function transformArtifactToQueryResult(
  artifact: ArtifactResponse,
): TransparencyQueryResult | null {
  const { artifact_id, tool_name, content, persisted_at } = artifact;

  // --- Self-describing envelope (new format) ---
  // If the backend sends kind/metadata/payload, use it directly.
  // No tool-name lookup, no if/else chain.
  if (isSelfDescribingArtifact(content as Record<string, unknown>)) {
    const result = transformSelfDescribingArtifact(
      artifact,
      content as unknown as SelfDescribingArtifact,
    );
    if (result) return result;
  }

  // --- Legacy per-tool-name handling (existing Salesforce, SQL, etc.) ---
  // Kept intact until backend migrates all tools to self-describing format.

  // Handle RAG/conversation search artifacts
  if (tool_name === "execute_conversation_search") {
    const ragContent = content as unknown as RagArtifactContent;

    if (!ragContent.sample?.columns || !ragContent.sample?.rows) {
      return null;
    }

    const columns: QueryColumn[] = applyDeepLinkTransform(
      ragContent.sample.columns.map((col) => ({
        key: col.name,
        label: col.display_name,
        type: "string" as const,
      })),
    );

    const rows = transformRowsForDisplay(ragContent.sample.rows);

    return {
      id: artifact_id,
      name: getToolDisplayName(tool_name),
      description: `Found ${ragContent.row_count ?? rows.length} conversation chunks`,
      columns,
      rows,
      executedAt: new Date(persisted_at),
    };
  }

  // Handle SQL and SOQL query artifacts
  if (
    tool_name === "execute_sql_query" ||
    tool_name === "execute_salesforce_query"
  ) {
    const sqlContent = content as unknown as SqlArtifactContent;

    // Support both formats: nested under sample or at top level
    const rawColumns = sqlContent.sample?.columns || sqlContent.columns;
    const rawRows = sqlContent.sample?.rows || sqlContent.rows;

    if (!rawColumns || !rawRows) {
      return null;
    }

    const columns: QueryColumn[] = applyDeepLinkTransform(
      rawColumns.map((col) => ({
        key: col.name,
        label: col.display_name || col.name,
        type: (col.type as QueryColumn["type"]) || "string",
      })),
    );

    const rows = transformRowsForDisplay(rawRows);

    // Get query from either format: queries[0].statement or query
    const firstQuery = sqlContent.queries?.[0];
    const queryStatement = firstQuery?.statement || sqlContent.query;

    // Use query_name if available, otherwise fall back to tool display name
    const displayName = sqlContent.query_name || getToolDisplayName(tool_name);

    return {
      id: artifact_id,
      name: displayName,
      description: `${sqlContent.row_count ?? rows.length} rows returned`,
      query: queryStatement,
      queryLabel: firstQuery?.label,
      columns,
      rows,
      executedAt: new Date(persisted_at),
      duration: sqlContent.execution_time_ms,
    };
  }

  if (
    artifact.category?.toLowerCase() === "memory" ||
    MEMORY_TOOL_NAMES.has(tool_name)
  ) {
    return null;
  }

  // Handle generic JSON/table artifacts
  if (artifact.artifact_type === "table" || artifact.artifact_type === "json") {
    const genericContent = content as unknown as GenericArtifactContent;

    // Support both formats: nested under sample or at top level
    const rawCols = genericContent.sample?.columns || genericContent.columns;
    const rawRows = genericContent.sample?.rows || genericContent.rows;

    if (rawCols && rawRows) {
      const columns: QueryColumn[] = applyDeepLinkTransform(
        rawCols.map((col) => ({
          key: col.name,
          label: col.display_name || col.name,
          type: "string" as const,
        })),
      );

      const rows = transformRowsForDisplay(rawRows);

      const displayName =
        genericContent.query_name || getToolDisplayName(tool_name);

      const firstQuery = genericContent.queries?.[0];
      const queryStatement = firstQuery?.statement || genericContent.query;

      return {
        id: artifact_id,
        name: displayName,
        columns,
        rows,
        query: queryStatement,
        queryLabel: firstQuery?.label,
        executedAt: new Date(persisted_at),
      };
    }

    // For non-tabular JSON, create a single-row representation
    const columns: QueryColumn[] = [
      { key: "key", label: "Property", type: "string" },
      { key: "value", label: "Value", type: "string" },
    ];

    const rows = Object.entries(content).map(([key, value]) => ({
      key,
      value:
        typeof value === "object" ? JSON.stringify(value) : String(value ?? ""),
    }));

    return {
      id: artifact_id,
      name: getToolDisplayName(tool_name),
      columns,
      rows,
      executedAt: new Date(persisted_at),
    };
  }

  return null;
}

/**
 * Extract call transcripts from RAG artifacts
 *
 * RAG artifacts may contain references to call recordings.
 * This extracts them into the CallTranscript format.
 */
function extractCallTranscripts(
  artifacts: ArtifactResponse[],
): CallTranscript[] {
  const calls: CallTranscript[] = [];

  for (const artifact of artifacts) {
    if (artifact.tool_name !== "execute_conversation_search") continue;

    const content = artifact.content as unknown as RagArtifactContent;
    if (!content.sample?.rows) continue;

    for (const row of content.sample.rows) {
      // Only extract call-type conversations
      if (row.type !== "call") continue;

      const call: CallTranscript = {
        id: String(row.conversation_id || row.id),
        title: String(row.chunk_text || "").slice(0, 100) + "...",
        date: row.start_time_iso
          ? String(row.start_time_iso)
          : new Date((row.start_time as number) * 1000).toISOString(),
        sourceUrl: row.deep_link ? String(row.deep_link) : undefined,
        summary: row.chunk_text
          ? String(row.chunk_text).slice(0, 500)
          : undefined,
      };

      // Avoid duplicates
      if (!calls.find((c) => c.id === call.id)) {
        calls.push(call);
      }
    }
  }

  return calls;
}

/**
 * Transform artifacts array into TransparencyDrawer props
 *
 * @param artifacts - Array of artifact responses from the API
 * @returns Object with queries and calls arrays for TransparencyDrawer
 *
 * @example
 * ```tsx
 * const { artifacts } = useTransparencyArtifacts(conversationId, runId);
 * const { queries, calls } = transformArtifactsToTransparency(artifacts);
 *
 * <TransparencyDrawer
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   queries={queries}
 *   calls={calls}
 * />
 * ```
 */
export function transformArtifactsToTransparency(
  artifacts: ArtifactResponse[],
): {
  queries: TransparencyQueryResult[];
  calls: CallTranscript[];
} {
  const queries: TransparencyQueryResult[] = [];

  for (const artifact of artifacts) {
    const queryResult = transformArtifactToQueryResult(artifact);
    if (queryResult && queryResult.rows.length > 0) {
      queries.push(queryResult);
    }
  }

  const calls = extractCallTranscripts(artifacts);

  return { queries, calls };
}

/**
 * Artifact summary type for lazy loading
 */
export interface ArtifactSummary {
  artifact_id: string;
  tool_call_id: string;
  tool_name: string;
  artifact_type: string;
  category?: string;
  query_name?: string;
  row_count?: number;
  size_bytes: number;
  persisted_at: string;
  /** Self-describing envelope fields (present when backend uses new format) */
  kind?: string;
  display_name?: string;
}

/**
 * Transform a single artifact into a QueryResult
 * Exported for use in lazy loading scenarios
 *
 * @param artifact - Single artifact response from the API
 * @returns QueryResult for display, or null if cannot be transformed
 */
export function transformSingleArtifact(
  artifact: ArtifactResponse,
): TransparencyQueryResult | null {
  return transformArtifactToQueryResult(artifact);
}

/**
 * Transform artifact summaries into placeholder QueryResults for lazy loading
 * These don't have actual data but can be displayed as tabs/pills
 *
 * Uses query_name from the initial artifacts list if available,
 * otherwise falls back to tool display name.
 *
 * @param summaries - Array of artifact summaries (without content)
 * @returns Array of placeholder QueryResults with loading-friendly structure
 */
export function transformSummariesToPlaceholders(
  summaries: ArtifactSummary[],
): TransparencyQueryResult[] {
  return summaries.map((summary) => ({
    id: summary.artifact_id,
    name:
      summary.display_name ||
      summary.query_name ||
      getToolDisplayName(summary.tool_name),
    description: `Loading...`,
    columns: [],
    rows: [],
    executedAt: new Date(summary.persisted_at),
  }));
}

/**
 * Re-export types for convenience
 */
export type { TransparencyQueryResult, QueryColumn, CallTranscript };

// ============================================================================
// IQ Artifact Transformation (for DeepResearchDataTablesDrawer)
// ============================================================================

import type { ReportColumn, AIReasoningData } from "@vonlabs/design-components";

/**
 * IQ artifact content structure
 * Based on the execute_iq_column_generator tool response
 */
interface IQArtifactColumn {
  name: string;
  display_name: string;
  type?: string;
  is_ai?: boolean;
}

interface IQArtifactCellValue {
  value: unknown;
  reason?: string;
}

interface IQArtifactContent {
  sample?: {
    columns: IQArtifactColumn[];
    rows: Array<Record<string, unknown | IQArtifactCellValue>>;
    size?: number;
    is_complete?: boolean;
  };
  // Also support flat structure
  columns?: IQArtifactColumn[];
  rows?: Array<Record<string, unknown | IQArtifactCellValue>>;
  row_count?: number;
}

/**
 * DataTableConfig type for DeepResearchDataTablesDrawer
 */
export interface DataTableConfig {
  id: string;
  name: string;
  description: string;
  columns: ReportColumn[];
  data: Record<string, unknown>[];
  aiReasoningData?: Record<string, Record<string, AIReasoningData>>;
  rowCount: number;
}

/**
 * Map IQ column type to ReportColumn type
 */
function mapColumnType(type?: string): ReportColumn["type"] {
  if (!type) return "text";

  const typeMap: Record<string, ReportColumn["type"]> = {
    string: "text",
    text: "text",
    number: "number",
    integer: "number",
    float: "number",
    decimal: "number",
    currency: "currency",
    percentage: "percentage",
    percent: "percentage",
    date: "date",
    datetime: "date",
    boolean: "boolean",
    bool: "boolean",
    email: "email",
    phone: "phone",
    url: "url",
    picklist: "picklist",
    owner: "owner",
    multipicklist: "multiPicklist",
    sentiment: "sentiment",
    longtext: "longText",
  };

  return typeMap[type.toLowerCase()] || "text";
}

/**
 * Check if a cell value is an IQ cell value object (has value and optionally reason)
 */
function isIQCellValue(value: unknown): value is IQArtifactCellValue {
  if (typeof value !== "object" || value === null) return false;
  return "value" in value;
}

/**
 * Transform a single IQ artifact into a DataTableConfig
 *
 * Key behaviors:
 * - All columns except the first one are marked as AI columns (isAI: true)
 * - Cell values with {value, reason} structure have their reason extracted for AI reasoning
 */
export function transformIQArtifactToDataTable(
  artifact: ArtifactResponse,
): DataTableConfig | null {
  const { artifact_id, tool_name, content } = artifact;
  const iqContent = content as unknown as IQArtifactContent;

  // Support both nested (sample) and flat structure
  const rawColumns = iqContent.sample?.columns || iqContent.columns;
  const rawRows = iqContent.sample?.rows || iqContent.rows;

  if (!rawColumns || !rawRows) {
    return null;
  }

  // Transform columns to ReportColumn format
  // All IQ columns are AI columns
  const columns: ReportColumn[] = rawColumns.map((col) => ({
    id: col.name,
    label: col.display_name || col.name,
    type: mapColumnType(col.type),
    // All IQ columns are AI-generated
    isAI: true,
    sortable: true,
  }));

  // Build a set of AI column IDs for quick lookup
  const aiColumnIds = new Set(
    columns.filter((col) => col.isAI).map((col) => col.id),
  );

  // Transform rows - extract values and AI reasoning
  const data: Record<string, unknown>[] = [];

  rawRows.forEach((row, rowIndex) => {
    const transformedRow: Record<string, unknown> = {};
    const rowReasoning: Record<string, AIReasoningData> = {};

    // First pass: extract the record name from the first column or known ID fields
    let recordName = "";
    const firstColId = columns[0]?.id;
    if (firstColId && row[firstColId]) {
      const firstValue = row[firstColId];
      if (isIQCellValue(firstValue)) {
        recordName = String(firstValue.value || "");
      } else {
        recordName = String(firstValue || "");
      }
    }
    if (!recordName) {
      recordName = String(
        row.name || row.opportunity_name || row.id || `Row ${rowIndex + 1}`,
      );
    }

    for (const [key, value] of Object.entries(row)) {
      if (isIQCellValue(value)) {
        // IQ cell value with value and optional reason
        transformedRow[key] = value.value;

        // If this is an AI column and has a reason, add to reasoning data
        if (value.reason && aiColumnIds.has(key)) {
          rowReasoning[key] = {
            reasoning: value.reason,
            recordName,
          };
        }
      } else {
        // Regular value
        transformedRow[key] = value;
      }
    }

    // Add _aiReasoning to the row for ReportTable
    if (Object.keys(rowReasoning).length > 0) {
      transformedRow._aiReasoning = rowReasoning;
    }

    data.push(transformedRow);
  });

  // Get a human-readable name for the table
  const tableName = getToolDisplayName(tool_name);

  return {
    id: artifact_id,
    name: tableName,
    description: `${rawRows.length} records`,
    columns,
    data,
    rowCount: iqContent.row_count ?? rawRows.length,
  };
}

/**
 * Transform multiple IQ artifacts into DataTableConfig array
 */
export function transformIQArtifactsToDataTables(
  artifacts: ArtifactResponse[],
): DataTableConfig[] {
  const tables: DataTableConfig[] = [];

  for (const artifact of artifacts) {
    const table = transformIQArtifactToDataTable(artifact);
    if (table) {
      tables.push(table);
    }
  }

  return tables;
}
