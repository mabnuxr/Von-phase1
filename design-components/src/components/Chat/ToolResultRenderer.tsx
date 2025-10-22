import React, { useState } from 'react';
import { DataTable } from './DataTable';
import { QueryBlock } from './QueryBlock';
import { JsonBlock } from './JsonBlock';
import { MetricsGrid } from './MetricsGrid';
import type { ToolResult } from './types';

export interface ToolResultRendererProps {
  /**
   * Tool result to render
   */
  result: ToolResult;
}

/**
 * ToolResultRenderer intelligently renders tool results based on their type
 * Routes to appropriate visualization component (Table, Query, Metrics, or JSON)
 */
export const ToolResultRenderer: React.FC<ToolResultRendererProps> = ({ result }) => {
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

    case 'json':
    default:
      // Fallback to JSON viewer
      return <JsonBlock data={result.raw} />;
  }
};

export default ToolResultRenderer;
