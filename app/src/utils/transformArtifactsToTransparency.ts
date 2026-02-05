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
 * Memory tool names to exclude from sources
 */
export const MEMORY_TOOL_NAMES = new Set([
  "get_org_memory",
  "save_org_memory",
  "update_org_memory",
  "execute_org_memory",
]);

/**
 * Human-readable tool name mapping
 */
const TOOL_NAME_MAP: Record<string, string> = {
  execute_sql_query: "Query",
  execute_salesforce_query: "Query",
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

/**
 * Transform a single artifact into a QueryResult for the TransparencyDrawer
 */
function transformArtifactToQueryResult(
  artifact: ArtifactResponse,
): TransparencyQueryResult | null {
  const { artifact_id, tool_name, content, persisted_at } = artifact;

  // Handle RAG/conversation search artifacts
  if (tool_name === "execute_conversation_search") {
    const ragContent = content as unknown as RagArtifactContent;

    if (!ragContent.sample?.columns || !ragContent.sample?.rows) {
      return null;
    }

    const columns: QueryColumn[] = ragContent.sample.columns.map((col) => ({
      key: col.name,
      label: col.display_name,
      type: "string" as const,
    }));

    // Transform rows to string values for display
    const rows = ragContent.sample.rows.map((row) => {
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

    const columns: QueryColumn[] = rawColumns.map((col) => ({
      key: col.name,
      label: col.display_name || col.name,
      type: (col.type as QueryColumn["type"]) || "string",
    }));

    // Transform rows to string values for display
    const rows = rawRows.map((row) => {
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

    // Get query from either format: queries[0].statement or query
    const queryStatement =
      sqlContent.queries?.[0]?.statement || sqlContent.query;

    // Use query_name if available, otherwise fall back to tool display name
    const displayName = sqlContent.query_name || getToolDisplayName(tool_name);

    return {
      id: artifact_id,
      name: displayName,
      description: `${sqlContent.row_count ?? rows.length} rows returned`,
      query: queryStatement,
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
    const genericContent = content as Record<string, unknown>;

    // Try to extract table-like data from generic content
    if (genericContent.columns && genericContent.rows) {
      const cols = genericContent.columns as Array<{
        name: string;
        display_name?: string;
      }>;
      const rawRows = genericContent.rows as Array<Record<string, unknown>>;

      const columns: QueryColumn[] = cols.map((col) => ({
        key: col.name,
        label: col.display_name || col.name,
        type: "string" as const,
      }));

      const rows = rawRows.map((row) => {
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

      // Use query_name if available, otherwise fall back to tool display name
      const displayName =
        (genericContent.query_name as string) || getToolDisplayName(tool_name);

      return {
        id: artifact_id,
        name: displayName,
        columns,
        rows,
        executedAt: new Date(persisted_at),
      };
    }

    // For non-tabular JSON, create a single-row representation
    const columns: QueryColumn[] = [
      { key: "key", label: "Property", type: "string" },
      { key: "value", label: "Value", type: "string" },
    ];

    const rows = Object.entries(genericContent).map(([key, value]) => ({
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
    name: summary.query_name || getToolDisplayName(summary.tool_name),
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
