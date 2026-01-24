import React, { useState } from 'react';
import { DataTable } from './DataTable';
import { QueryBlock } from './QueryBlock';
import { JsonBlock } from './JsonBlock';
import { MetricsGrid } from './MetricsGrid';
import { SchemaRenderer } from './SchemaRenderer';
import { StatisticsRenderer } from './StatisticsRenderer';
import { TableListRenderer } from './TableListRenderer';
import { ValuesRenderer } from './ValuesRenderer';
import { MemoryResultRenderer } from './MemoryResultRenderer';
import { CallSearchUnionRenderer } from './CallSearchUnionRenderer';
import { ConversationSearchRenderer } from './ConversationSearchRenderer';
import type { ToolResult } from './types';

export interface ToolResultRendererProps {
  /**
   * Tool result to render
   */
  result: ToolResult;

  /**
   * Enable deep links for Salesforce URLs in DataTable
   * When enabled, URLs are rendered as clickable links
   * @default false
   */
  enableDeepLinks?: boolean;
}

/**
 * ToolResultRenderer intelligently renders tool results based on their type
 * Routes to appropriate visualization component (Table, Query, Metrics, or JSON)
 */
export const ToolResultRenderer: React.FC<ToolResultRendererProps> = ({
  result,
  enableDeepLinks = false,
}) => {
  const [showQuery, setShowQuery] = useState(false);

  if (!result) {
    return null;
  }

  switch (result.type) {
    case 'table':
      // Render table with optional query
      return (
        <div>
          {result.table && (
            <DataTable
              data={result.table}
              queries={result.queries}
              onViewQuery={result.queries ? () => setShowQuery(!showQuery) : undefined}
              enableDeepLinks={enableDeepLinks}
            />
          )}
          {showQuery && result.queries && <QueryBlock queries={result.queries} />}
        </div>
      );

    case 'query':
      // Render queries only
      return result.queries ? <QueryBlock queries={result.queries} /> : null;

    case 'metrics':
      // Render metrics grid
      return result.metrics ? <MetricsGrid metrics={result.metrics} /> : null;

    case 'values':
      // Render values with progress bars
      return result.values ? (
        <ValuesRenderer values={result.values} queries={result.queries} />
      ) : null;

    case 'schema':
      // Render table schema
      return result.schema ? (
        <SchemaRenderer schema={result.schema} queries={result.queries} />
      ) : null;

    case 'statistics':
      // Render statistics in metric cards
      return result.statistics ? (
        <StatisticsRenderer statistics={result.statistics} queries={result.queries} />
      ) : null;

    case 'table_list':
      // Render list of tables
      return result.tables ? (
        <TableListRenderer tables={result.tables} queries={result.queries} />
      ) : null;

    case 'memory':
      // Render memory operation results
      return <MemoryResultRenderer result={result} />;

    case 'call_search_union':
      // Render comprehensive call search results
      return result.callSearchUnion ? (
        <CallSearchUnionRenderer
          result={result.callSearchUnion}
          enableDeepLinks={enableDeepLinks}
        />
      ) : null;

    case 'consolidated_conversation_search':
      // Render consolidated conversation search results (calls + emails with queries)
      return <ConversationSearchRenderer result={result.raw} />;

    case 'json':
    default:
      // Fallback to JSON viewer
      return <JsonBlock data={result.raw} />;
  }
};

export default ToolResultRenderer;
