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
import { isQueryTool, getToolConfig } from "../constants/warehouseToolRegistry";

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
  // Optional warehouse source hint (e.g., "bigquery", "databricks")
  // Used when backend sends all warehouse queries as execute_sql_query
  source?: string;
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

// ============================================================================
// Dynamic Content Parser
// ============================================================================

interface ExtractedTableData {
  columns: Array<{ name: string; display_name?: string; type?: string }>;
  rows: Array<Record<string, unknown>>;
  query?: string;
  row_count?: number;
  execution_time_ms?: number;
  query_name?: string;
}

/**
 * Keys to skip when extracting tabular data — these are metadata, not data.
 */
const METADATA_KEYS = new Set([
  "success",
  "error",
  "message",
  "status",
  "query",
  "query_name",
  "row_count",
  "execution_time_ms",
  "source",
  "statement_id",
  "catalog",
  "schema",
]);

/**
 * Try to parse a value as JSON if it's a string.
 */
function tryParseJson(value: unknown): unknown {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Check if a value is an array of objects (i.e. tabular data).
 */
function isArrayOfObjects(
  value: unknown,
): value is Array<Record<string, unknown>> {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === "object" &&
    value[0] !== null &&
    !Array.isArray(value[0])
  );
}

/**
 * Infer columns from an array of objects by collecting all unique keys.
 */
function inferColumnsFromRows(
  rows: Array<Record<string, unknown>>,
): Array<{ name: string; display_name: string }> {
  const keySet = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      keySet.add(key);
    }
  }
  return Array.from(keySet).map((key) => ({
    name: key,
    display_name: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
  }));
}

/**
 * Recursively search an object for the first array of objects (tabular data).
 * Skips metadata keys and searches up to 3 levels deep.
 */
function findFirstArrayOfObjects(
  obj: Record<string, unknown>,
  depth = 0,
): Array<Record<string, unknown>> | null {
  if (depth > 3) return null;

  for (const [key, value] of Object.entries(obj)) {
    if (METADATA_KEYS.has(key)) continue;

    // Check if this value is directly an array of objects
    if (isArrayOfObjects(value)) {
      return value;
    }

    // Check if this value is a JSON string that parses to an array of objects
    const parsed = tryParseJson(value);
    if (isArrayOfObjects(parsed)) {
      return parsed;
    }

    // If parsed is an object, recurse into it
    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      const found = findFirstArrayOfObjects(
        parsed as Record<string, unknown>,
        depth + 1,
      );
      if (found) return found;
    }

    // Recurse into nested objects
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      const found = findFirstArrayOfObjects(
        value as Record<string, unknown>,
        depth + 1,
      );
      if (found) return found;
    }
  }

  return null;
}

/**
 * Try to extract explicit columns from content (e.g. manifest.schema.columns).
 * Searches for any "columns" key up to 3 levels deep.
 */
function findExplicitColumns(
  obj: Record<string, unknown>,
  depth = 0,
): Array<{ name: string; display_name?: string; type?: string }> | null {
  if (depth > 3) return null;

  for (const [key, value] of Object.entries(obj)) {
    // Direct columns array with name property
    if (
      key === "columns" &&
      Array.isArray(value) &&
      value.length > 0 &&
      typeof value[0] === "object" &&
      value[0] !== null &&
      "name" in value[0]
    ) {
      return value as Array<{
        name: string;
        display_name?: string;
        type?: string;
      }>;
    }

    // Parse JSON strings
    const parsed = tryParseJson(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const found = findExplicitColumns(
        parsed as Record<string, unknown>,
        depth + 1,
      );
      if (found) return found;
    }

    // Recurse into nested objects
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      const found = findExplicitColumns(
        value as Record<string, unknown>,
        depth + 1,
      );
      if (found) return found;
    }
  }

  return null;
}

/**
 * Dynamically extract tabular data from arbitrary content.
 *
 * Strategy (in order):
 * 1. Contract format: columns/rows at top level or under sample
 * 2. Parse stringified `result` field, then search for arrays of objects
 * 3. Find first array of objects anywhere in the content tree
 * 4. Flatten scalar object to key/value pairs as last resort
 */
function dynamicExtractTableData(
  content: Record<string, unknown>,
): ExtractedTableData | null {
  const c = content as Record<string, unknown>;

  // --- Strategy 1: Contract format (columns + rows / sample.columns + sample.rows) ---
  const sample = c.sample as
    | { columns?: unknown[]; rows?: unknown[] }
    | undefined;
  const contractCols = (sample?.columns || c.columns) as
    | Array<{ name: string; display_name?: string; type?: string }>
    | undefined;
  const contractRows = (sample?.rows || c.rows) as
    | Array<Record<string, unknown>>
    | undefined;

  if (contractCols && Array.isArray(contractCols) && contractRows && Array.isArray(contractRows)) {
    return {
      columns: contractCols,
      rows: contractRows,
      query: (c.query as string) || (c.queries as Array<{ statement: string }>)?.[0]?.statement,
      row_count: c.row_count as number | undefined,
      execution_time_ms: c.execution_time_ms as number | undefined,
      query_name: c.query_name as string | undefined,
    };
  }

  // --- Strategy 2 & 3: Find arrays of objects (including in parsed JSON strings) ---
  const rows = findFirstArrayOfObjects(c);
  if (rows) {
    // Try to find explicit column definitions nearby
    const explicitCols = findExplicitColumns(c);
    const columns = explicitCols || inferColumnsFromRows(rows);

    return {
      columns,
      rows,
      query: (c.query as string) || (c.statement as string),
      row_count: (c.row_count as number) ?? rows.length,
      execution_time_ms: c.execution_time_ms as number | undefined,
      query_name: c.query_name as string | undefined,
    };
  }

  // --- Strategy 4: Flatten top-level scalars to key/value table ---
  // Only if there are meaningful non-metadata fields
  const flatEntries = Object.entries(c).filter(
    ([key, value]) =>
      !METADATA_KEYS.has(key) &&
      value !== null &&
      value !== undefined,
  );

  if (flatEntries.length > 0) {
    // Check if every remaining value is a scalar or short string — build key/value
    const allScalar = flatEntries.every(
      ([, v]) => typeof v !== "object" || v === null,
    );

    if (allScalar) {
      return {
        columns: [
          { name: "key", display_name: "Property" },
          { name: "value", display_name: "Value" },
        ],
        rows: flatEntries.map(([key, value]) => ({
          key: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          value: String(value ?? ""),
        })),
        query_name: c.query_name as string | undefined,
      };
    }

    // If there are nested objects/arrays but we couldn't find a table,
    // flatten everything to key/value with JSON stringification
    return {
      columns: [
        { name: "key", display_name: "Property" },
        { name: "value", display_name: "Value" },
      ],
      rows: Object.entries(c)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([key, value]) => ({
          key: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          value:
            typeof value === "object"
              ? JSON.stringify(value)
              : String(value ?? ""),
        })),
      query_name: c.query_name as string | undefined,
    };
  }

  return null;
}

// ============================================================================
// Row Transformation
// ============================================================================

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
 * Fallback display names for non-registry tools
 */
const FALLBACK_TOOL_NAMES: Record<string, string> = {
  execute_conversation_search: "Conversation Search",
  search_calls: "Call Search",
  search_emails: "Email Search",
  get_account_info: "Account Info",
  get_opportunity_info: "Opportunity Info",
  get_contact_info: "Contact Info",
};

/**
 * Get human-readable name for a tool.
 * Checks the warehouse tool registry first, then falls back to static map.
 */
function getToolDisplayName(toolName: string): string {
  const config = getToolConfig(toolName);
  if (config) return config.displayName;
  return FALLBACK_TOOL_NAMES[toolName] || toolName.replace(/_/g, " ");
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

  // Handle all registered query tools (Salesforce, BigQuery, Databricks, Snowflake, etc.)
  if (isQueryTool(tool_name)) {
    const sqlContent = content as unknown as SqlArtifactContent;

    // Resolve config — if generic execute_sql_query has a source hint, use that
    let config = getToolConfig(tool_name)!;
    if (tool_name === "execute_sql_query" && sqlContent.source) {
      const sourceConfig = getToolConfig(
        `execute_${sqlContent.source}_query`,
      );
      if (sourceConfig) config = sourceConfig;
    }

    // Try contract format first, then fall back to dynamic parsing
    const extracted = dynamicExtractTableData(
      content as Record<string, unknown>,
    );
    if (!extracted || extracted.rows.length === 0) {
      return null;
    }

    const columns: QueryColumn[] = applyDeepLinkTransform(
      extracted.columns.map((col) => ({
        key: col.name,
        label: col.display_name || col.name,
        type: (col.type as QueryColumn["type"]) || "string",
      })),
    );

    const rows = transformRowsForDisplay(extracted.rows);

    // Get query from extracted data or queries array
    const firstQuery = sqlContent.queries?.[0];
    const queryStatement =
      firstQuery?.statement || extracted.query || sqlContent.query;

    // Use query_name if available, otherwise fall back to registry display name
    const displayName =
      extracted.query_name || sqlContent.query_name || config.displayName;
    // Use backend-provided label, fall back to registry queryLabel
    const queryLabel = firstQuery?.label || config.queryLabel;

    return {
      id: artifact_id,
      name: displayName,
      description: `${extracted.row_count ?? rows.length} rows returned`,
      query: queryStatement,
      queryLabel,
      columns,
      rows,
      executedAt: new Date(persisted_at),
      duration: extracted.execution_time_ms ?? sqlContent.execution_time_ms,
    };
  }

  if (
    artifact.category?.toLowerCase() === "memory" ||
    MEMORY_TOOL_NAMES.has(tool_name)
  ) {
    return null;
  }

  // Handle generic JSON/table artifacts using dynamic parsing
  if (artifact.artifact_type === "table" || artifact.artifact_type === "json") {
    const extracted = dynamicExtractTableData(
      content as Record<string, unknown>,
    );
    if (!extracted) return null;

    const genericContent = content as unknown as GenericArtifactContent;
    const columns: QueryColumn[] = applyDeepLinkTransform(
      extracted.columns.map((col) => ({
        key: col.name,
        label: col.display_name || col.name,
        type: (col.type as QueryColumn["type"]) || "string",
      })),
    );

    const rows = transformRowsForDisplay(extracted.rows);

    const displayName =
      extracted.query_name || getToolDisplayName(tool_name);

    const firstQuery = genericContent.queries?.[0];
    const queryStatement =
      firstQuery?.statement || extracted.query || genericContent.query;

    return {
      id: artifact_id,
      name: displayName,
      columns,
      rows,
      query: queryStatement,
      queryLabel: firstQuery?.label,
      executedAt: new Date(persisted_at),
      duration: extracted.execution_time_ms,
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
