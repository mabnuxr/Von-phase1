/**
 * Pure column-width logic. No React, no DOM. Lives apart from
 * useColumnWidthMeasurement so it can be unit-tested in a Node environment.
 */
import type { GridOptions } from '@highcharts/grid-lite-react';
import { escapeHtml, getDataTableColumns } from './reportTableUtils';

/** How many longest-by-char-length sample values per column the probe renders.
 *  Multiple candidates are needed because two equal-length strings may render
 *  at different pixel widths in proportional fonts (e.g. "Mechanical" wider
 *  than "Electrical"). The probe measures all of them and we pick the max. */
export const PROBE_CANDIDATE_LIMIT = 5;

/** How many rows the candidate scan samples per column. */
export const PROBE_SAMPLE_SIZE = 100;

/** Caps any single column's natural width — past here a wide value (long
 *  bug report, paragraph) would dominate the table and force every other
 *  column into a thin strip. The expand-popover is the path for full content. */
export const MAX_COL_WIDTH = 500;

/** Floor min for any column. Below this, content is unreadable. */
export const MIN_COL_WIDTH = 60;

/** Buffer added to every measured natural width (cell border + font variance). */
export const WIDTH_BUFFER = 8;

/** Single column's input to the probe. */
export interface ProbeColumn {
  id: string;
  /** Header text for the probe TH (already humanized from the column id). */
  header: string;
  /** Top-N longest unique data values for this column, pre-rendered to HTML
   *  strings via the column's `cells.formatter` (or stringified if none).
   *  The probe injects these via innerHTML so each TD has the same DOM
   *  structure as the rendered cell — measurement reflects the visible
   *  pixel width, not the raw value's character length. */
  candidateHtml: string[];
  /** Column has an explicit backend-supplied `width` field — used as a floor. */
  hasExplicitWidth: boolean;
  /** Index of this column in the *original* options.columns array. The probe
   *  may filter out disabled columns, so this index lets the caller write
   *  measured widths back into the right column slot. */
  originalIndex: number;
}

/** Convert a raw column id ("first_query_date" / "col_userId") into a
 *  human-friendly label ("first query date" / "user Id"). Mirrors the
 *  legacy logic from autoSizeGridColumns. */
export function humanizeColumnId(colId: string): string {
  return colId
    .replace(/^col_/, '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2');
}

/** A picked candidate, with the original row index so the probe can rebuild
 *  the row's full data dict and pass it to per-column formatters that need
 *  sibling columns (e.g. an `<a href="{account_link}">{value}</a>` template). */
interface CandidatePick {
  value: unknown;
  rowIndex: number;
}

/** Pick the top-N longest *unique* sample values from a column's data,
 *  ranked by their stringified length. Stable & deterministic given
 *  identical input — sorting is length-desc, so two equal-length values
 *  keep insertion order. The returned picks carry the row index so the
 *  caller can render through a row-aware formatter. */
function pickColumnCandidateValues(
  data: readonly unknown[] | undefined,
  limit = PROBE_CANDIDATE_LIMIT,
  sampleSize = PROBE_SAMPLE_SIZE
): CandidatePick[] {
  if (!data || limit <= 0) return [];

  const sampleLimit = Math.min(data.length, sampleSize);
  const seen = new Set<string>();
  const picks: Array<CandidatePick & { length: number }> = [];

  for (let i = 0; i < sampleLimit; i++) {
    const val = data[i];
    if (val == null) continue;
    const text = String(val);
    if (seen.has(text)) continue;
    seen.add(text);

    const length = text.length;
    if (picks.length < limit) {
      picks.push({ value: val, rowIndex: i, length });
      picks.sort((a, b) => b.length - a.length);
    } else if (length > picks[limit - 1].length) {
      picks[limit - 1] = { value: val, rowIndex: i, length };
      picks.sort((a, b) => b.length - a.length);
    }
  }

  return picks.map(({ value, rowIndex }) => ({ value, rowIndex }));
}

/** Render a candidate value the same way the cell will. If the column has a
 *  `cells.formatter`, invoke it with `this.value` bound (Grid Lite's contract).
 *  If only `cells.format` template is set, do a simple `{key}` substitution
 *  against the row data when available, else fall back to the raw value.
 *  Otherwise just escape the stringified value into a span. */
function renderCandidateHtml(
  value: unknown,
  rowData: Record<string, unknown> | undefined,
  cells: { formatter?: (this: unknown) => unknown; format?: string } | undefined
): string {
  if (cells?.formatter) {
    const ctx = { value, row: rowData ? { data: rowData } : undefined };
    try {
      return String(cells.formatter.call(ctx));
    } catch {
      // Fall through to the plain-text rendering on formatter error.
    }
  }
  if (typeof cells?.format === 'string') {
    return cells.format.replace(/\{([a-zA-Z_][\w.]*)\}/g, (_m, key) => {
      const v = key === 'value' ? value : rowData?.[key];
      return v == null ? '' : escapeHtml(String(v));
    });
  }
  return escapeHtml(String(value ?? ''));
}

/** Build the array of probe-column descriptors the hidden table needs.
 *  Each candidate is pre-rendered through the column's formatter so the
 *  probe TD has the same DOM as the eventual cell — the probe measures
 *  the actual rendered width, not the raw value's character length.
 *
 *  Disabled columns (`enabled: false`) are filtered out — they don't render
 *  in Grid Lite and including them in the probe would waste width budget on
 *  invisible columns.
 *
 *  Returns null if the options don't carry columns or a data table. */
export function buildProbeColumns(options: GridOptions): ProbeColumn[] | null {
  const cols = options.columns as
    | Array<{
        id: string;
        width?: number;
        format?: string;
        enabled?: boolean;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cells?: { formatter?: (this: any) => unknown; format?: string };
      }>
    | undefined;
  if (!cols) return null;

  const dtCols = getDataTableColumns(options);
  if (!dtCols) return null;

  const probe: ProbeColumn[] = [];
  cols.forEach((col, originalIndex) => {
    if (col.enabled === false) return;
    const rawCandidates = pickColumnCandidateValues(dtCols[col.id]);
    const candidateHtml = rawCandidates.map(({ value, rowIndex }) =>
      renderCandidateHtml(value, getRowData(dtCols, rowIndex), col.cells)
    );
    probe.push({
      id: col.id,
      header: humanizeColumnId(col.id),
      candidateHtml,
      hasExplicitWidth: !!col.width,
      originalIndex,
    });
  });
  return probe;
}

/** Reconstruct a row's data dictionary from Grid Lite's column-oriented
 *  storage. Needed so per-cell formatters that resolve sibling columns
 *  (e.g. `<a href="{account_link}">{value}</a>`) get the right row context
 *  during measurement. */
function getRowData(
  dtCols: Record<string, readonly unknown[]>,
  rowIndex: number
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const colId of Object.keys(dtCols)) {
    out[colId] = dtCols[colId]?.[rowIndex];
  }
  return out;
}

/** Inputs the width-distribution algorithm needs about each column. */
export interface ColumnWidthInputs {
  /** Widest probe-TD measurement across all candidate rows for this column. */
  probeTdWidth: number;
  /** Probe-TH measurement (header label width). */
  probeThWidth: number;
  /** Backend-supplied explicit width (0 if unset). Acts as a floor. */
  explicitWidth: number;
}

/** Compute the final px widths for each column.
 *
 *  Algorithm:
 *  1. Each column's natural width = max(probeTd, probeTh, MIN) + buffer,
 *     capped at MAX_COL_WIDTH and floored by any explicit backend width.
 *  2. If the natural total fits within the container, distribute the surplus
 *     proportionally so wider columns absorb more of the extra space. The
 *     last column absorbs any rounding remainder so the sum lands exactly
 *     on `containerWidth`.
 *  3. If the natural total exceeds the container, leave widths at natural
 *     values — the table scrolls horizontally rather than truncating. */
export function computeColumnWidths(
  inputs: readonly ColumnWidthInputs[],
  containerWidth: number,
  opts: { maxColWidth?: number; minColWidth?: number; buffer?: number } = {}
): number[] {
  const maxColWidth = opts.maxColWidth ?? MAX_COL_WIDTH;
  const minColWidth = opts.minColWidth ?? MIN_COL_WIDTH;
  const buffer = opts.buffer ?? WIDTH_BUFFER;

  const widths = inputs.map((col) => {
    const natural = Math.max(col.probeTdWidth, col.probeThWidth, minColWidth) + buffer;
    const capped = Math.min(natural, maxColWidth);
    return Math.max(capped, col.explicitWidth);
  });

  if (widths.length === 0) return widths;

  const total = widths.reduce((sum, w) => sum + w, 0);
  if (containerWidth > 0 && total < containerWidth) {
    const surplus = containerWidth - total;
    let distributed = 0;
    for (let i = 0; i < widths.length - 1; i++) {
      const extra = Math.round(surplus * (widths[i] / total));
      widths[i] += extra;
      distributed += extra;
    }
    widths[widths.length - 1] += surplus - distributed;
  }

  return widths;
}
