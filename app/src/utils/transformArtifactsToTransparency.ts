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
  QueryResult,
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
  columns?: Array<{
    name: string;
    display_name?: string;
    type?: string;
  }>;
  rows?: Array<Record<string, unknown>>;
  row_count?: number;
  execution_time_ms?: number;
  error?: string;
}

/**
 * Human-readable tool name mapping
 */
const TOOL_NAME_MAP: Record<string, string> = {
  execute_sql_query: "SQL Query",
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
): QueryResult | null {
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

  // Handle SQL query artifacts
  if (tool_name === "execute_sql_query") {
    const sqlContent = content as unknown as SqlArtifactContent;

    if (!sqlContent.columns || !sqlContent.rows) {
      return null;
    }

    const columns: QueryColumn[] = sqlContent.columns.map((col) => ({
      key: col.name,
      label: col.display_name || col.name,
      type: (col.type as QueryColumn["type"]) || "string",
    }));

    // Transform rows to string values for display
    const rows = sqlContent.rows.map((row) => {
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
      description: `${sqlContent.row_count ?? rows.length} rows returned`,
      query: sqlContent.query,
      columns,
      rows,
      executedAt: new Date(persisted_at),
      duration: sqlContent.execution_time_ms,
    };
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

      return {
        id: artifact_id,
        name: getToolDisplayName(tool_name),
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
        summary: row.chunk_text ? String(row.chunk_text).slice(0, 500) : undefined,
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
  queries: QueryResult[];
  calls: CallTranscript[];
} {
  const queries: QueryResult[] = [];

  for (const artifact of artifacts) {
    const queryResult = transformArtifactToQueryResult(artifact);
    if (queryResult) {
      queries.push(queryResult);
    }
  }

  const calls = extractCallTranscripts(artifacts);

  return { queries, calls };
}

/**
 * Re-export types for convenience
 */
export type { QueryResult, QueryColumn, CallTranscript };
