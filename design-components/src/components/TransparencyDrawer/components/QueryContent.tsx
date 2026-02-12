import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CaretRightIcon,
  CaretDownIcon,
  CaretLeftIcon,
  DownloadSimpleIcon,
} from '@phosphor-icons/react';
import type { QueryContentProps } from '../types';
import { useQueryPagination, useDynamicPageSize } from '../hooks';
import { formatValue, renderLinkedId } from '../utils';
import { escapeCsvValue, downloadCSV } from '../../Chat/utils/csvExport';
import { TruncatedTextCell } from '../../ReportTable/CellRenderers';

// ============================================================================
// Component
// ============================================================================

/**
 * QueryContent - Displays query results with pagination
 *
 * Features:
 * - Collapsible SQL query section with duration
 * - Data table with type-aware formatting
 * - Dynamic pagination based on viewport height
 * - Type-specific column formatting (currency, percentage, date, number)
 * - Sticky table headers
 */
export const QueryContent = React.memo<QueryContentProps>(({ query }) => {
  const [isQueryExpanded, setIsQueryExpanded] = useState(false);

  // Calculate dynamic rows per page based on container height
  const { rowsPerPage, containerRef } = useDynamicPageSize({
    // Add extra overhead when query section exists (collapsed state)
    additionalOverhead: query.query ? 60 : 0,
  });

  const { currentPage, totalPages, startIndex, endIndex, goToNextPage, goToPrevPage } =
    useQueryPagination(query.rows.length, rowsPerPage);

  const currentRows = useMemo(
    () => query.rows.slice(startIndex, endIndex),
    [query.rows, startIndex, endIndex]
  );

  const toggleQueryExpanded = useCallback(() => setIsQueryExpanded((prev) => !prev), []);

  // Handle CSV download - exports ALL rows, not just current page
  const handleDownloadCSV = useCallback(() => {
    if (query.columns.length === 0 || query.rows.length === 0) return;

    // Build CSV header using column labels
    const header = query.columns.map((col) => escapeCsvValue(col.label)).join(',');

    // Build CSV data rows using column keys
    const dataRows = query.rows.map((row) =>
      query.columns.map((col) => escapeCsvValue(row[col.key])).join(',')
    );

    const csvContent = [header, ...dataRows].join('\n');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    const filename = `query_export_${timestamp}.csv`;

    downloadCSV(csvContent, filename);
  }, [query.columns, query.rows]);

  const totalRows = query.rows.length;

  // Check if content is still loading (empty columns/rows with "Loading..." description)
  const isContentLoading = query.columns.length === 0 && query.description?.includes('Loading');

  // Check if there's no columns at all (no schema)
  const hasNoColumns = query.columns.length === 0 && !isContentLoading;
  // Check if there are columns but no rows (empty result set)
  const hasEmptyRows = query.columns.length > 0 && query.rows.length === 0;

  // Show shimmer loading state for lazy-loaded content
  if (isContentLoading) {
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

  return (
    <div ref={containerRef} className="flex flex-col h-full min-h-0">
      {/* SQL Query Section - Collapsible, collapsed by default */}
      {query.query && (
        <div className="mx-4 mt-4 rounded-lg border border-gray-200 overflow-hidden shrink-0 flex flex-col max-h-[40%]">
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
                SQL Query
              </span>
            </div>
            {query.duration && (
              <span className="text-[11px] text-gray-500 tabular-nums">{query.duration}ms</span>
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
                  {query.query}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* No columns at all - show generic empty state */}
      {hasNoColumns ? (
        <div className="flex-1 flex items-center justify-center mx-4 mt-4 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500">No content found</p>
        </div>
      ) : (
        <>
          <div className="flex-1 min-h-0 overflow-auto mx-4 border border-gray-200 rounded-lg mt-4">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 border-b border-gray-200">
                  {query.columns.map((col) => (
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
                {hasEmptyRows ? (
                  <tr>
                    <td
                      colSpan={query.columns.length}
                      className="px-3 py-8 text-center text-sm text-gray-500"
                    >
                      No results returned
                    </td>
                  </tr>
                ) : (
                  currentRows.map((row, rowIndex) => (
                    <tr
                      key={startIndex + rowIndex}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors"
                    >
                      {query.columns.map((col) => {
                        const isNumeric =
                          col.type === 'number' ||
                          col.type === 'currency' ||
                          col.type === 'percentage';

                        // Linked column (e.g. ID with deep link) — render as clickable link
                        if (col.linkKey) {
                          return (
                            <td
                              key={col.key}
                              className="px-3 py-2 text-sm whitespace-nowrap text-left text-gray-700"
                            >
                              {renderLinkedId(row[col.key], row[col.linkKey])}
                            </td>
                          );
                        }

                        // For numeric columns, render without truncation
                        if (isNumeric) {
                          return (
                            <td
                              key={col.key}
                              className="px-3 py-2 text-sm whitespace-nowrap text-right tabular-nums text-gray-700"
                            >
                              {formatValue(row[col.key], col.type)}
                            </td>
                          );
                        }

                        // For text columns, use TruncatedTextCell with formatted value
                        return (
                          <td key={col.key} className="px-3 py-2 text-sm text-left text-gray-700">
                            <TruncatedTextCell
                              value={formatValue(row[col.key], col.type)}
                              maxWidth={200}
                              className="text-gray-700"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-4 py-3 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-gray-500">
              {hasEmptyRows
                ? '0 rows'
                : `Showing ${startIndex + 1}–${endIndex} of ${totalRows} ${totalRows === 1 ? 'row' : 'rows'}`}
            </span>
            <div className="flex items-center gap-2">
              {!hasEmptyRows && (
                <button
                  onClick={handleDownloadCSV}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                  title="Download as CSV"
                >
                  <DownloadSimpleIcon size={12} />
                  <span>CSV</span>
                </button>
              )}
              {/* Pagination Controls */}
              {totalPages > 1 && !hasEmptyRows && (
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
        </>
      )}
    </div>
  );
});

QueryContent.displayName = 'QueryContent';
