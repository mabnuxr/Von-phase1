import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  ReportTable,
  LongTextPopover,
  handleMarkdownCellHover,
  createMarkdownCellClickHandler,
  applyMarkdownCellFormatters,
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
  /** Called when a table body cell is clicked for drilldown — provides column
   *  ID, raw cell value, and the full row dict so V2 drilldown can extract
   *  multiple data_keys from a single click (e.g. cohort cells need both
   *  account_name AND week_label regardless of which column was clicked). */
  onCellClick?: (
    columnId: string,
    cellValue: unknown,
    rowData: Record<string, unknown>,
    displayText?: string
  ) => void;
  /** Whitelist of column ids that should receive the drillable-cell hover
   *  affordance + register clicks. When provided, only those columns get
   *  `td.drillable-cell` painted (hover background + pointer cursor).
   *  ``null``/``undefined`` (default) → back-compat: every cell is treated
   *  as drillable, preserving behaviour of dashboards predating the
   *  per-column drilldown contract. ``[]`` → no cells drillable. */
  drillableColumns?: string[] | null;
}

const SERVER_PAGINATION_PX = 44; // ~8px padding × 2 + 28px buttons
const TABLE_PADDING_PX = 16; // .table-widget-root padding 8px × 2
// WidgetShell title bar: 53px content + 1px bottom border.
const WIDGET_SHELL_HEADER_PX = 54;
// Native horizontal scrollbar height when columns overflow — added to the
// reported height only when overflow is actually present so the last row
// doesn't get clipped by the scrollbar.
const HORIZONTAL_SCROLLBAR_PX = 16;

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

// Append ``drillable-cell`` to ``column.cells.className`` for each column
// id in ``drillableColumns``. ``null`` means the agent didn't author a
// whitelist — paint NO cells as drillable in that case (no highlight,
// no pointer cursor, no ↳ glyph). Click handlers still gate on the same
// ``null`` value to allow clicks through anywhere, since legacy
// V1→V2-migrated panels can still benefit from cell-clicks even
// without a whitelist.
//
// The previous back-compat ("null = every cell clickable + highlighted")
// produced misleading affordance on agent-authored panels where the
// agent simply forgot to populate the whitelist — every dimension
// column appeared drillable. The validator now rejects null on
// agent-authored configs (see schema_validator
// ``_validate_v2_drillable_columns_required``); this FE change drops
// the matching back-compat so legacy migrations and accidental nulls
// fail closed visually.
function applyDrillableCellClass(
  options: GridOptions,
  drillableColumns: string[] | null
): GridOptions {
  const cols = options.columns;
  if (!cols) return options;
  // null whitelist → don't tag any column. Click still works (the per-cell
  // click handler treats null as "no gate"); just no visual affordance.
  if (drillableColumns === null) return options;
  const allow = new Set(drillableColumns);
  const mapped = cols.map((col) => {
    const c = col as { id?: string; cells?: { className?: string } };
    const id = c.id;
    if (!id) return col;
    if (!allow.has(id)) return col;
    const existing = typeof c.cells?.className === 'string' ? c.cells.className : '';
    const next = existing.includes('drillable-cell')
      ? existing
      : [existing, 'drillable-cell'].filter(Boolean).join(' ');
    return { ...col, cells: { ...(c.cells ?? {}), className: next } };
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
  drillableColumns,
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
    const withFormatters = applyMarkdownCellFormatters(applyRowDataTemplates(applied.options));
    // Tag the body cells of drillable columns with a ``drillable-cell``
    // className so the per-cell hover CSS only paints those columns. When
    // ``drillableColumns`` is null/undefined we fall back to "every cell
    // gets the class" so legacy dashboards predating the per-column
    // contract keep their existing whole-table hover behaviour.
    const finalOptions = applyDrillableCellClass(withFormatters, drillableColumns ?? null);
    return {
      options: finalOptions,
      autoHeight: base.autoHeight === true || applied.hasWrapColumn,
    };
  }, [base, hasServerPagination, drillableColumns]);

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
  const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false);
  const [colWidths, setColWidths] = useState<number[]>([]);

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const thead = el.querySelector('.hcg-table thead');
    if (thead) {
      const next = Math.round(thead.getBoundingClientRect().height);
      setTheadHeight((prev) => (prev === next ? prev : next));
    }
    const table = el.querySelector('.hcg-table') as HTMLElement | null;
    if (!table) return;

    // Grid Lite injects empty filler rows (`.hcg-mocked-row`) to fill the
    // scroll container's visible area. Reading `table.offsetHeight` directly
    // captures those filler rows and would feed an ever-growing measurement
    // back to auto-fit, since each grow lets Grid Lite inject more fillers.
    // Measure only thead + real (non-mocked) tbody rows so the reported
    // height is the table's intrinsic content height, independent of the
    // container.
    const theadEl = table.querySelector('thead') as HTMLElement | null;
    const realRows = table.querySelectorAll(
      'tbody tr:not(.hcg-mocked-row)'
    ) as NodeListOf<HTMLElement>;
    let intrinsicH = 0;
    if (theadEl) intrinsicH += theadEl.offsetHeight;
    realRows.forEach((row) => {
      intrinsicH += row.offsetHeight;
    });
    const nextTableH = Math.round(intrinsicH > 0 ? intrinsicH : table.offsetHeight);
    setTableHeight((prev) => (prev === nextTableH ? prev : nextTableH));
    // Horizontal overflow lives on the scroll container Grid Lite wraps the
    // table in. When columns are wider than the available width its
    // scrollWidth exceeds its clientWidth and a horizontal scrollbar
    // appears at the bottom — we add 16px to measuredPx in that case so
    // the last row isn't clipped by the scrollbar.
    const scrollEl = el.querySelector('.hcg-scrollable-content') as HTMLElement | null;
    if (scrollEl) {
      setHasHorizontalOverflow(scrollEl.scrollWidth > scrollEl.clientWidth);
    }
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

  // Drillable affordance — post-render DOM tagging.
  //
  // Grid Lite's column config exposes ``cells.className`` (which we use in
  // ``applyDrillableCellClass`` to mark body cells), but NOT a parallel
  // ``header.className`` knob. To tint the column headers purple + emit the
  // ↳ hint glyph above only the drillable columns, we tag matching
  // ``<th>`` elements after Grid Lite commits its DOM. Body cells are
  // already class-tagged via the column config; this effect adds the
  // ``title="Click to drill deeper"`` attribute to those td's (Grid Lite
  // doesn't have a per-cell attributes API, only className).
  //
  // Runs on every options-identity change so it survives sort / page /
  // resize cycles that re-render the grid.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      const table = el.querySelector('.hcg-table');
      if (!table) return;
      // Find which column indices have drillable body cells. Reading from
      // the first real (non-mocked) row keeps the lookup O(numCols).
      const firstRow = table.querySelector(
        'tbody tr:not(.hcg-mocked-row)'
      ) as HTMLTableRowElement | null;
      if (!firstRow) return;
      const drillableIdxs = new Set<number>();
      Array.from(firstRow.children).forEach((cell, i) => {
        if ((cell as HTMLElement).classList.contains('drillable-cell')) {
          drillableIdxs.add(i);
        }
      });

      // Tag matching headers; clear any stale tags from prior renders so
      // the set doesn't drift if the column ordering changes.
      const ths = table.querySelectorAll('thead th');
      ths.forEach((th, i) => {
        th.classList.toggle('drillable-header', drillableIdxs.has(i));
      });

      // Set the native browser tooltip on every drillable td. Idempotent
      // — re-setting an attribute to the same value is a no-op.
      const tds = table.querySelectorAll('tbody td.drillable-cell');
      tds.forEach((td) => {
        (td as HTMLElement).title = 'Click to drill deeper';
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [stableOptions]);

  // Row count used for both the fingerprint and the intrinsic height
  // calculation below.
  const rowCount = useMemo(() => {
    const opts = stableOptions as {
      data?: { columns?: Record<string, unknown[]> };
      dataTable?: { columns?: Record<string, unknown[]> };
    };
    const dataCols = opts.data?.columns ?? opts.dataTable?.columns;
    return dataCols ? ((Object.values(dataCols)[0] as unknown[] | undefined)?.length ?? 0) : 0;
  }, [stableOptions]);

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
    const page = serverPagination?.page ?? 0;
    return `${colSig}#${rowCount}#${autoHeight ? 'a' : 's'}#${page}`;
  }, [stableOptions, autoHeight, serverPagination?.page, rowCount]);

  // Auto-fit's `measuredPx` is the rendered table height read from the DOM,
  // plus the surrounding chrome we know about. We add `HORIZONTAL_SCROLLBAR_PX`
  // ONLY when the columns actually overflow horizontally — when a scrollbar
  // is present, the last row would otherwise be clipped beneath it.
  const measuredPx =
    tableHeight > 0
      ? tableHeight +
        (hasHorizontalOverflow ? HORIZONTAL_SCROLLBAR_PX : 0) +
        (hasServerPagination ? SERVER_PAGINATION_PX : 0) +
        TABLE_PADDING_PX
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
      // ``clickable-cells`` is the styling hook for the drillable hover state
      // (light-violet td bg + pointer cursor). Gated on whether the parent
      // wired ``onCellClick`` — that's the same gate ``useCellInteractions``
      // uses to decide whether to fire a click — so the visual affordance and
      // the actual click behaviour stay in lockstep.
      className={`h-full w-full table-widget-root flex flex-col${hasServerPagination ? ' server-paginated' : ''}${autoHeight ? ' auto-height' : ''}${onCellClick ? ' clickable-cells' : ''}`}
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
