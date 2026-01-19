/**
 * SingleArtifactDrawerContainer - App layer wrapper for SingleArtifactDrawer
 *
 * This component handles:
 * - Fetching artifact content using useLazyArtifactContent hook (same as LazyTransparencyDrawer)
 * - Transforming artifact data to the format expected by SingleArtifactDrawer
 * - Managing open/close state
 *
 * The design-components SingleArtifactDrawer is a pure view component.
 * This container handles all the business logic and data fetching.
 */

import React, { useMemo } from "react";
import { SingleArtifactDrawer } from "@vonlabs/design-components";
import type { QueryColumn } from "@vonlabs/design-components";
import {
  useLazyArtifactContent,
  type ArtifactResponse,
} from "../hooks/useMessageArtifacts";
import type { ArtifactState } from "../hooks/useArtifactState";

// ============================================================================
// Types
// ============================================================================

export interface SingleArtifactDrawerContainerProps {
  /** Conversation ID for fetching artifact */
  conversationId: string | null;
  /** Drawer state managed by parent */
  drawerState: ArtifactState;
  /** Callback to close the drawer */
  onClose: () => void;
}

// ============================================================================
// Transformation Utilities
// ============================================================================

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
function getDisplayName(toolName: string): string {
  return TOOL_NAME_MAP[toolName] || toolName.replace(/_/g, " ");
}

interface TransformedArtifact {
  name: string;
  description?: string;
  query?: string;
  columns: QueryColumn[];
  rows: Record<string, string | number>[];
  duration?: number;
  /** Error message if the tool execution failed */
  errorMessage?: string;
}

/**
 * Transform artifact content to display format
 */
function transformArtifactToDisplayFormat(
  artifact: ArtifactResponse,
): TransformedArtifact | null {
  const { tool_name, content } = artifact;

  // Handle SQL query artifacts
  if (tool_name === "execute_sql_query") {
    const sqlContent = content as {
      success?: boolean;
      error?: string;
      query?: string;
      row_count?: number;
      execution_time_ms?: number;
      columns?: Array<{ name: string; display_name?: string; type?: string }>;
      rows?: Array<Record<string, unknown>>;
      sample?: {
        columns: Array<{ name: string; display_name?: string; type?: string }>;
        rows: Array<Record<string, unknown>>;
        size?: number;
        is_complete?: boolean;
      };
      queries?: Array<{ label?: string; dialect?: string; statement: string }>;
    };

    const queryStatement =
      sqlContent.queries?.[0]?.statement || sqlContent.query;

    // Check if query execution failed (success explicitly false)
    if (sqlContent.success === false) {
      return {
        name: getDisplayName(tool_name),
        description: "Query execution failed",
        query: queryStatement,
        columns: [],
        rows: [],
        duration: sqlContent.execution_time_ms,
        errorMessage: sqlContent.error || "Query execution failed",
      };
    }

    // Support both formats: nested under sample or at top level
    const rawColumns = sqlContent.sample?.columns || sqlContent.columns;
    const rawRows = sqlContent.sample?.rows || sqlContent.rows;

    // If no data but query succeeded, return empty result (no error)
    // This will show the "No data available" empty state in SingleArtifactDrawer
    if (!rawColumns || !rawRows || rawColumns.length === 0) {
      return {
        name: getDisplayName(tool_name),
        description: "0 rows returned",
        query: queryStatement,
        columns: [],
        rows: [],
        duration: sqlContent.execution_time_ms,
        // No errorMessage - this is a successful query with no results
      };
    }

    const columns: QueryColumn[] = rawColumns.map((col) => ({
      key: col.name,
      label: col.display_name || col.name,
      type: (col.type as QueryColumn["type"]) || "string",
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
      name: getDisplayName(tool_name),
      description: `${sqlContent.row_count ?? rows.length} rows returned`,
      query: queryStatement,
      columns,
      rows,
      duration: sqlContent.execution_time_ms,
    };
  }

  // Handle RAG/conversation search artifacts
  if (tool_name === "execute_conversation_search") {
    const ragContent = content as {
      success?: boolean;
      row_count?: number;
      sample?: {
        columns: Array<{ name: string; display_name: string }>;
        rows: Array<Record<string, unknown>>;
        size: number;
        is_complete: boolean;
      };
    };

    if (!ragContent.sample?.columns || !ragContent.sample?.rows) {
      return null;
    }

    const columns: QueryColumn[] = ragContent.sample.columns.map((col) => ({
      key: col.name,
      label: col.display_name,
      type: "string" as const,
    }));

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
      name: getDisplayName(tool_name),
      description: `Found ${ragContent.row_count ?? rows.length} conversation chunks`,
      columns,
      rows,
    };
  }

  // Handle generic table artifacts
  if (artifact.artifact_type === "table" || artifact.artifact_type === "json") {
    const genericContent = content as {
      columns?: Array<{ name: string; display_name?: string }>;
      rows?: Array<Record<string, unknown>>;
      sample?: {
        columns: Array<{ name: string; display_name?: string }>;
        rows: Array<Record<string, unknown>>;
      };
    };

    const rawColumns = genericContent.sample?.columns || genericContent.columns;
    const rawRows = genericContent.sample?.rows || genericContent.rows;

    if (rawColumns && rawRows) {
      const columns: QueryColumn[] = rawColumns.map((col) => ({
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
        name: getDisplayName(tool_name),
        columns,
        rows,
      };
    }

    // For non-tabular JSON, create a key-value representation
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
      name: getDisplayName(tool_name),
      columns,
      rows,
    };
  }

  return null;
}

// ============================================================================
// Component
// ============================================================================

export const SingleArtifactDrawerContainer: React.FC<
  SingleArtifactDrawerContainerProps
> = ({ conversationId, drawerState, onClose }) => {
  const { isOpen, artifactId, toolName, runId } = drawerState;

  // Fetch artifact content when drawer is open
  // Uses the same hook as LazyTransparencyDrawer for consistency
  const {
    data: artifact,
    isLoading,
    error,
  } = useLazyArtifactContent(
    conversationId,
    runId,
    isOpen ? artifactId : null, // Only fetch when drawer is open
  );

  // Transform artifact to display format
  const displayData = useMemo(() => {
    if (!artifact) {
      return null;
    }
    return transformArtifactToDisplayFormat(artifact);
  }, [artifact]);

  // Determine error message: fetch error takes precedence, then artifact error
  const errorMessage = error?.message || displayData?.errorMessage || null;

  return (
    <SingleArtifactDrawer
      isOpen={isOpen}
      onClose={onClose}
      toolName={toolName}
      name={displayData?.name || toolName}
      description={displayData?.description}
      query={displayData?.query}
      columns={displayData?.columns || []}
      rows={displayData?.rows || []}
      duration={displayData?.duration}
      isLoading={isLoading}
      error={errorMessage}
    />
  );
};

export default SingleArtifactDrawerContainer;
