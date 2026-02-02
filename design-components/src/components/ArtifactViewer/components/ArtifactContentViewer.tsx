import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CaretRightIcon,
  CaretDownIcon,
  CaretLeftIcon,
  DownloadSimpleIcon,
} from '@phosphor-icons/react';
import type { QueryColumn } from '../../TransparencyDrawer/types';
import { formatCellValue } from '../../TransparencyDrawer/utils';
import { useArtifactContent } from '../hooks/useArtifactContent';
import { useDynamicPageSize } from '../hooks/useDynamicPageSize';
import { escapeCsvValue, downloadCSV } from '../../Chat/utils/csvExport';
import { TruncatedTextCell } from '../../ReportTable/CellRenderers';

// ============================================================================
// Types
// ============================================================================

export interface ArtifactContentViewerProps {
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
  /** Error message if query execution failed */
  errorMessage?: string;
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
 * - Dynamic pagination based on viewport height
 * - Type-specific column formatting (currency, percentage, date, number)
 * - Sticky table headers
 * - Deep link rendering for Salesforce records
 *
 * Used by:
 * - TransparencyDrawer (QueryContent)
 * - SingleArtifactDrawer (for thinking process steps)
 */
export const ArtifactContentViewer = React.memo<ArtifactContentViewerProps>(
  ({ query, columns, rows, duration, isLoading, errorMessage }) => {
    // Calculate dynamic rows per page based on container height
    const { rowsPerPage, containerRef } = useDynamicPageSize({
      // Add extra overhead when query section exists (collapsed state)
      additionalOverhead: query ? 60 : 0,
    });

    // Handle CSV download - exports ALL rows, not just current page
    const handleDownloadCSV = useCallback(() => {
      if (columns.length === 0 || rows.length === 0) return;

      // Build CSV header using column labels
      const header = columns.map((col) => escapeCsvValue(col.label)).join(',');

      // Build CSV data rows using column keys
      const dataRows = rows.map((row) =>
        columns.map((col) => escapeCsvValue(row[col.key])).join(',')
      );

      const csvContent = [header, ...dataRows].join('\n');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
      const filename = `data_export_${timestamp}.csv`;

      downloadCSV(csvContent, filename);
    }, [columns, rows]);

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
    } = useArtifactContent(rows, rowsPerPage);

    // Show loading skeleton
    if (isLoading) {
      return <LoadingSkeleton />;
    }

    // Check if there's no data
    const hasNoData = columns.length === 0 || rows.length === 0;

    return (
      <div ref={containerRef} className="flex flex-col h-full min-h-0">
        {/* SQL Query Section - Collapsible, collapsed by default */}
        {query && (
          <div className="mx-4 mt-4 mb-3 rounded-lg border border-gray-200 overflow-hidden shrink-0 flex flex-col max-h-[40%]">
            <button
              onClick={toggleQueryExpanded}
              className="w-full px-3 py-2 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
            >
              <div className="flex items-center gap-2">
                {isQueryExpanded ? (
                  <CaretDownIcon size={12} weight="bold" className="text-gray-500" />
                ) : (
                  <CaretRightIcon size={12} weight="bold" className="text-gray-500" />
                )}
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Query
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
                  className="overflow-y-auto border-t border-gray-200 min-h-0"
                >
                  <pre className="px-3 py-3 text-xs text-gray-800 font-mono bg-white overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {query}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Data Table, Error State, or Empty State */}
        {hasNoData ? (
          <div className="flex-1 flex flex-col items-center justify-center mx-4 border border-gray-200 rounded-lg p-6">
            {errorMessage ? (
              <>
                <svg
                  className="w-10 h-10 text-amber-500 mb-3"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                  <path
                    d="M12 8v4M12 16h.01"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <p className="text-sm font-medium text-gray-700 mb-1">Query failed</p>
                <p className="text-xs text-gray-500 text-center max-w-xs mb-2">{errorMessage}</p>
                <p className="text-xs text-gray-400 text-center">
                  Agent will attempt to correct and re-run the query.
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">No content found</p>
            )}
          </div>
        ) : (
          <>
            {/* Table Header with Download Button */}
            <div className="px-4 pb-2 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-gray-500">
                {totalRows} {totalRows === 1 ? 'row' : 'rows'}
              </span>
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-1 px-2 py-1 text-[11px] text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                title="Download as CSV"
              >
                <DownloadSimpleIcon size={12} />
                <span>CSV</span>
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto mx-4 border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap bg-gray-50 ${
                          col.type === 'number' ||
                          col.type === 'currency' ||
                          col.type === 'percentage'
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
                      {columns.map((col) => {
                        const isNumeric =
                          col.type === 'number' ||
                          col.type === 'currency' ||
                          col.type === 'percentage';
                        const isDeepLink = col.key === 'deep_link';

                        // For numeric and deep_link columns, render without truncation
                        if (isNumeric || isDeepLink) {
                          return (
                            <td
                              key={col.key}
                              className={`px-3 py-2 text-sm whitespace-nowrap ${
                                isNumeric ? 'text-right tabular-nums' : 'text-left'
                              } text-gray-700`}
                            >
                              {formatCellValue(col.key, row[col.key], col.type)}
                            </td>
                          );
                        }

                        // For text columns, use TruncatedTextCell with max width and tooltip
                        return (
                          <td key={col.key} className="px-3 py-2 text-sm text-left text-gray-700">
                            <TruncatedTextCell
                              value={row[col.key]}
                              maxWidth={200}
                              className="text-gray-700"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-4 py-3 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-gray-500">
                Showing {startIndex + 1}–{endIndex} of {totalRows}{' '}
                {totalRows === 1 ? 'row' : 'rows'}
              </span>
              {/* Pagination Controls */}
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
          </>
        )}
      </div>
    );
  }
);

ArtifactContentViewer.displayName = 'ArtifactContentViewer';
