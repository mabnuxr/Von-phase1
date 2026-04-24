import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ReportTable, handleLongTextHover, LongTextPopover } from '../../ReportTable';
import type { ServerSortState, ExpandPopoverState } from '../../ReportTable';
import type { GridOptions } from '@highcharts/grid-lite-react';
import type { TableWidgetConfig, TablePaginationInfo } from '../types';
import { ServerPagination } from './ServerPagination';
import { applyColumnRenderers } from './columnRenderers';
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
  const [popover, setPopover] = useState<ExpandPopoverState | null>(null);

  // Keep the last valid gridOptions so the table stays stable during loading.
  // When loading, config.gridOptions may still hold the previous page's data
  // (which is exactly what we want — headers stay, shimmer covers rows).
  const lastOptionsRef = useRef<GridOptions | null>(null);

  const base = config.gridOptions as GridOptions & { autoHeight?: boolean };
  // Only disable client-side pagination for server-paginated tables;
  // non-server-paginated tables keep their existing pagination config.
  const applied = applyColumnRenderers(
    hasServerPagination ? { ...base, pagination: { enabled: false } } : base
  );
  const options = applied.options;
  const autoHeight = base.autoHeight === true || applied.hasWrapColumn;

  // Update ref only when NOT loading (i.e. fresh data has arrived)
  if (!isLoading) {
    lastOptionsRef.current = options;
  }

  // Use the last known good options so the grid never flickers
  const stableOptions = lastOptionsRef.current ?? options;

  const handlePageChange = useCallback((page: number) => onPageChange?.(page), [onPageChange]);

  /** Click handler — detect expand-button clicks via DOM traversal */
  const handleGridClick = useCallback((e: React.MouseEvent) => {
    const btn = (e.target as HTMLElement).closest('.dt-expand-btn') as HTMLElement;
    if (!btn) return;
    e.stopPropagation();

    const td = btn.closest('td');
    if (!td) return;

    const span = td.querySelector('.dt-longtext-wrap > span');
    const fullText = span?.textContent ?? '';
    if (fullText) {
      setPopover({ text: fullText, rect: td.getBoundingClientRect() });
    }
  }, []);

  const skeletonRows = serverPagination?.limit ?? 10;
  const containerRef = useRef<HTMLDivElement>(null);
  const [theadHeight, setTheadHeight] = useState(40);
  const [tableHeight, setTableHeight] = useState(0);
  const [colWidths, setColWidths] = useState<number[]>([]);

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const thead = el.querySelector('.hcg-table thead');
    if (thead) {
      setTheadHeight(thead.getBoundingClientRect().height);
    }
    const table = el.querySelector('.hcg-table') as HTMLElement | null;
    if (!table) return;
    setTableHeight(table.offsetHeight);
    const ths = table.querySelectorAll('thead th');
    const widths: number[] = [];
    ths.forEach((th) => widths.push((th as HTMLElement).offsetWidth));
    setColWidths(widths);
  }, []);

  // Container-size changes (viewport resize, widget drag/resize in edit
  // mode, post-save re-renders) re-measure filler rows and header widths.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  // Re-measure when Grid Lite swaps its internal table after a data change.
  // stableOptions identity changes on every render of fresh data; the RAF
  // defers the read until after Grid Lite has committed its DOM update.
  useEffect(() => {
    const raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [stableOptions, measure]);

  // Derive column count from gridOptions so skeleton matches the real table
  const skeletonColCount = useMemo(() => {
    const cols = (stableOptions as { columns?: Array<unknown> }).columns;
    return cols?.length ?? 6;
  }, [stableOptions]);

  return (
    <div
      className={`h-full w-full table-widget-root flex flex-col${hasServerPagination ? ' server-paginated' : ''}${autoHeight ? ' auto-height' : ''}`}
    >
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-hidden relative"
        onClick={handleGridClick}
        onMouseOver={handleLongTextHover}
      >
        <ReportTable
          options={stableOptions}
          hidePagination
          onSortChange={hasServerPagination ? onSortChange : undefined}
          sortState={hasServerPagination ? sortState : undefined}
          onCellClick={onCellClick}
          disableTooltip
        />

        {/* Empty filler rows below data — spreadsheet look. Skipped when
            auto-height is on because variable row heights make fixed filler
            rows misalign with the real grid. */}
        {!autoHeight && tableHeight > 0 && !isLoading && (
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
