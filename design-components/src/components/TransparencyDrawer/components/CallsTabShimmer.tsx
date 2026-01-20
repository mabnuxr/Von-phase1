import React from 'react';

/**
 * CallsTabShimmer - Loading skeleton for the Calls tab
 *
 * Displays a shimmer animation that mimics the structure of:
 * - Month header
 * - Timeline with call items
 * - Expanded call details (for first item)
 */
export const CallsTabShimmer: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      {/* Month Header Shimmer */}
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-8 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Timeline Items Shimmer */}
      <div className="relative">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="relative flex gap-3 mb-4">
            {/* Timeline icon */}
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse" />
              {i < 4 && <div className="w-px flex-1 bg-gray-200 min-h-[16px]" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-4 flex-1 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
              {i === 1 && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
                  <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
                  <div className="pt-2 mt-2 border-t border-gray-200 space-y-1">
                    <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

CallsTabShimmer.displayName = 'CallsTabShimmer';
