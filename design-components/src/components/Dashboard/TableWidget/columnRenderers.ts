/**
 * Column rendering registry for the table widget.
 *
 * The agent sets `column.cells.variant` on each column to signal how the cell
 * should render. This module owns the closed enum + per-variant configuration.
 * Keeps the variant list in one place so FE and BE schemas stay in sync.
 *
 * Backward compat: columns without a `variant` fall through to a heuristic —
 * string columns get `longtext_expand` (today's behavior), everything else
 * renders as plain `text`.
 */

import type { GridOptions } from '@highcharts/grid-lite-react';
import { longTextExpandFormatter } from '../../ReportTable';

export const CELL_VARIANTS = [
  'text',
  'text_wrap',
  'longtext_expand',
  'numeric',
  'currency',
  'percent',
  'date',
] as const;
export type CellVariant = (typeof CELL_VARIANTS)[number];

type GridFormatter = (this: { value: unknown }) => string;

export interface ColumnRenderer {
  /** Grid-Lite cell formatter (returns HTML). Omit to leave existing formatter in place. */
  formatter?: GridFormatter;
  /** class added to every cell; used by CSS for alignment + wrap. */
  cellClass?: string;
  /** Whether this renderer grows the row height to fit wrapped content. */
  wrap: boolean;
}

export const columnRenderers: Record<CellVariant, ColumnRenderer> = {
  text: {
    cellClass: 'tw-cell-text',
    wrap: false,
  },
  text_wrap: {
    cellClass: 'tw-cell-text-wrap',
    wrap: true,
  },
  longtext_expand: {
    formatter: longTextExpandFormatter,
    cellClass: 'tw-cell-longtext',
    wrap: false,
  },
  numeric: {
    cellClass: 'tw-cell-numeric',
    wrap: false,
  },
  currency: {
    cellClass: 'tw-cell-numeric',
    wrap: false,
  },
  percent: {
    cellClass: 'tw-cell-numeric',
    wrap: false,
  },
  date: {
    cellClass: 'tw-cell-text',
    wrap: false,
  },
};

type RawColumn = {
  id: string;
  cells?: {
    variant?: CellVariant;
    formatter?: GridFormatter;
    [k: string]: unknown;
  };
  [k: string]: unknown;
};

/** Find string-typed columns by peeking at data (legacy path — no variant set). */
function detectLegacyLongtextIds(options: GridOptions): Set<string> {
  const ids = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opts = options as any;
  const dataCols: Record<string, unknown[]> | undefined =
    opts.data?.columns ?? opts.dataTable?.columns;
  if (!dataCols) return ids;
  for (const [colId, values] of Object.entries(dataCols)) {
    if (colId.startsWith('_')) continue;
    if (!Array.isArray(values)) continue;
    const first = values.find((v) => v != null);
    if (typeof first === 'string') ids.add(colId);
  }
  return ids;
}

/**
 * Resolve the renderer for a column.
 * - If `variant` is set, use it.
 * - Else fall back to the legacy heuristic: string columns get `longtext_expand`,
 *   everything else gets `text`.
 */
export function resolveVariant(
  column: RawColumn,
  legacyLongtextIds: Set<string>,
): CellVariant {
  const explicit = column.cells?.variant;
  if (explicit && CELL_VARIANTS.includes(explicit)) return explicit;
  return legacyLongtextIds.has(column.id) ? 'longtext_expand' : 'text';
}

export interface AppliedRendererResult {
  options: GridOptions;
  /** True if any resolved column wraps — caller should disable the 36px row cap. */
  hasWrapColumn: boolean;
}

/**
 * Walk `options.columns`, apply the per-variant renderer (formatter + cellClass),
 * and return the modified options plus a flag indicating whether wrap is active.
 * Preserves any existing formatter the caller already set (e.g. d3-format
 * from applyColumnFormats runs later in ReportTable).
 */
export function applyColumnRenderers(options: GridOptions): AppliedRendererResult {
  const rawColumns = options.columns as RawColumn[] | undefined;
  if (!rawColumns || rawColumns.length === 0) {
    return { options, hasWrapColumn: false };
  }

  const legacyLongtextIds = detectLegacyLongtextIds(options);
  let hasWrapColumn = false;

  const newColumns = rawColumns.map((col) => {
    const variant = resolveVariant(col, legacyLongtextIds);
    const renderer = columnRenderers[variant];
    if (renderer.wrap) hasWrapColumn = true;

    const nextCells: Record<string, unknown> = { ...(col.cells ?? {}) };

    if (renderer.formatter && !nextCells.formatter) {
      nextCells.formatter = renderer.formatter;
    }
    if (renderer.cellClass) {
      const existing = typeof nextCells.className === 'string' ? nextCells.className : '';
      nextCells.className = [existing, renderer.cellClass].filter(Boolean).join(' ');
    }

    return { ...col, cells: nextCells };
  });

  return {
    options: { ...options, columns: newColumns },
    hasWrapColumn,
  };
}
