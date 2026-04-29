import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  ReportTable,
  LongTextPopover,
  markdownCellFormatter,
  handleMarkdownCellHover,
  createMarkdownCellClickHandler,
} from '../../ReportTable';
import type { ServerSortState, ExpandPopoverState } from '../../ReportTable';
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

/** Identify text column ids by checking data values */
function findTextColumnIds(options: GridOptions): Set<string> {
  const ids = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opts = options as any;
  // Grid Lite supports both `data.columns` (new) and `dataTable.columns` (legacy)
  const dataCols: Record<string, unknown[]> | undefined =
    opts.data?.columns ?? opts.dataTable?.columns;
  if (!dataCols) return ids;
  for (const [colId, values] of Object.entries(dataCols)) {
    if (colId.startsWith('_')) continue; // skip internal columns
    if (!Array.isArray(values)) continue;
    const first = values.find((v) => v != null);
    if (typeof first === 'string') ids.add(colId);
  }
  return ids;
}

// Auto-assign markdownCellFormatter to text columns. Existing per-column
// formatters or formats (backend- or config-supplied) win — Grid Lite
// returns an empty cell when BOTH `cells.format` and `cells.formatter` are
// non-default, so we must leave columns that already carry a `format`
// template untouched. Disabled columns are also skipped since they don't
// render at all.
function applyMarkdownCellFormatters(options: GridOptions): GridOptions {
  const textIds = findTextColumnIds(options);
  if (textIds.size === 0) return options;
  const cols = options.columns;
  if (!cols) return options;
  return {
    ...options,
    columns: cols.map((col) => {
      if (!textIds.has(col.id)) return col;
      if (col.enabled === false) return col;
      if (col.cells?.formatter) return col;
      if (col.cells?.format) return col; // backend template (e.g. <a> link)
      return { ...col, cells: { ...col.cells, formatter: markdownCellFormatter } };
    }),
  };
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
  const [popover, setPopover] = useState<ExpandPopoverState | null>(null);

  // Keep the last valid gridOptions so the table stays stable during loading.
  // When loading, config.gridOptions may still hold the previous page's data
  // (which is exactly what we want — headers stay, shimmer covers rows).
  const lastOptionsRef = useRef<GridOptions | null>(null);

  const base = config.gridOptions as GridOptions;
  // Memoized so popover open/close (setPopover → re-render) doesn't rebuild
  // the columns array and force Grid Lite to re-run every markdown formatter.
  const options = useMemo<GridOptions>(
    () =>
      applyMarkdownCellFormatters(
        hasServerPagination ? { ...base, pagination: { enabled: false } } : base
      ),
    [base, hasServerPagination]
  );

  // Update ref only when NOT loading (i.e. fresh data has arrived)
  if (!isLoading) {
    lastOptionsRef.current = options;
  }

  // Use the last known good options so the grid never flickers
  const stableOptions = lastOptionsRef.current ?? options;

  const handlePageChange = useCallback((page: number) => onPageChange?.(page), [onPageChange]);

  const handleGridClick = useMemo(() => createMarkdownCellClickHandler(setPopover), []);

  const skeletonRows = serverPagination?.limit ?? 10;
  const containerRef = useRef<HTMLDivElement>(null);
  const [theadHeight, setTheadHeight] = useState(40);
  const [tableHeight, setTableHeight] = useState(0);
  const [colWidths, setColWidths] = useState<number[]>([]);

  // Measure the actual thead/table height and column widths once the grid renders.
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
      const table = el.querySelector('.hcg-table') as HTMLElement | null;
      if (table) {
        setTableHeight(table.offsetHeight);
        const ths = table.querySelectorAll('thead th');
        const widths: number[] = [];
        ths.forEach((th) => widths.push((th as HTMLElement).offsetWidth));
        setColWidths(widths);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [stableOptions]);

  // Derive column count from gridOptions so skeleton matches the real table
  const skeletonColCount = useMemo(() => {
    const cols = (stableOptions as { columns?: Array<unknown> }).columns;
    return cols?.length ?? 6;
  }, [stableOptions]);

  return (
    <div
      className={`h-full w-full table-widget-root flex flex-col${hasServerPagination ? ' server-paginated' : ''}`}
    >
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-hidden relative"
        onClick={handleGridClick}
        onMouseOver={handleMarkdownCellHover}
      >
        <ReportTable
          options={stableOptions}
          hidePagination
          onSortChange={hasServerPagination ? onSortChange : undefined}
          sortState={hasServerPagination ? sortState : undefined}
          onCellClick={onCellClick}
          disableTooltip
        />

        {/* Empty filler rows below data — spreadsheet look */}
        {tableHeight > 0 && !isLoading && (
          <table aria-hidden className="table-filler" style={{ top: tableHeight }}>
            {colWidths.length > 0 && (
              <colgroup>
                {colWidths.map((w, i) => (
                  <col key={i} style={{ width: w }} />
                ))}
              </colgroup>
            )}
            <tbody>
              {Array.from({ length: 50 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: colWidths.length || skeletonColCount }).map((_, j) => (
                    <td key={j} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Shimmer covers body rows while headers stay visible */}
        {isLoading && (
          <div className="table-skeleton" style={{ top: theadHeight }}>
            <table className="table-skeleton-table">
              {colWidths.length > 0 && (
                <colgroup>
                  {colWidths.map((w, i) => (
                    <col key={i} style={{ width: w }} />
                  ))}
                </colgroup>
              )}
              <tbody>
                {Array.from({ length: skeletonRows }).map((_, i) => (
                  <tr key={i} className="table-skeleton-row">
                    {Array.from({ length: skeletonColCount }).map((_, j) => (
                      <td key={j} className="table-skeleton-td">
                        <div className="table-skeleton-cell" />
                      </td>
                    ))}
                  </tr>
                ))}
                {Array.from({ length: 50 }).map((_, i) => (
                  <tr key={`f${i}`}>
                    {Array.from({ length: skeletonColCount }).map((_, j) => (
                      <td key={j} className="table-skeleton-td" />
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
      <AnimatePresence>
        {popover && (
          <LongTextPopover
            text={popover.text}
            anchorRect={popover.rect}
            onClose={() => setPopover(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export { TableWidget };
