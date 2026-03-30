import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ReportTable } from '../../ReportTable';
import type { ServerSortState } from '../../ReportTable';
import type { GridOptions } from '@highcharts/grid-lite-react';
import type { TableWidgetConfig, TablePaginationInfo } from '../types';
import { ServerPagination } from './ServerPagination';
import './table-widget.css';

interface TableWidgetProps {
  config: TableWidgetConfig;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  /** Called when a column header is clicked for server-side sorting */
  onSortChange?: (columnId: string, order: 'asc' | 'desc' | null) => void;
  /** Current server sort state */
  sortState?: ServerSortState | null;
  /** Called when a table body cell is clicked for drilldown */
  onCellClick?: (columnId: string, cellValue: unknown) => void;
}

const TableWidget: React.FC<TableWidgetProps> = ({
  config,
  onPageChange,
  isLoading,
  onSortChange,
  sortState,
  onCellClick,
}) => {
  const { serverPagination } = config;
  const hasServerPagination = !!serverPagination;

  // Keep the last valid gridOptions so the table stays stable during loading.
  // When loading, config.gridOptions may still hold the previous page's data
  // (which is exactly what we want — headers stay, shimmer covers rows).
  const lastOptionsRef = useRef<GridOptions | null>(null);

  const base = config.gridOptions as GridOptions;
  // Only disable client-side pagination for server-paginated tables;
  // non-server-paginated tables keep their existing pagination config.
  const options: GridOptions = hasServerPagination
    ? { ...base, pagination: { enabled: false } }
    : base;

  // Update ref only when NOT loading (i.e. fresh data has arrived)
  if (!isLoading) {
    lastOptionsRef.current = options;
  }

  // Use the last known good options so the grid never flickers
  const stableOptions = lastOptionsRef.current ?? options;

  const handlePageChange = useCallback((page: number) => onPageChange?.(page), [onPageChange]);

  const skeletonRows = serverPagination?.limit ?? 10;
  const containerRef = useRef<HTMLDivElement>(null);
  const [theadHeight, setTheadHeight] = useState(30);

  // Measure the actual thead height once the grid renders.
  // stableOptions is the dependency because a new grid (with potentially
  // different header content) is created whenever options change.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Grid Lite initializes asynchronously, so the thead may not exist yet.
    // Use requestAnimationFrame to measure after the next paint.
    const raf = requestAnimationFrame(() => {
      const thead = el.querySelector('.hcg-table thead');
      if (thead) {
        setTheadHeight(thead.getBoundingClientRect().height);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [stableOptions]);

  // Derive column widths from gridOptions so skeleton aligns with the real table
  const skeletonColWidths = useMemo(() => {
    const cols = (stableOptions as { columns?: Array<{ width?: number }> }).columns;
    if (!cols || cols.length === 0) return null;
    return cols.map((c) => c.width);
  }, [stableOptions]);

  return (
    <div
      className={`h-full w-full table-widget-root flex flex-col${hasServerPagination ? ' server-paginated' : ''}`}
    >
      <div ref={containerRef} className="flex-1 min-h-0 overflow-hidden relative">
        <ReportTable
          options={stableOptions}
          hidePagination
          onSortChange={hasServerPagination ? onSortChange : undefined}
          sortState={hasServerPagination ? sortState : undefined}
          onCellClick={onCellClick}
        />

        {/* Shimmer covers body rows while headers stay visible */}
        {isLoading && (
          <div className="table-skeleton" style={{ top: theadHeight }}>
            <table className="table-skeleton-table">
              {skeletonColWidths && (
                <colgroup>
                  {skeletonColWidths.map((w, j) => (
                    <col key={j} style={w ? { width: `${w}px` } : undefined} />
                  ))}
                </colgroup>
              )}
              <tbody>
                {Array.from({ length: skeletonRows }).map((_, i) => (
                  <tr key={i} className="table-skeleton-row">
                    {(skeletonColWidths ?? Array.from({ length: 6 })).map((_, j) => (
                      <td key={j} className="table-skeleton-td">
                        <div className="table-skeleton-cell" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {hasServerPagination && (
        <ServerPagination
          pagination={serverPagination as TablePaginationInfo}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export { TableWidget };
