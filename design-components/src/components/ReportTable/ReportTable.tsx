import { useMemo, useRef } from 'react';
import { Grid } from '@highcharts/grid-lite-react';
import { getDataTableColumns } from './reportTableUtils';
import { SourcePopover } from './SourcePopover';
import '@highcharts/grid-lite/css/grid-lite.css';
import './report-grid-theme.css';
import './markdown-cell.css';

import type { ReportTableProps } from './types';
import { ColumnWidthProbe } from './components/ColumnWidthProbe';
import { TruncationTooltip } from './components/TruncationTooltip';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { EmptyState } from './components/EmptyState';
import { useColumnWidthMeasurement } from './hooks/useColumnWidthMeasurement';
import { useTruncationTooltip } from './hooks/useTruncationTooltip';
import { useServerSortBridge } from './hooks/useServerSortBridge';
import { useCellInteractions } from './hooks/useCellInteractions';

// Public API — re-exported from types.ts so importers don't break.
export type {
  ColumnType,
  DataSourceType,
  SourceReference,
  AIReasoningData,
  ReportColumn,
  ServerSortState,
  ReportTableProps,
} from './types';

/**
 * Tabular data view backed by Highcharts Grid Lite, with VonLabs-specific
 * affordances stitched on top:
 *   - Hidden probe-table column-width measurement (see useColumnWidthMeasurement)
 *   - Hover tooltip for truncated cell content (see useTruncationTooltip)
 *   - Server-sort bridging (see useServerSortBridge)
 *   - Cell-click + AI reasoning popover (see useCellInteractions)
 *   - Loading and empty placeholder states
 *
 * Each affordance lives in its own hook/component so changes stay scoped:
 * adjusting tooltip behavior touches only the tooltip files, etc.
 */
export function ReportTable({
  options,
  className = '',
  isLoading = false,
  emptyMessage = 'No data available',
  hidePagination = false,
  onSortChange,
  sortState,
  onCellClick,
  disableTooltip = false,
  compact = false,
}: ReportTableProps) {
  void sortState; // reserved for future initial-sort sync

  const wrapperRef = useRef<HTMLDivElement>(null);

  const { probeRef, probeColumns, sizedOptions, isMeasured } = useColumnWidthMeasurement(
    options,
    wrapperRef
  );

  const tooltip = useTruncationTooltip(wrapperRef, disableTooltip);
  const sortBridge = useServerSortBridge(onSortChange);
  const cellInteractions = useCellInteractions(options, onCellClick);

  // Empty if the data table has no rows in its first column.
  const isEmpty = useMemo(() => {
    const cols = getDataTableColumns(sizedOptions);
    if (!cols) return true;
    const firstCol = Object.values(cols)[0];
    return !firstCol || firstCol.length === 0;
  }, [sizedOptions]);

  if (isLoading) {
    return <LoadingSkeleton className={className} />;
  }

  if (isEmpty) {
    return <EmptyState message={emptyMessage} className={className} />;
  }

  const wrapperClasses = [
    'w-full flex flex-col h-full relative report-grid-wrapper highcharts-light',
    compact ? 'report-grid-compact' : '',
    hidePagination ? 'report-grid-no-pagination' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={wrapperRef}
      className={wrapperClasses}
      onClick={cellInteractions.onWrapperClick}
      onMouseOver={tooltip.onMouseEnter}
      onMouseOut={tooltip.onMouseLeave}
    >
      {probeColumns && <ColumnWidthProbe ref={probeRef} columns={probeColumns} />}

      {/* Defer rendering Grid Lite until widths are known so the user
          never sees an unsized initial state. */}
      {isMeasured && (
        <Grid
          options={sizedOptions}
          callback={onSortChange ? sortBridge.handleGridReady : undefined}
        />
      )}

      {cellInteractions.aiReasoningPopover && (
        <SourcePopover
          reasoning={cellInteractions.aiReasoningPopover.reasoning}
          position={cellInteractions.aiReasoningPopover.position}
          onClose={cellInteractions.closeAIReasoningPopover}
        />
      )}

      <TruncationTooltip state={tooltip.tooltip} />
    </div>
  );
}

export default ReportTable;
