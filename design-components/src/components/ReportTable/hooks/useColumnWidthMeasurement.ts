import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { GridOptions } from '@highcharts/grid-lite-react';
import { autoSizeGridColumns, applyColumnFormats } from '../reportTableUtils';
import {
  buildProbeColumns,
  computeColumnWidths,
  type ColumnWidthInputs,
  type ProbeColumn,
} from '../columnWidthLogic';

interface UseColumnWidthMeasurementResult {
  /** Pass to ColumnWidthProbe — it's the columns the probe should render. */
  probeColumns: ProbeColumn[] | null;
  /** Spread onto the Grid Lite `<Grid options>` once measurement is ready.
   *  Always a fresh reference when widths change so react-grid-lite's
   *  `useEffect([options])` actually fires (reference-equal options would
   *  silently freeze the grid at its first-applied widths). */
  sizedOptions: GridOptions;
  /** Whether widths have been measured at least once. The grid should not
   *  render before this is true so the user never sees an unsized state. */
  isMeasured: boolean;
}

/**
 * Measures each column's natural width from a hidden probe table, then
 * decides the final px widths the Grid Lite columns should use.
 *
 * Re-runs:
 *   - When the input options' columns/data change (new probe candidates).
 *   - When the wrapper element resizes (ResizeObserver). Important for
 *     panels that animate in or are initially 0-width.
 *
 * The `lastContainerWidth` guard inside `measure` prevents redundant
 * recomputes on no-op observer firings.
 */
export function useColumnWidthMeasurement(
  options: GridOptions,
  wrapperRef: RefObject<HTMLDivElement | null>
): UseColumnWidthMeasurementResult & {
  /** Internal — passed to <ColumnWidthProbe ref={...}> by the parent. */
  probeRef: RefObject<HTMLTableElement | null>;
} {
  const probeRef = useRef<HTMLTableElement>(null);

  // Apply column-level d3-format patterns and the resizing affordance once.
  // Both helpers mutate-and-return their input; wrapping in useMemo gives us
  // a stable reference to depend on downstream.
  const formattedOptions = useMemo(
    () => autoSizeGridColumns(applyColumnFormats(options)),
    [options]
  );

  const probeColumns = useMemo(() => buildProbeColumns(formattedOptions), [formattedOptions]);

  const [measuredWidths, setMeasuredWidths] = useState<number[] | null>(null);

  useLayoutEffect(() => {
    if (!probeRef.current || !probeColumns) return;

    let lastContainerWidth = -1;

    const measure = () => {
      const probeEl = probeRef.current;
      const wrapperEl = wrapperRef.current;
      if (!probeEl || !wrapperEl) return;

      const containerWidth = wrapperEl.clientWidth;
      if (containerWidth === lastContainerWidth) return;
      lastContainerWidth = containerWidth;

      const probeRows = probeEl.querySelectorAll('tbody tr');
      const probeThs = probeEl.querySelectorAll('thead th');
      if (probeRows.length === 0) return;

      // For each (enabled) column, take the widest TD across all candidate
      // rows. Picking by char length alone misses proportional-font cases
      // where two equal-length strings render at different pixel widths.
      const cols = formattedOptions.columns as Array<{ width?: number }>;
      const inputs: ColumnWidthInputs[] = probeColumns.map((col, probeIdx) => {
        let probeTdWidth = 0;
        for (const row of probeRows) {
          const td = row.children[probeIdx] as HTMLElement | undefined;
          if (td && td.offsetWidth > probeTdWidth) probeTdWidth = td.offsetWidth;
        }
        const probeThWidth = probeThs[probeIdx]
          ? (probeThs[probeIdx] as HTMLElement).offsetWidth
          : 0;

        // Backend-explicit width acts as a floor. Read from the original
        // column slot via originalIndex so disabled-column filtering doesn't
        // misalign explicit-width lookups.
        const explicitWidth = col.hasExplicitWidth ? (cols[col.originalIndex]?.width ?? 0) : 0;

        return { probeTdWidth, probeThWidth, explicitWidth };
      });

      const newWidths = computeColumnWidths(inputs, containerWidth);
      setMeasuredWidths(newWidths);
    };

    measure();

    const wrapperEl = wrapperRef.current;
    if (!wrapperEl || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(wrapperEl);
    return () => ro.disconnect();
  }, [probeColumns, formattedOptions, wrapperRef]);

  // Apply measured widths to grid options. Always return a fresh options
  // reference (and a fresh columns array with fresh column objects) so
  // react-grid-lite's `useEffect([options])` fires when widths change.
  // Widths are written back via probe.originalIndex so disabled-column
  // filtering keeps the index mapping accurate.
  const sizedOptions = useMemo<GridOptions>(() => {
    if (!measuredWidths || !probeColumns) return formattedOptions;

    const cols = formattedOptions.columns as Array<{ id: string; width?: number }> | undefined;
    if (!cols) return formattedOptions;

    const widthByOriginalIndex = new Map<number, number>();
    probeColumns.forEach((col, probeIdx) => {
      const w = measuredWidths[probeIdx];
      if (typeof w === 'number') widthByOriginalIndex.set(col.originalIndex, w);
    });

    return {
      ...formattedOptions,
      columns: cols.map((col, i) => {
        const w = widthByOriginalIndex.get(i);
        return typeof w === 'number' ? { ...col, width: w } : col;
      }),
    };
  }, [formattedOptions, measuredWidths, probeColumns]);

  return {
    probeRef,
    probeColumns,
    sizedOptions,
    isMeasured: measuredWidths !== null,
  };
}
