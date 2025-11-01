import React, { useState } from 'react';
import type { StatisticsData, QueryInfo } from './types';
import type { ComponentType } from 'react';
import type { IconProps } from './icons';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalculatorIcon,
  HashIcon,
  PlusIcon,
  BarChartIcon,
} from './icons';

interface StatisticsRendererProps {
  statistics: StatisticsData;
  queries?: QueryInfo[];
}

/**
 * StatisticsRenderer Component
 *
 * Displays statistical metrics (min, max, avg, count, etc.) in a card grid format.
 * Similar to MetricsGrid but specifically for numeric statistics.
 */
export const StatisticsRenderer: React.FC<StatisticsRendererProps> = ({ statistics, queries }) => {
  const [showQuery, setShowQuery] = useState(false);

  // Convert statistics object to array for rendering
  const statEntries = Object.entries(statistics).map(([key, value]) => ({
    label: formatStatLabel(key),
    value: formatStatValue(value),
    IconComponent: getStatIcon(key),
  }));

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Statistics</div>

      {/* Statistics grid */}
      <div className="grid grid-cols-2 gap-3">
        {statEntries.map((stat, index) => {
          const IconComponent = stat.IconComponent;
          return (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="text-blue-600">
                <IconComponent size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-600 uppercase tracking-wide">{stat.label}</div>
                <div className="text-lg font-semibold text-gray-900 truncate">{stat.value}</div>
              </div>
            </div>
          );
        })}
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

/**
 * Format statistic label for display
 */
function formatStatLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Format statistic value for display
 */
function formatStatValue(value: string | number | null): string {
  if (value === null) return 'N/A';
  if (typeof value === 'number') {
    // Format numbers with commas
    return value.toLocaleString();
  }
  return String(value);
}

/**
 * Get icon component for statistic type
 */
function getStatIcon(key: string): ComponentType<IconProps> {
  const lowerKey = key.toLowerCase();

  if (lowerKey.includes('min')) return ArrowDownIcon;
  if (lowerKey.includes('max')) return ArrowUpIcon;
  if (lowerKey.includes('avg') || lowerKey.includes('mean')) return CalculatorIcon;
  if (lowerKey.includes('count')) return HashIcon;
  if (lowerKey.includes('sum')) return PlusIcon;
  if (lowerKey.includes('std') || lowerKey.includes('deviation')) return BarChartIcon;

  return BarChartIcon; // Default icon for statistics
}

export default StatisticsRenderer;
