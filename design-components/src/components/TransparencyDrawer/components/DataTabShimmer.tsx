import React from 'react';

/**
 * DataTabShimmer - Loading skeleton for the Data tab
 *
 * Displays a shimmer animation that mimics the structure of:
 * - Query pill navigation
 * - SQL section
 * - Query info row
 * - Data table with rows
 * - Pagination
 */
export const DataTabShimmer: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Shimmer for Query Pills */}
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-7 bg-gray-200 rounded-full animate-pulse"
              style={{ width: `${60 + i * 20}px` }}
            />
          ))}
        </div>
      </div>

      {/* Shimmer for SQL Section */}
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
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Shimmer for Pagination */}
      <div className="px-4 py-3">
        <div className="w-32 h-3 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
};

DataTabShimmer.displayName = 'DataTabShimmer';
