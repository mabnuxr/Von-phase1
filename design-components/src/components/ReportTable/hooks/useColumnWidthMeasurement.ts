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

      // For each column, take the widest TD across all candidate rows.
      // Picking by char length alone misses proportional-font cases where
      // two equal-length strings render at different pixel widths.
      const inputs: ColumnWidthInputs[] = probeColumns.map((col, i) => {
        let probeTdWidth = 0;
        for (const row of probeRows) {
          const td = row.children[i] as HTMLElement | undefined;
          if (td && td.offsetWidth > probeTdWidth) probeTdWidth = td.offsetWidth;
        }
        const probeThWidth = probeThs[i] ? (probeThs[i] as HTMLElement).offsetWidth : 0;

        // Backend-explicit width acts as a floor. Read the live value from
        // formattedOptions so the latest backend column metadata is honored.
        const cols = formattedOptions.columns as Array<{ width?: number }>;
        const explicitWidth = col.hasExplicitWidth ? (cols[i]?.width ?? 0) : 0;

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
  const sizedOptions = useMemo<GridOptions>(() => {
    if (!measuredWidths) return formattedOptions;

    const cols = formattedOptions.columns as Array<{ id: string; width?: number }> | undefined;
    if (!cols) return formattedOptions;

    return {
      ...formattedOptions,
      columns: cols.map((col, i) =>
        i < measuredWidths.length ? { ...col, width: measuredWidths[i] } : col
      ),
    };
  }, [formattedOptions, measuredWidths]);

  return {
    probeRef,
    probeColumns,
    sizedOptions,
    isMeasured: measuredWidths !== null,
  };
}
