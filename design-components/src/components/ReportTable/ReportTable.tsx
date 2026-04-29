import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Grid, type GridOptions } from '@highcharts/grid-lite-react';
import { addEvent } from '@highcharts/grid-lite/es-modules/Shared/Utilities.js';
import { autoSizeGridColumns, applyColumnFormats, getDataTableColumns } from './reportTableUtils';
import { formatD3Pattern } from '../../utils/formatKpiValue';
import { SourcePopover } from './SourcePopover';
import '@highcharts/grid-lite/css/grid-lite.css';
import './report-grid-theme.css';
import './markdown-cell.css';

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
// Server Sort State
// ============================================================================

export interface ServerSortState {
  orderBy: string;
  orderByAsc: boolean;
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

// ============================================================================
// Main Component
// ============================================================================

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

  // ── Probe-table column measurement ────────────────────────────────────────
  // Renders a hidden <table> (not Grid Lite) with the same CSS to measure true
  // content widths. The probe table is fully under our control — no async init,
  // no JS overrides from Grid Lite. Measured widths are set on Grid Lite columns.
  const probeRef = useRef<HTMLTableElement>(null);

  // Apply column-level d3-format patterns, then prepare options.
  const formattedOptions = useMemo(
    () => autoSizeGridColumns(applyColumnFormats(options)),
    [options]
  );

  // Extract column ids + widest data values for the probe table
  const probeData = useMemo(() => {
    const cols = formattedOptions.columns as
      | Array<{ id: string; width?: number; format?: string }>
      | undefined;
    if (!cols) return null;
    const dtCols = getDataTableColumns(formattedOptions);
    if (!dtCols) return null;

    return cols.map((col) => {
      // Header label (same logic as old autoSizeGridColumns)
      const header = col.id
        .replace(/^col_/, '')
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2');

      // Find widest data value (sample first 100 rows)
      const data = dtCols[col.id];
      let widest = '';
      if (data) {
        const sample = data.length <= 100 ? data : data.slice(0, 100);
        for (const val of sample) {
          if (val == null) continue;
          let text: string;
          if (col.format && typeof col.format === 'string') {
            const num = typeof val === 'number' ? val : Number(val);
            if (!isNaN(num)) {
              try {
                text = formatD3Pattern(num, col.format);
              } catch {
                text = String(val);
              }
            } else {
              text = String(val);
            }
          } else {
            text = String(val);
          }
          if (text.length > widest.length) widest = text;
        }
      }
      return { id: col.id, header, widest, hasExplicitWidth: !!col.width };
    });
  }, [formattedOptions]);

  // Measure probe table after DOM commit (useLayoutEffect = before paint).
  // Grid only renders after widths are known, so user never sees unsized state.
  const [measuredWidths, setMeasuredWidths] = useState<number[] | null>(null);

  useLayoutEffect(() => {
    if (!probeRef.current || !probeData) return;

    const MAX_COL_WIDTH = 500;
    const probeTds = probeRef.current.querySelectorAll('tbody td');
    const probeThs = probeRef.current.querySelectorAll('thead th');
    if (probeTds.length === 0) return;

    const containerWidth = wrapperRef.current?.clientWidth ?? 0;
    const colWidths: number[] = [];

    const cols = formattedOptions.columns as Array<{ width?: number }>;
    for (let i = 0; i < probeData.length; i++) {
      const tdW = probeTds[i] ? (probeTds[i] as HTMLElement).offsetWidth : 60;
      const thW = probeThs[i] ? (probeThs[i] as HTMLElement).offsetWidth : 60;
      // +8px buffer: covers cell border (1px) + proportional font variations
      const measured = Math.min(Math.max(tdW, thW, 60) + 8, MAX_COL_WIDTH);
      // Explicit backend width is a floor — probe can only widen, never shrink.
      const explicit = probeData[i].hasExplicitWidth ? (cols[i]?.width ?? 60) : 0;
      colWidths.push(Math.max(measured, explicit));
    }

    // Distribute surplus proportionally so table fills container
    const total = colWidths.reduce((s, w) => s + w, 0);
    if (containerWidth > 0 && total < containerWidth) {
      const surplus = containerWidth - total;
      let distributed = 0;
      for (let i = 0; i < colWidths.length - 1; i++) {
        const extra = Math.round(surplus * (colWidths[i] / total));
        colWidths[i] += extra;
        distributed += extra;
      }
      colWidths[colWidths.length - 1] += surplus - distributed;
    }

    setMeasuredWidths(colWidths);
  }, [probeData, formattedOptions]);

  // Apply measured widths to grid options
  const sizedOptions = useMemo(() => {
    const opts = autoSizeGridColumns(formattedOptions);
    if (!measuredWidths) return opts;

    const cols = opts.columns as Array<{ id: string; width?: number }> | undefined;
    if (!cols) return opts;

    for (let i = 0; i < cols.length && i < measuredWidths.length; i++) {
      cols[i].width = measuredWidths[i];
    }
    return opts;
  }, [formattedOptions, measuredWidths]);

  const wrapperRef = useRef<HTMLDivElement>(null);

  const [popoverReasoning, setPopoverReasoning] = useState<AIReasoningData | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  // ── Truncation tooltip (TruncateWithText-like) ─────────────────────────────
  const [truncTooltip, setTruncTooltip] = useState<{
    text: string;
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const lastHoveredTd = useRef<HTMLElement | null>(null);

  const handleCellMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      if (disableTooltip) return;
      const td = (e.target as HTMLElement).closest('td') as HTMLElement | null;
      if (!td || td === lastHoveredTd.current) return;
      lastHoveredTd.current = td;

      // Check if cell content is actually truncated.
      // The default cell formatter wraps text in a display:block span with overflow:hidden,
      // so the td's scrollWidth equals clientWidth even when text is truncated — the inner
      // element clips it. We need to check td OR its first child element.
      const firstChild = td.firstElementChild as HTMLElement | null;
      const isTruncated =
        td.scrollWidth > td.clientWidth ||
        (firstChild !== null && firstChild.scrollWidth > firstChild.clientWidth);
      if (!isTruncated) return;

      // Prefer explicit data-tooltip (set for owner/multiPicklist cells where
      // textContent concatenates avatar initials or tag text without separators)
      const tooltipEl = td.querySelector('[data-tooltip]') as HTMLElement | null;
      const text = tooltipEl?.getAttribute('data-tooltip') || td.textContent?.trim();
      if (!text) return;

      const rect = td.getBoundingClientRect();
      setTruncTooltip({
        text,
        top: rect.top - 6,
        left: rect.left,
        width: rect.width,
      });
    },
    [disableTooltip]
  );

  const handleCellMouseLeave = useCallback((e: React.MouseEvent) => {
    const td = (e.target as HTMLElement).closest('td') as HTMLElement | null;
    const related = (e.relatedTarget as HTMLElement | null)?.closest?.('td');
    // Only clear if we're actually leaving the cell (not moving between child elements)
    if (td && td !== related) {
      lastHoveredTd.current = null;
      setTruncTooltip(null);
    }
  }, []);

  // Clear tooltip on grid scroll so it doesn't become detached
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const viewport = wrapper.querySelector('.hcg-scrollable-content');
    if (!viewport) return;

    const onScroll = () => {
      lastHoveredTd.current = null;
      setTruncTooltip(null);
    };
    viewport.addEventListener('scroll', onScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', onScroll);
  }, []);

  // ── Server-side sort: listen to Grid Lite's afterSort event ────────────────
  // Grid Lite fires `afterSort` on the grid instance with
  // { target: Column, order: 'asc' | 'desc' | null }.
  // We hook into this via the `callback` prop which fires after grid init.
  const onSortChangeRef = useRef(onSortChange);
  onSortChangeRef.current = onSortChange;
  const removeEventRef = useRef<Function | null>(null); // eslint-disable-line @typescript-eslint/no-unsafe-function-type

  const handleGridReady = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (grid: any) => {
      // Clean up previous listener (Grid re-creates on options change)
      removeEventRef.current?.();
      removeEventRef.current = null;

      if (!onSortChangeRef.current) return;

      // addEvent returns a cleanup function
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      removeEventRef.current = addEvent(grid, 'afterSort', (e: any) => {
        const columnId: string | undefined = e?.target?.id;
        const order: 'asc' | 'desc' | null = e?.order ?? null;
        if (columnId) {
          onSortChangeRef.current?.(columnId, order);
        }
      });
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      removeEventRef.current?.();
    };
  }, []);

  // ── AI reasoning popover (event delegation on .von-cell-btn) ───────────────
  const handleWrapperClick = useCallback(
    (e: React.MouseEvent) => {
      // AI reasoning button takes priority
      const btnTarget = (e.target as HTMLElement).closest('.von-cell-btn') as HTMLElement | null;
      if (btnTarget) {
        e.stopPropagation();
        const reasoningAttr = btnTarget.getAttribute('data-reasoning');
        if (!reasoningAttr) return;

        try {
          const reasoning = JSON.parse(reasoningAttr) as AIReasoningData;
          const rect = btnTarget.getBoundingClientRect();
          setPopoverPosition({
            top: rect.bottom + 4,
            left: Math.max(8, Math.min(rect.left - 240, window.innerWidth - 340)),
          });
          setPopoverReasoning(reasoning);
        } catch {
          // Ignore malformed data
        }
        return;
      }

      // Cell click drilldown
      if (!onCellClick) return;
      if ((e.target as HTMLElement).closest('a,button,input,select,textarea')) return;
      const td = (e.target as HTMLElement).closest('td') as HTMLTableCellElement | null;
      if (!td) return;
      const tr = td.closest('tr');
      if (!tr || !tr.closest('tbody')) return; // ignore header clicks

      const colIndex = td.cellIndex;

      // Get column ID from options.columns array (most reliable)
      const cols = options.columns as Array<{ id?: string }> | undefined;
      const columnId = cols?.[colIndex]?.id;
      if (!columnId) return;

      // Extract raw value from the dataTable if available
      const dataTable = options.dataTable as { columns?: Record<string, unknown[]> } | undefined;
      const rowIndex = Array.from(tr.parentElement!.children).indexOf(tr);
      const rawValue = dataTable?.columns?.[columnId]?.[rowIndex] ?? td.textContent?.trim() ?? '';

      onCellClick(columnId, rawValue);
    },
    [onCellClick, options.dataTable, options.columns]
  );

  // Check if data is empty
  const isEmpty = useMemo(() => {
    const cols = getDataTableColumns(sizedOptions);
    if (!cols) return true;
    const firstCol = Object.values(cols)[0];
    return !firstCol || firstCol.length === 0;
  }, [sizedOptions]);

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
      ref={wrapperRef}
      className={`w-full flex flex-col h-full relative report-grid-wrapper highcharts-light ${compact ? 'report-grid-compact' : ''} ${hidePagination ? 'report-grid-no-pagination' : ''} ${className}`}
      onClick={handleWrapperClick}
      onMouseOver={handleCellMouseEnter}
      onMouseOut={handleCellMouseLeave}
    >
      {/* Hidden probe table for measuring true content widths.
          Same CSS classes as Grid Lite → same padding/font → accurate widths. */}
      {probeData && (
        <table
          ref={probeRef}
          aria-hidden
          className="report-grid-probe"
          style={{
            position: 'absolute',
            visibility: 'hidden',
            top: -9999,
            left: -9999,
            tableLayout: 'auto',
            width: 'max-content',
            whiteSpace: 'nowrap',
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr>
              {probeData.map((col) => (
                <th key={col.id} className="hcg-header-cell" style={{ whiteSpace: 'nowrap' }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {probeData.map((col) => (
                <td key={col.id} style={{ whiteSpace: 'nowrap' }}>
                  {col.widest}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      )}

      {measuredWidths && (
        <Grid options={sizedOptions} callback={onSortChange ? handleGridReady : undefined} />
      )}

      {popoverReasoning && (
        <SourcePopover
          reasoning={popoverReasoning}
          position={popoverPosition}
          onClose={() => setPopoverReasoning(null)}
        />
      )}

      {/* Truncation tooltip — portal-based, same style as TruncateWithText */}
      {truncTooltip &&
        createPortal(
          <div
            role="tooltip"
            className="fixed z-[10000] px-2 py-1 text-xs text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none break-words"
            style={{
              top: truncTooltip.top,
              left: truncTooltip.left,
              maxWidth: Math.max(truncTooltip.width, 280),
              transform: 'translateY(-100%)',
            }}
          >
            {truncTooltip.text}
          </div>,
          document.body
        )}
    </div>
  );
}

export default ReportTable;
