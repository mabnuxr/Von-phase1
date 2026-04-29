/**
 * Pure column-width logic. No React, no DOM. Lives apart from
 * useColumnWidthMeasurement so it can be unit-tested in a Node environment.
 */
import type { GridOptions } from '@highcharts/grid-lite-react';
import { formatD3Pattern } from '../../utils/formatKpiValue';
import { getDataTableColumns } from './reportTableUtils';

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
  /** Top-N longest unique data values for this column. */
  candidates: string[];
  /** Column has an explicit backend-supplied `width` field — used as a floor. */
  hasExplicitWidth: boolean;
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

/** Format a single sample value the same way the cell would render it.
 *  d3-format columns are formatted with their pattern; non-numeric values
 *  fall back to String(). */
function formatSampleValue(value: unknown, format?: string): string {
  if (format && typeof format === 'string') {
    const num = typeof value === 'number' ? value : Number(value);
    if (!isNaN(num)) {
      try {
        return formatD3Pattern(num, format);
      } catch {
        // d3-format threw — fall through to String(value).
      }
    }
  }
  return String(value);
}

/** Pick the top-N longest *unique* sample values from a column's data.
 *  Stable & deterministic given identical input — sorting is by string
 *  length descending, so two equal-length values keep insertion order. */
export function pickColumnCandidates(
  data: readonly unknown[] | undefined,
  format: string | undefined,
  limit = PROBE_CANDIDATE_LIMIT,
  sampleSize = PROBE_SAMPLE_SIZE
): string[] {
  if (!data || limit <= 0) return [];

  const sample = data.length <= sampleSize ? data : data.slice(0, sampleSize);
  const seen = new Set<string>();
  const candidates: string[] = [];

  for (const val of sample) {
    if (val == null) continue;
    const text = formatSampleValue(val, format);
    if (seen.has(text)) continue;
    seen.add(text);

    if (candidates.length < limit) {
      candidates.push(text);
      candidates.sort((a, b) => b.length - a.length);
    } else if (text.length > candidates[limit - 1].length) {
      candidates[limit - 1] = text;
      candidates.sort((a, b) => b.length - a.length);
    }
  }

  return candidates;
}

/** Build the array of probe-column descriptors the hidden table needs.
 *  Returns null if the options don't carry columns or a data table. */
export function buildProbeColumns(options: GridOptions): ProbeColumn[] | null {
  const cols = options.columns as
    | Array<{ id: string; width?: number; format?: string }>
    | undefined;
  if (!cols) return null;

  const dtCols = getDataTableColumns(options);
  if (!dtCols) return null;

  return cols.map((col) => ({
    id: col.id,
    header: humanizeColumnId(col.id),
    candidates: pickColumnCandidates(dtCols[col.id], col.format),
    hasExplicitWidth: !!col.width,
  }));
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
