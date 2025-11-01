import React, { useState } from 'react';
import type { SchemaData, QueryInfo } from './types';

interface SchemaRendererProps {
  schema: SchemaData;
  queries?: QueryInfo[];
}

/**
 * SchemaRenderer Component
 *
 * Displays table schema with columns, data types, and metadata.
 * Shows information in a clean table format.
 */
export const SchemaRenderer: React.FC<SchemaRendererProps> = ({ schema, queries }) => {
  const [showQuery, setShowQuery] = useState(false);

  return (
    <div className="mt-4 space-y-3">
      {/* Table name header */}
      {schema.tableName && (
        <div className="flex flex-row justify-start items-center gap-2">
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Table Schema
          </span>
          <span className="text-sm font-mono text-gray-600">{schema.tableName}</span>
        </div>
      )}

      {/* Schema table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Column
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Type
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schema.columns.map((column, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm font-medium text-gray-900">{column.name}</td>
                <td className="px-4 py-2 text-sm text-gray-600 font-mono">{column.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with query button */}
      {queries && queries.length > 0 && (
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => setShowQuery(!showQuery)}
            className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            📝 {showQuery ? 'Hide' : 'View'} SQL
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

export default SchemaRenderer;
