import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ToolResult, ValueData } from './types';
import { MemoryResultRenderer } from './MemoryResultRenderer';

interface EnhancedResultRendererProps {
  result: ToolResult;
}

export const EnhancedResultRenderer: React.FC<EnhancedResultRendererProps> = ({ result }) => {
  if (!result) return null;

  return (
    <div className="mt-3">
      {result.type === 'table' && <TableResultView result={result} />}
      {result.type === 'values' && <ValuesResultView result={result} />}
      {result.type === 'metrics' && <MetricsResultView result={result} />}
      {result.type === 'memory' && <MemoryResultRenderer result={result} />}
      {result.type === 'json' && <JsonResultView result={result} />}
      {result.type === 'query' && result.queries && (
        <div className="text-xs text-gray-600">Query available</div>
      )}
    </div>
  );
};

// Beautiful values display with progress bars and percentages
const ValuesResultView = ({ result }: { result: ToolResult }) => {
  const [showAll, setShowAll] = useState(false);
  const [showQuery, setShowQuery] = useState(false);

  const values = result.values || [];
  const displayValues = showAll ? values : values.slice(0, 5);
  const hasMore = values.length > 5;

  // Calculate total for percentages
  const total = values.reduce((sum, v) => sum + (v.count || 0), 0);

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
        Top Values
      </div>

      {/* Values list with progress bars */}
      <div className="space-y-1.5">
        {displayValues.map((v: ValueData, i: number) => {
          const percentage = total > 0 ? (v.count / total) * 100 : 0;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative"
            >
              {/* Background bar */}
              <div
                className="absolute inset-0 bg-purple-50 rounded"
                style={{ width: `${percentage}%` }}
              />

              {/* Content */}
              <div className="relative flex justify-between items-center px-3 py-2">
                <span className="text-sm font-medium text-gray-900">{v.value}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{v.count.toLocaleString()} records</span>
                  <span className="text-xs text-gray-500 font-mono min-w-[3rem] text-right">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer controls */}
      <div className="flex items-center gap-3 pt-1">
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-purple-600 hover:text-purple-700 font-medium"
          >
            {showAll ? '▴ Show less' : `▾ +${values.length - 5} more values`}
          </button>
        )}

        {result.queries && result.queries.length > 0 && (
          <button
            onClick={() => setShowQuery(!showQuery)}
            className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            📝 {showQuery ? 'Hide' : 'View'} SQL
          </button>
        )}
      </div>

      {/* SQL Query */}
      <AnimatePresence>
        {showQuery && result.queries && result.queries.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
              <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
                {result.queries[0].statement}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Beautiful table with smart formatting
const TableResultView = ({ result }: { result: ToolResult }) => {
  const [showAll, setShowAll] = useState(false);
  const [showQuery, setShowQuery] = useState(false);

  const table = result.table;
  if (!table) return null;

  const displayRows = showAll ? table.rows : table.rows.slice(0, 5);
  const hasMore = table.rowCount > 5;

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center justify-between">
        <span className="flex items-center gap-2">
          Results: {table.rowCount} {table.rowCount === 1 ? 'row' : 'rows'}
        </span>
        {result.queries && result.queries.length > 0 && (
          <button
            onClick={() => setShowQuery(!showQuery)}
            className="text-xs text-gray-600 hover:text-gray-800 normal-case font-normal"
          >
            {showQuery ? 'Hide' : 'View'} SQL
          </button>
        )}
      </div>

      {/* SQL Query */}
      <AnimatePresence>
        {showQuery && result.queries && result.queries.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
                {result.queries[0].statement}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {table.columns.map((col, i) => (
                <th
                  key={i}
                  className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  {col.display_name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {displayRows.map((row, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="hover:bg-gray-50 transition-colors"
              >
                {table.columns.map((col, j) => (
                  <td key={j} className="px-4 py-2.5 text-sm text-gray-900">
                    {formatCellValue(row[col.name])}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show more button */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-purple-600 hover:text-purple-700 font-medium"
        >
          {showAll ? '▴ Show less' : `↓ View ${table.rowCount - 5} more rows`}
        </button>
      )}
    </div>
  );
};

// Metrics grid
const MetricsResultView = ({ result }: { result: ToolResult }) => {
  if (!result.metrics || result.metrics.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {result.metrics.map((metric, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="bg-purple-50 border border-purple-200 rounded-lg p-3"
        >
          <div className="text-xs text-gray-600 mb-1">{metric.label}</div>
          <div className="text-lg font-semibold text-gray-900">
            {formatMetricValue(metric.value, metric.type)}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// JSON fallback
const JsonResultView = ({ result }: { result: ToolResult }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
      >
        {isExpanded ? '▴' : '▾'} View raw data
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <pre className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 text-xs overflow-auto max-h-96">
              {JSON.stringify(result.raw, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper functions
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') {
    if (value > 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value > 1000) return value.toLocaleString();
    return value.toLocaleString();
  }
  return String(value);
}

function formatMetricValue(value: unknown, type: string): string {
  if (type === 'currency' && typeof value === 'number') {
    return `$${value.toLocaleString()}`;
  }
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return String(value);
}

export default EnhancedResultRenderer;
