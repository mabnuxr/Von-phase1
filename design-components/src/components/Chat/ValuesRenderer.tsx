import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { ValueData, QueryInfo } from './types';

interface ValuesRendererProps {
  values: ValueData[];
  queries?: QueryInfo[];
}

/**
 * ValuesRenderer Component
 *
 * Displays distinct values with their counts in a beautiful progress bar format.
 * Shows percentages and allows expanding to see all values.
 */
export const ValuesRenderer: React.FC<ValuesRendererProps> = ({ values }) => {
  const [showAll, setShowAll] = useState(true);

  const displayValues = showAll ? values : values.slice(0, 5);
  const hasMore = values.length > 5;

  // Calculate total for percentages
  const total = values.reduce((sum, v) => sum + (v.count || 0), 0);

  return (
    <div className="mt-4 space-y-2">
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
      </div>
    </div>
  );
};

export default ValuesRenderer;
