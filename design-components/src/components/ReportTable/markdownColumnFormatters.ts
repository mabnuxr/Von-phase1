import type { GridOptions } from '@highcharts/grid-lite-react';
import { markdownCellFormatter } from './markdownCell';

/**
 * Identify text column ids by inspecting the first non-null value in each
 * column's data array. Internal columns (id starts with `_`) are skipped.
 *
 * Supports both Grid Lite shapes — `data.columns` (current) and
 * `dataTable.columns` (legacy back-compat).
 */
export function findTextColumnIds(options: GridOptions): Set<string> {
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
 * Auto-assign ``markdownCellFormatter`` to every text column so cells render
 * their markdown source (links, bold, lists) as styled HTML instead of raw
 * text. Existing per-column formatters or format templates win — Grid Lite
 * returns an empty cell when BOTH ``cells.format`` and ``cells.formatter``
 * are non-default, so we leave columns that already carry either untouched.
 * Disabled columns are skipped (they don't render at all).
 *
 * Used by both the dashboard ``TableWidget`` and the drilldown view (V2)
 * so cells render identically across panel tables and the drill bottom
 * sheet. Without this pass, drill-view cells render markdown source as
 * literal text — link strings emitted by drill SQL show up as
 * ``[Acme](https://...)`` instead of clickable "Acme" links.
 */
export function applyMarkdownCellFormatters(options: GridOptions): GridOptions {
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
