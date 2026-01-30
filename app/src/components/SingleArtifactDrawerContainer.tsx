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
import type {
  QueryColumn,
  CallTranscript,
  ReportColumn,
} from "@vonlabs/design-components";
import {
  useLazyArtifactContent,
  type ArtifactResponse,
} from "../hooks/useMessageArtifacts";
import type { ArtifactState } from "../hooks/useArtifactState";
import {
  isRagArtifact,
  transformSingleArtifactToCalls,
} from "../utils/transformArtifactsToCalls";
import { transformIQArtifactToDataTable } from "../utils/transformArtifactsToTransparency";

export interface SingleArtifactDrawerContainerProps {
  /** Conversation ID for fetching artifact */
  conversationId: string | null;
  /** Drawer state managed by parent */
  drawerState: ArtifactState;
  /** Callback to close the drawer */
  onClose: () => void;
}

interface TransformedDataArtifact {
  viewMode: "data";
  query?: string;
  columns: QueryColumn[];
  rows: Record<string, string | number>[];
  duration?: number;
  /** Error message if the tool execution failed */
  errorMessage?: string;
}

interface TransformedCallsArtifact {
  viewMode: "calls";
  calls: CallTranscript[];
}

interface TransformedMemoryArtifact {
  viewMode: "memory";
  memoryData: {
    operation: "retrieve" | "save" | "update";
    success: boolean;
    key: string;
    value?: string;
    char_count?: number;
    appended?: boolean;
    error?: string;
  };
}

interface TransformedIQArtifact {
  viewMode: "iq";
  columns: ReportColumn[];
  data: Record<string, unknown>[];
  rowCount: number;
}

type TransformedArtifact =
  | TransformedDataArtifact
  | TransformedCallsArtifact
  | TransformedMemoryArtifact
  | TransformedIQArtifact;

/**
 * Transform artifact content to display format
 */
function transformArtifactToDisplayFormat(
  artifact: ArtifactResponse,
): TransformedArtifact | null {
  const { tool_name, category, content } = artifact;

  // Handle RAG/conversation search artifacts - render as calls timeline
  if (category && isRagArtifact(category)) {
    return {
      viewMode: "calls",
      calls: transformSingleArtifactToCalls(artifact),
    };
  }

  // Handle memory artifacts - render with markdown support
  if (category === "memory" && content.key !== undefined) {
    return {
      viewMode: "memory",
      memoryData: {
        operation: (content.memory_operation ||
          content.operation ||
          "retrieve") as "retrieve" | "save" | "update",
        success: content.success as boolean,
        key: content.key as string,
        value: content.value as string | undefined,
        char_count: content.char_count as number | undefined,
        appended: content.appended as boolean | undefined,
        error: content.error as string | undefined,
      },
    };
  }

  // Handle IQ artifacts - render with ReportTable (same as DataTablesDrawer)
  if (category?.toLowerCase() === "iq") {
    const tableConfig = transformIQArtifactToDataTable(artifact);
    if (tableConfig) {
      return {
        viewMode: "iq",
        columns: tableConfig.columns,
        data: tableConfig.data,
        rowCount: tableConfig.rowCount,
      };
    }
  }

  // Handle SQL and SOQL query artifacts
  if (
    tool_name === "execute_sql_query" ||
    tool_name === "execute_salesforce_query" ||
    category === "soql"
  ) {
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
        viewMode: "data",
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
        viewMode: "data",
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
      viewMode: "data",
      query: queryStatement,
      columns,
      rows,
      duration: sqlContent.execution_time_ms,
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
        viewMode: "data",
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
      viewMode: "data",
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
  const errorMessage = useMemo(() => {
    if (error?.message) return error.message;
    if (displayData?.viewMode === "data" && displayData.errorMessage) {
      return displayData.errorMessage;
    }
    return null;
  }, [error, displayData]);

  // Build props based on view mode (discriminated union pattern)
  if (displayData?.viewMode === "memory") {
    return (
      <SingleArtifactDrawer
        isOpen={isOpen}
        onClose={onClose}
        toolName={toolName}
        viewMode="memory"
        memoryData={displayData.memoryData}
        isLoading={isLoading}
        error={errorMessage}
      />
    );
  }

  if (displayData?.viewMode === "calls") {
    return (
      <SingleArtifactDrawer
        isOpen={isOpen}
        onClose={onClose}
        toolName={toolName}
        viewMode="calls"
        calls={displayData.calls}
        isLoading={isLoading}
        error={errorMessage}
      />
    );
  }

  if (displayData?.viewMode === "iq") {
    return (
      <SingleArtifactDrawer
        isOpen={isOpen}
        onClose={onClose}
        toolName={toolName}
        viewMode="iq"
        columns={displayData.columns}
        data={displayData.data}
        rowCount={displayData.rowCount}
        isLoading={isLoading}
        error={errorMessage}
      />
    );
  }

  // Default to data view (includes null displayData case)
  const dataDisplayData = displayData as TransformedDataArtifact | null;
  return (
    <SingleArtifactDrawer
      isOpen={isOpen}
      onClose={onClose}
      toolName={toolName}
      viewMode="data"
      query={dataDisplayData?.query}
      columns={dataDisplayData?.columns ?? []}
      rows={dataDisplayData?.rows ?? []}
      duration={dataDisplayData?.duration}
      isLoading={isLoading}
      error={errorMessage}
    />
  );
};

export default SingleArtifactDrawerContainer;
