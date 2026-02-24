import { useState, useEffect } from 'react';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import { ToolResultRenderer } from './ToolResultRenderer';
import type { ToolResult, QueryInfo, MetricData, ValueData, StatisticsData } from './types';
import { SidePane } from '../SidePane';
import { getToolDisplayName } from './utils/toolNameFormatter';
import {
  tableToCSV,
  valuesToCSV,
  statisticsToCSV,
  metricsToCSV,
  callSearchResultsToCSV,
  downloadCSV,
  generateCSVFilename,
  isExportableType,
  isCallSearchUnion,
} from './utils/csvExport';
import type { CallSearchResult } from './types';
import { XCircleIcon } from './icons';
import { ARTIFACT_PANE_WIDTH } from '../../constants';

// ============================================================================
// Types
// ============================================================================

/**
 * Artifact data structure - passed as prop from app layer
 */
export interface ArtifactData {
  artifact_id: string;
  tool_call_id: string;
  tool_name: string;
  artifact_type: string;
  category?: string;
  content: Record<string, unknown>;
  size_bytes: number;
  persisted_at: string;
}

export interface ArtifactPaneProps {
  /** Whether the pane is open */
  isOpen: boolean;
  /** Tool name for display */
  toolName: string;
  /** Callback when pane is closed */
  onClose: () => void;
  /** Artifact data - fetched by app layer */
  artifact?: ArtifactData | null;
  /** Whether artifact is loading */
  isLoading?: boolean;
  /** Error message if loading failed */
  error?: string | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert CallSearchResult[] to TableData for rendering as a simple table
 */
function convertCallSearchToTable(results: CallSearchResult[]): import('./types').TableData {
  const formatSpeakers = (speakers?: string | string[]): string => {
    if (!speakers) return '';
    return Array.isArray(speakers) ? speakers.join(', ') : speakers;
  };

  return {
    columns: [
      { name: 'call_title', display_name: 'Title' },
      { name: 'call_date', display_name: 'Date' },
      { name: 'duration_minutes', display_name: 'Duration (min)' },
      { name: 'external_speakers', display_name: 'External Speakers' },
      { name: 'internal_speakers', display_name: 'Internal Speakers' },
      { name: 'external_companies', display_name: 'Companies' },
      { name: 'match_source', display_name: 'Match Source' },
    ],
    rows: results.map((call) => ({
      call_title: call.call_title || '',
      call_date: call.call_date || '',
      duration_minutes: call.duration_minutes ?? '',
      external_speakers: formatSpeakers(call.external_speakers),
      internal_speakers: formatSpeakers(call.internal_speakers),
      external_companies: call.external_companies?.join(', ') || '',
      match_source: call.match_info?.source || '',
    })),
    rowCount: results.length,
    isComplete: true,
  };
}

// ============================================================================
// Subcomponents
// ============================================================================

/**
 * ErrorDisplay Component
 *
 * Displays a user-friendly error message when a tool execution fails
 */
interface ErrorDisplayProps {
  error: string;
  details?: string;
  source?: string;
}

function ErrorDisplay({ error, details, source }: ErrorDisplayProps) {
  return (
    <div className="p-6">
      {/* Error icon and heading */}
      <div className="flex items-start gap-3 mb-4">
        <XCircleIcon className="text-red-500 shrink-0" size={24} />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Query Execution Failed</h3>
          {source && <p className="text-xs text-gray-500 mt-1">Source: {source}</p>}
        </div>
      </div>

      {/* Primary error message */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-red-800 font-mono whitespace-pre-wrap">{error}</p>
      </div>

      {/* Detailed error (if available and different from primary) */}
      {details && details !== error && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-semibold mb-2">Additional Details:</p>
          <p className="text-xs text-gray-700 font-mono whitespace-pre-wrap">{details}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Loading skeleton component
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-4 w-full animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
    </div>
  );
}

/**
 * Fetch error display
 */
function FetchErrorDisplay({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <svg
        className="w-12 h-12 text-red-500 mb-4"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <h4 className="text-lg font-semibold text-gray-900 mb-2">Failed to load artifact</h4>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ArtifactPane Component
 *
 * Pure view component - Side drawer that slides in from the right to display artifact content.
 * Data fetching is handled by the app layer (container component).
 *
 * Uses existing ToolResultRenderer for consistent artifact display.
 */
export function ArtifactPane({
  isOpen,
  toolName,
  onClose,
  artifact,
  isLoading = false,
  error = null,
}: ArtifactPaneProps) {
  // Determine if queries exist
  const hasQueries =
    artifact && !isLoading && !error
      ? (((artifact.content as Record<string, unknown>)?.queries as QueryInfo[] | undefined)
          ?.length ?? 0) > 0
      : false;

  // Set default tab to 'query' if queries exist, otherwise 'result'
  const [activeTab, setActiveTab] = useState<'result' | 'query'>('query');
  const [userChangedTab, setUserChangedTab] = useState(false);

  // Reset to default when artifact changes (e.g., different artifact opened)
  // Only auto-switch tabs if user hasn't manually changed them
  useEffect(() => {
    if (!userChangedTab) {
      if (hasQueries) {
        setActiveTab('query');
      } else if (artifact && !isLoading) {
        setActiveTab('result');
      }
    }
  }, [artifact, hasQueries, isLoading, userChangedTab]);

  // Reset userChangedTab when artifact changes (new artifact opened)
  useEffect(() => {
    setUserChangedTab(false);
  }, [artifact?.artifact_id]);

  // Handler for tab changes that tracks user interaction
  const handleTabChange = (tab: 'result' | 'query') => {
    setActiveTab(tab);
    setUserChangedTab(true);
  };

  // Check if artifact represents a failed tool execution
  const hasExecutionError = (artifact?.content as Record<string, unknown>)?.success === false;
  const errorInfo = hasExecutionError
    ? {
        message:
          ((artifact?.content as Record<string, unknown>)?.error as string) ||
          'An unknown error occurred',
        details: (
          ((artifact?.content as Record<string, unknown>)?.metadata as Record<string, unknown>)
            ?.error as Record<string, unknown>
        )?.message as string | undefined,
        source: (
          ((artifact?.content as Record<string, unknown>)?.metadata as Record<string, unknown>)
            ?.error as Record<string, unknown>
        )?.source as string | undefined,
      }
    : null;

  // Extract queries even for failed executions (for SQL tab)
  const queries = ((artifact?.content as Record<string, unknown>)?.queries as QueryInfo[]) || null;

  // Determine if CSV export is available
  const canExportCSV =
    artifact &&
    !hasExecutionError &&
    !isLoading &&
    !error &&
    (isExportableType(artifact.artifact_type) ||
      isCallSearchUnion(artifact.content as Record<string, unknown>));

  // Handle CSV download based on artifact type
  const handleDownloadCSV = () => {
    if (!artifact) return;

    let csvContent = '';
    const content = artifact.content as Record<string, unknown>;
    const artifactType = artifact.artifact_type;

    // Check for call_search_union first (content.type takes precedence over artifact_type)
    if (isCallSearchUnion(content)) {
      const results = content.results as CallSearchResult[];
      if (results) {
        csvContent = callSearchResultsToCSV(results);
      }
    } else {
      switch (artifactType) {
        case 'table': {
          const sample = content.sample as Record<string, unknown>;
          if (sample) {
            const tableData = {
              columns: (sample.columns as import('./types').ColumnMetadata[]) || [],
              rows: (sample.rows as Record<string, unknown>[]) || [],
              rowCount: (sample.size as number) || 0,
              isComplete: (sample.is_complete as boolean) ?? true,
            };
            csvContent = tableToCSV(tableData);
          }
          break;
        }
        case 'values': {
          const values = content.values as ValueData[];
          if (values) {
            csvContent = valuesToCSV(values);
          }
          break;
        }
        case 'statistics': {
          const statistics = content.statistics as StatisticsData;
          if (statistics) {
            csvContent = statisticsToCSV(statistics);
          }
          break;
        }
        case 'metrics': {
          const metrics = content.metrics as MetricData[];
          if (metrics) {
            csvContent = metricsToCSV(metrics);
          }
          break;
        }
        default:
          return;
      }
    }

    if (csvContent) {
      // Use content type if it's call_search_union, otherwise artifact_type
      const exportType = isCallSearchUnion(content) ? 'call_search_union' : artifactType;
      const filename = generateCSVFilename(toolName, exportType);
      downloadCSV(csvContent, filename);
    }
  };

  // Convert artifact content to ToolResult format for rendering
  const toolResult: ToolResult | null =
    artifact && !hasExecutionError
      ? {
          raw: artifact.content as Record<string, unknown>,
          type: artifact.artifact_type as
            | 'table'
            | 'values'
            | 'schema'
            | 'statistics'
            | 'metrics'
            | 'query'
            | 'table_list'
            | 'memory'
            | 'call_search_union'
            | 'consolidated_conversation_search',
          // Map artifact types to ToolResult structure
          // Handle consolidated_conversation_search type (calls + emails with queries)
          // Check content.type first since artifact_type may not match the actual result type
          ...((artifact.content as Record<string, unknown>).type ===
          'consolidated_conversation_search'
            ? {
                type: 'consolidated_conversation_search' as const,
              }
            : {}),
          // Handle call_search_union type (find_entity_conversations results) - render as flat table
          // Check content.type first since artifact_type may be 'table' but content is call_search_union
          ...((artifact.content as Record<string, unknown>).type === 'call_search_union' &&
          (artifact.content as Record<string, unknown>).results
            ? {
                type: 'table' as const,
                table: convertCallSearchToTable(
                  (artifact.content as Record<string, unknown>).results as CallSearchResult[]
                ),
              }
            : {}),
          ...(artifact.artifact_type === 'table' &&
          (artifact.content as Record<string, unknown>).sample &&
          (artifact.content as Record<string, unknown>).type !== 'call_search_union' // Skip if already handled as call_search_union
            ? {
                table: {
                  columns:
                    ((
                      (artifact.content as Record<string, unknown>).sample as Record<
                        string,
                        unknown
                      >
                    ).columns as import('./types').ColumnMetadata[]) || [],
                  rows:
                    ((
                      (artifact.content as Record<string, unknown>).sample as Record<
                        string,
                        unknown
                      >
                    ).rows as Record<string, any>[]) || [], // eslint-disable-line @typescript-eslint/no-explicit-any
                  rowCount:
                    ((artifact.content as Record<string, unknown>).row_count as number) ||
                    ((
                      (artifact.content as Record<string, unknown>).sample as Record<
                        string,
                        unknown
                      >
                    ).size as number) ||
                    0,
                  isComplete:
                    ((
                      (artifact.content as Record<string, unknown>).sample as Record<
                        string,
                        unknown
                      >
                    ).is_complete as boolean) ?? true,
                },
                queries: (artifact.content as Record<string, unknown>).queries as QueryInfo[],
              }
            : {}),
          ...(artifact.artifact_type === 'values' &&
          (artifact.content as Record<string, unknown>).values
            ? {
                values: (artifact.content as Record<string, unknown>).values as ValueData[],
                queries: (artifact.content as Record<string, unknown>).queries as QueryInfo[],
              }
            : {}),
          ...(artifact.artifact_type === 'schema' &&
          (artifact.content as Record<string, unknown>).columns
            ? {
                schema: {
                  tableName: (artifact.content as Record<string, unknown>).table_name as string,
                  columns: (artifact.content as Record<string, unknown>).columns as Array<{
                    name: string;
                    type: string;
                  }>,
                },
                queries: (artifact.content as Record<string, unknown>).queries as QueryInfo[],
              }
            : {}),
          ...(artifact.artifact_type === 'statistics' &&
          (artifact.content as Record<string, unknown>).statistics
            ? {
                statistics: (artifact.content as Record<string, unknown>)
                  .statistics as StatisticsData,
                queries: (artifact.content as Record<string, unknown>).queries as QueryInfo[],
              }
            : {}),
          ...(artifact.artifact_type === 'metrics'
            ? {
                metrics:
                  ((artifact.content as Record<string, unknown>).metrics as MetricData[]) || [],
              }
            : {}),
          ...(artifact.artifact_type === 'query' &&
          (artifact.content as Record<string, unknown>).queries
            ? { queries: (artifact.content as Record<string, unknown>).queries as QueryInfo[] }
            : {}),
          ...(artifact.artifact_type === 'table_list' &&
          ((artifact.content as Record<string, unknown>).materialized_views ||
            (artifact.content as Record<string, unknown>).all_objects)
            ? {
                tables:
                  ((artifact.content as Record<string, unknown>).materialized_views as string[]) ||
                  ((artifact.content as Record<string, unknown>).all_objects as string[]) ||
                  [],
                queries: (artifact.content as Record<string, unknown>).queries as QueryInfo[],
              }
            : {}),
          ...((artifact.artifact_type === 'memory' || artifact.category === 'memory') &&
          (artifact.content as Record<string, unknown>).key !== undefined
            ? {
                type: 'memory' as const,
                memory: {
                  operation: ((artifact.content as Record<string, unknown>).memory_operation ||
                    (artifact.content as Record<string, unknown>).operation ||
                    'retrieve') as 'retrieve' | 'save' | 'update',
                  success: (artifact.content as Record<string, unknown>).success as boolean,
                  key: (artifact.content as Record<string, unknown>).key as string,
                  value: (artifact.content as Record<string, unknown>).value as string | undefined,
                  char_count: (artifact.content as Record<string, unknown>).char_count as
                    | number
                    | undefined,
                  appended: (artifact.content as Record<string, unknown>).appended as
                    | boolean
                    | undefined,
                  error: (artifact.content as Record<string, unknown>).error as string | undefined,
                },
              }
            : {}),
          // Handle when artifact_type is directly consolidated_conversation_search
          ...(artifact.artifact_type === 'consolidated_conversation_search' &&
          ((artifact.content as Record<string, unknown>).calls ||
            (artifact.content as Record<string, unknown>).emails)
            ? {
                type: 'consolidated_conversation_search' as const,
              }
            : {}),
        }
      : null;

  // Custom title
  const toolDisplayName = getToolDisplayName(toolName);
  const titleContent = <h3 className="text-lg font-semibold text-gray-900">{toolDisplayName}</h3>;

  return (
    <SidePane isOpen={isOpen} onClose={onClose} title={titleContent} width={ARTIFACT_PANE_WIDTH}>
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSkeleton />
        </div>
      )}

      {error && <FetchErrorDisplay message={error} />}

      {/* Tool execution error - show error UI with SQL tab */}
      {artifact && hasExecutionError && errorInfo && !isLoading && !error && (
        <div className="flex flex-col h-full">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            {queries && queries.length > 0 && (
              <button
                onClick={() => handleTabChange('query')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'query'
                    ? 'border-gray-600 text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Query
              </button>
            )}
            <button
              onClick={() => handleTabChange('result')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors cursor-pointer ${
                activeTab === 'result'
                  ? 'border-gray-600 text-gray-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Result
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto">
            {activeTab === 'result' && (
              <ErrorDisplay
                error={errorInfo.message}
                details={errorInfo.details}
                source={errorInfo.source}
              />
            )}
            {activeTab === 'query' && queries && (
              <div className="p-4">
                <div className="space-y-4">
                  {queries.map((query: QueryInfo, index: number) => (
                    <div key={index} className="space-y-2">
                      {/* Query label */}
                      {query.label && (
                        <h4 className="text-sm font-semibold text-gray-700">{query.label}</h4>
                      )}
                      {/* Query statement */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap wrap-break-word">
                          {query.statement}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Successful tool execution - show normal result */}
      {artifact && toolResult && !isLoading && !error && (
        <div className="flex flex-col h-full">
          {/* Tab Navigation - only show for non-memory tools */}
          {toolResult.type !== 'memory' && (
            <div className="flex border-b border-gray-200">
              {toolResult.queries && toolResult.queries.length > 0 && (
                <button
                  onClick={() => handleTabChange('query')}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'query'
                      ? 'border-gray-600 text-gray-900'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  Query
                </button>
              )}
              <button
                onClick={() => handleTabChange('result')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'result'
                    ? 'border-gray-600 text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Result
              </button>
            </div>
          )}

          {/* Tab Content */}
          <div className="flex-1 overflow-auto">
            {/* Memory tools - always show result without tabs */}
            {toolResult.type === 'memory' && <ToolResultRenderer result={toolResult} />}

            {/* Other tools - show based on active tab */}
            {toolResult.type !== 'memory' && activeTab === 'result' && (
              <div className="flex flex-col h-full">
                {/* Toolbar with download button */}
                {canExportCSV && (
                  <div className="flex justify-end items-center px-4 py-2 border-b border-gray-100 bg-gray-50/50">
                    <button
                      onClick={handleDownloadCSV}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                      title="Download as CSV"
                      aria-label="Download data as CSV"
                    >
                      <DownloadSimpleIcon size={14} />
                      <span>Download CSV</span>
                    </button>
                  </div>
                )}
                <div className="flex-1 overflow-auto">
                  <ToolResultRenderer result={toolResult} />
                </div>
              </div>
            )}
            {toolResult.type !== 'memory' && activeTab === 'query' && toolResult.queries && (
              <div className="p-4">
                <div className="space-y-4">
                  {toolResult.queries.map((query, index) => (
                    <div key={index} className="space-y-2">
                      {/* Query label */}
                      {query.label && (
                        <h4 className="text-sm font-semibold text-gray-700">{query.label}</h4>
                      )}
                      {/* Query statement */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap wrap-break-word">
                          {query.statement}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </SidePane>
  );
}
