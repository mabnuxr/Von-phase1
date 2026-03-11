import { useMemo } from 'react';
import { Grid, type GridOptions } from '@highcharts/grid-lite-react';
import '@highcharts/grid-lite/css/grid-lite.css';
import './report-grid-theme.css';

// ============================================================================
// Types (kept for backward compatibility - used by consumers & other components)
// ============================================================================

export type ColumnType =
  | 'text'
  | 'number'
  | 'currency'
  | 'percentage'
  | 'date'
  | 'boolean'
  | 'email'
  | 'phone'
  | 'url'
  | 'picklist'
  | 'owner'
  | 'multiPicklist'
  | 'sentiment'
  | 'longText';

export type DataSourceType = 'salesforce' | 'gong' | 'gmail' | 'calendar' | 'hubspot' | 'mixed';

export interface SourceReference {
  type: DataSourceType;
  label: string;
  url?: string;
}

export interface AIReasoningData {
  reasoning: string;
  confidence?: number;
  sources?: string[];
  sourceReferences?: SourceReference[];
  recordName?: string;
}

// ============================================================================
// ReportColumn type - convenience type for defining columns
// ============================================================================

export interface ReportColumn {
  id: string;
  label: string;
  type: ColumnType;
  isAI?: boolean;
  sortable?: boolean;
  width?: number;
  minWidth?: number;
  source?: DataSourceType;
  aiPrompt?: string;
  aiDataSources?: string[];
}

// ============================================================================
// Props
// ============================================================================

export interface ReportTableProps {
  /** Highcharts Grid Lite options - primary configuration */
  options: GridOptions;
  /** Additional CSS class for the wrapper */
  className?: string;
  /** Show loading skeleton */
  isLoading?: boolean;
  /** Message when data is empty */
  emptyMessage?: string;
  /** Hide the pagination UI while still limiting rows via pageSize */
  hidePagination?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export function ReportTable({
  options,
  className = '',
  isLoading = false,
  emptyMessage = 'No data available',
  hidePagination = false,
}: ReportTableProps) {
  // Check if data is empty
  const isEmpty = useMemo(() => {
    const dt = options.dataTable;
    if (!dt) return true;
    if (typeof dt === 'object' && 'columns' in dt) {
      const cols = (dt as { columns?: Record<string, unknown[]> }).columns;
      if (!cols) return true;
      const firstCol = Object.values(cols)[0];
      return !firstCol || firstCol.length === 0;
    }
    return false;
  }, [options.dataTable]);

  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-50 rounded-t-lg" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 border-b border-gray-100 flex items-center px-4">
              <div className="h-4 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center justify-center py-12 text-sm text-gray-700">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full flex flex-col h-full report-grid-wrapper ${hidePagination ? 'report-grid-no-pagination' : ''} ${className}`}
    >
      <Grid options={options} />
    </div>
  );
}

export default ReportTable;
