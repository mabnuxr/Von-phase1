import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  ReportTable,
  LongTextPopover,
  markdownCellFormatter,
  handleMarkdownCellHover,
  createMarkdownCellClickHandler,
  escapeHtml,
} from '../../ReportTable';
import type { ServerSortState, ExpandPopoverState } from '../../ReportTable';
import type { GridOptions } from '@highcharts/grid-lite-react';
import type { TableWidgetConfig, TablePaginationInfo } from '../types';
import { ServerPagination } from './ServerPagination';
import { applyColumnRenderers } from './columnRenderers';
import { useContentHeightFit } from '../useContentHeightFit';
import './table-widget.css';

interface TableWidgetProps {
  /** Panel id used by auto-fit coordination. */
  panelId?: string;
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

const SERVER_PAGINATION_PX = 44; // ~8px padding × 2 + 28px buttons
const TABLE_PADDING_PX = 16; // .table-widget-root padding 8px × 2
const WIDGET_SHELL_HEADER_PX = 56; // approx WidgetShell title bar

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
// formatters or formats (backend- or config-supplied, including those set
// by applyColumnRenderers via cell variants) win — Grid Lite returns an
// empty cell when BOTH `cells.format` and `cells.formatter` are non-default,
// so we must leave columns that already carry a `format` template untouched.
// Disabled columns are also skipped since they don't render at all.
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

// Grid Lite's built-in `cells.format` templating resolves `{key}` against the
// cell only — `{value}` works, but `{account_link}` (or any other row-sibling
// column) returns empty. When the empty value lands in `<a href="">`, AST
// rejects the href and the link becomes unclickable. Replace such templates
// with a formatter that substitutes from `cell.row.data`.
const ROW_TEMPLATE_VAR = /\{([a-zA-Z_][\w.]*)\}/g;

function applyRowDataTemplates(options: GridOptions): GridOptions {
  const cols = options.columns;
  if (!cols) return options;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapped = (cols as any[]).map((col: any) => {
    const template: unknown = col.cells?.format;
    if (typeof template !== 'string') return col;
    if (col.cells?.formatter) return col;
    // Skip if the template only references {value} (Grid Lite handles it natively).
    let needsRowData = false;
    template.replace(ROW_TEMPLATE_VAR, (_m, key) => {
      if (key !== 'value') needsRowData = true;
      return _m;
    });
    if (!needsRowData) return col;
    const tmpl = template;
    return {
      ...col,
      cells: {
        ...col.cells,
        format: undefined,
        formatter(this: { value: unknown; row?: { data?: Record<string, unknown> } }) {
          const value = this.value;
          const data = this.row?.data ?? {};
          return tmpl.replace(ROW_TEMPLATE_VAR, (_m: string, key: string) => {
            const v = key === 'value' ? value : data[key];
            return v == null ? '' : escapeHtml(String(v));
          });
        },
      },
    };
  });
  return { ...options, columns: mapped };
}

const TableWidget: React.FC<TableWidgetProps> = ({
  panelId,
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
  // Variant-based renderers run first (they may set formatters/cellClasses
  // and tell us whether any column wraps). Markdown + row-data templates
  // then fill in formatters for columns the variant pass left untouched.
  // Memoized so popover open/close (setPopover → re-render) doesn't rebuild
  // the columns array and force Grid Lite to re-run every formatter.
  const { options, autoHeight } = useMemo<{ options: GridOptions; autoHeight: boolean }>(() => {
    const applied = applyColumnRenderers(
      hasServerPagination ? { ...base, pagination: { enabled: false } } : base
    );
    const finalOptions = applyMarkdownCellFormatters(applyRowDataTemplates(applied.options));
    return {
      options: finalOptions,
      autoHeight: base.autoHeight === true || applied.hasWrapColumn,
    };
  }, [base, hasServerPagination]);

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

  // Fingerprint for auto-fit. Changes when the agent/user changes column
  // structure, formatters, row count, autoHeight, or pagination page —
  // anything that could plausibly change the rendered height.
  const fingerprint = useMemo(() => {
    type RawCol = {
      id: string;
      enabled?: boolean;
      cells?: { variant?: string; format?: string };
      format?: string;
    };
    const cols = ((stableOptions as { columns?: RawCol[] }).columns ?? []) as RawCol[];
    const colSig = cols
      .map(
        (c) =>
          `${c.id}:${c.enabled !== false ? 1 : 0}:${c.cells?.variant ?? ''}:${c.cells?.format ?? c.format ?? ''}`
      )
      .join('|');
    const opts = stableOptions as {
      data?: { columns?: Record<string, unknown[]> };
      dataTable?: { columns?: Record<string, unknown[]> };
    };
    const dataCols = opts.data?.columns ?? opts.dataTable?.columns;
    const rowCount = dataCols
      ? ((Object.values(dataCols)[0] as unknown[] | undefined)?.length ?? 0)
      : 0;
    const page = serverPagination?.page ?? 0;
    return `${colSig}#${rowCount}#${autoHeight ? 'a' : 's'}#${page}`;
  }, [stableOptions, autoHeight, serverPagination?.page]);

  const measuredPx =
    tableHeight > 0
      ? tableHeight + (hasServerPagination ? SERVER_PAGINATION_PX : 0) + TABLE_PADDING_PX
      : null;

  useContentHeightFit({
    panelId: panelId ?? '',
    fingerprint,
    measuredPx,
    chromePx: WIDGET_SHELL_HEADER_PX,
    enabled: !!panelId,
  });

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
