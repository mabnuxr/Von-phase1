import React from 'react';
import { Panel } from 'rsuite';
import { DollarSignIcon, HashIcon, TrendingUpIcon, DatabaseIcon } from './icons';
import type { MetricData } from './types';

export interface MetricsGridProps {
  /**
   * Metrics to display
   */
  metrics: MetricData[];
}

/**
 * Format metric values appropriately
 */
function formatMetricValue(value: number | string, type: MetricData['type']): string {
  if (typeof value === 'string') {
    return value;
  }

  switch (type) {
    case 'currency':
      if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
      if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
      if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
      return `$${value.toLocaleString()}`;

    case 'count':
      if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
      if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
      if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
      return value.toLocaleString();

    case 'trend':
      return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

    default:
      return String(value);
  }
}

/**
 * Get appropriate icon for metric type
 */
function MetricIcon({
  type,
  className,
}: {
  type: MetricData['type'];
  className?: string;
}) {
  const iconClass = className || 'w-4 h-4';

  switch (type) {
    case 'currency':
      return <DollarSignIcon className={iconClass} />;
    case 'count':
      return <HashIcon className={iconClass} />;
    case 'trend':
      return <TrendingUpIcon className={iconClass} />;
    default:
      return <DatabaseIcon className={iconClass} />;
  }
}

/**
 * MetricsGrid component for displaying key metrics in a compact grid
 * Uses rsuite Panel for beautiful card layout
 */
export const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics }) => {
  if (!metrics || metrics.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 my-3">
      {metrics.map((metric, idx) => (
        <Panel
          key={idx}
          bordered
          className="p-3 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="p-2 rounded-lg bg-blue-50 flex-shrink-0">
              <MetricIcon type={metric.type} className="w-4 h-4 text-blue-600" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 mb-1 truncate" title={metric.label}>
                {metric.label}
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {formatMetricValue(metric.value, metric.type)}
              </div>
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
};

export default MetricsGrid;
