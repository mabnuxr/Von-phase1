/**
 * Shared ReportTable types. Extracted from ReportTable.tsx so consumers
 * (storybook, app, sibling components) can import types without pulling in
 * the React component and its CSS imports.
 */
import type { GridOptions } from '@highcharts/grid-lite-react';

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

export type DataSourceType =
  | 'salesforce'
  | 'gong'
  | 'gmail'
  | 'calendar'
  | 'hubspot'
  | 'mixed';

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

/** Convenience type for defining columns at the application layer. */
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

export interface ServerSortState {
  orderBy: string;
  orderByAsc: boolean;
}

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
  /**
   * When provided, Grid Lite's native sort UI is kept but sort changes
   * also trigger this callback so the parent can fetch server-sorted data.
   * `order` is 'asc', 'desc', or null (sort cleared).
   */
  onSortChange?: (columnId: string, order: 'asc' | 'desc' | null) => void;
  /** Current server sort state (reserved for future initial-sort sync) */
  sortState?: ServerSortState | null;
  /** Called when a table body cell is clicked — provides column ID and raw value */
  onCellClick?: (columnId: string, cellValue: unknown) => void;
  /** Disable the built-in truncation tooltip (e.g. when using a custom expand popover) */
  disableTooltip?: boolean;
  /** Compact display mode — smaller fonts and tighter padding (used in dashboard widgets) */
  compact?: boolean;
}
