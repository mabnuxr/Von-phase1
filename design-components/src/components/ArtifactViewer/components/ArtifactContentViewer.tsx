import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  CaretRightIcon,
  CaretDownIcon,
  CaretLeftIcon,
} from '@phosphor-icons/react';
import type { QueryColumn } from '../../TransparencyDrawer/types';
import { formatValue } from '../../TransparencyDrawer/utils';
import { useArtifactContent } from '../hooks/useArtifactContent';

// ============================================================================
// Types
// ============================================================================

export interface ArtifactContentViewerProps {
  /** Unique identifier for the artifact */
  id: string;
  /** Display name for the artifact */
  name: string;
  /** Optional description */
  description?: string;
  /** SQL query string (if applicable) */
  query?: string;
  /** Column definitions for the data table */
  columns: QueryColumn[];
  /** Data rows */
  rows: Record<string, string | number>[];
  /** Query execution duration in ms */
  duration?: number;
  /** Whether the content is still loading */
  isLoading?: boolean;
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Shimmer for SQL Query Section */}
      <div className="mx-4 mt-4 mb-3 rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-3 py-2 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 rounded animate-pulse" />
            <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-10 h-3 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Shimmer for Query Info */}
      <div className="px-4 pb-2 flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse" />
        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
        <div className="w-32 h-3 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Shimmer for Data Table */}
      <div className="flex-1 overflow-hidden mx-4 border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[1, 2, 3, 4].map((i) => (
                <th key={i} className="px-3 py-2">
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((row) => (
              <tr key={row} className="border-b border-gray-100">
                {[1, 2, 3, 4].map((col) => (
                  <td key={col} className="px-3 py-2">
                    <div
                      className="h-3 bg-gray-200 rounded animate-pulse"
                      style={{ width: `${Math.random() * 40 + 40}%` }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Shimmer for Pagination Footer */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="w-32 h-3 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

/**
 * ArtifactContentViewer - Shared component for displaying artifact content
 *
 * Features:
 * - Collapsible SQL query section with duration
 * - Data table with type-aware formatting
 * - Pagination (10 rows per page)
 * - Type-specific column formatting (currency, percentage, date, number)
 * - Sticky table headers
 *
 * Used by:
 * - TransparencyDrawer (QueryContent)
 * - SingleArtifactDrawer (for thinking process steps)
 */
export const ArtifactContentViewer = React.memo<ArtifactContentViewerProps>(
  ({ name, description, query, columns, rows, duration, isLoading }) => {
    const {
      isQueryExpanded,
      toggleQueryExpanded,
      currentPage,
      totalPages,
      startIndex,
      endIndex,
      goToNextPage,
      goToPrevPage,
      currentRows,
      totalRows,
    } = useArtifactContent(rows);

    // Show loading skeleton
    if (isLoading) {
      return <LoadingSkeleton />;
    }

    // Show empty state if no columns
    if (columns.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          <p className="text-sm text-gray-500">No data available</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* SQL Query Section - Collapsible, collapsed by default */}
        {query && (
          <div className="mx-4 mt-4 mb-3 rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={toggleQueryExpanded}
              className="w-full px-3 py-2 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {isQueryExpanded ? (
                  <CaretDownIcon size={12} weight="bold" className="text-gray-500" />
                ) : (
                  <CaretRightIcon size={12} weight="bold" className="text-gray-500" />
                )}
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                  SQL Query
                </span>
              </div>
              {duration && (
                <span className="text-[11px] text-gray-500 tabular-nums">{duration}ms</span>
              )}
            </button>
            <AnimatePresence>
              {isQueryExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden border-t border-gray-200"
                >
                  <pre className="px-3 py-3 text-xs text-gray-800 font-mono bg-white overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {query}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Query Info */}
        <div className="px-4 pb-2 flex items-center gap-2">
          <CheckCircleIcon size={14} weight="fill" className="text-emerald-600" />
          <span className="text-[13px] font-medium text-gray-900">{name}</span>
          {description && <span className="text-[11px] text-gray-500">— {description}</span>}
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto mx-4 border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 border-b border-gray-200">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap bg-gray-50 ${
                      col.type === 'number' || col.type === 'currency' || col.type === 'percentage'
                        ? 'text-right'
                        : ''
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentRows.map((row, rowIndex) => (
                <tr
                  key={startIndex + rowIndex}
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 py-2 text-[13px] whitespace-nowrap ${
                        col.type === 'number' ||
                        col.type === 'currency' ||
                        col.type === 'percentage'
                          ? 'text-right tabular-nums'
                          : 'text-left'
                      } text-gray-700`}
                    >
                      {formatValue(row[col.key], col.type)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">
            Showing {startIndex + 1}–{endIndex} of {totalRows} {totalRows === 1 ? 'row' : 'rows'}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <CaretLeftIcon size={14} weight="bold" />
              </button>
              <span className="text-[11px] text-gray-600 px-2 tabular-nums">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <CaretRightIcon size={14} weight="bold" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ArtifactContentViewer.displayName = 'ArtifactContentViewer';
