import React, { useState } from 'react';
import type { QueryInfo } from './types';
import { DatabaseIcon, EditIcon } from './icons';

interface TableListRendererProps {
  tables: string[];
  queries?: QueryInfo[];
}

/**
 * TableListRenderer Component
 *
 * Displays a list of database tables or materialized views.
 * Shows tables in a clean, organized format with counts.
 */
export const TableListRenderer: React.FC<TableListRendererProps> = ({ tables, queries }) => {
  const [showQuery, setShowQuery] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          Available Tables
        </div>
        <div className="text-xs text-gray-500 font-medium">
          {tables.length} {tables.length === 1 ? 'table' : 'tables'}
        </div>
      </div>

      {/* Tables list */}
      <div className="space-y-1.5">
        {tables.map((table, index) => (
          <div
            key={index}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <div className="text-gray-400">
              <DatabaseIcon size={16} />
            </div>
            <span className="text-sm font-mono text-gray-900">{table}</span>
          </div>
        ))}
      </div>

      {/* Footer with query button */}
      {queries && queries.length > 0 && (
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => setShowQuery(!showQuery)}
            className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1.5"
          >
            <EditIcon size={14} />
            <span>{showQuery ? 'Hide' : 'View'} SQL</span>
          </button>
        </div>
      )}

      {/* SQL Query */}
      {showQuery && queries && queries.length > 0 && (
        <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
          <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
            {queries[0].statement}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TableListRenderer;
