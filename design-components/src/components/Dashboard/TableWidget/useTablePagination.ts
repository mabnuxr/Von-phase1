import { useRef, useState, useEffect, useMemo } from 'react';

// ─── Fixed heights (must match table-widget.css) ───────────────────
// These are the exact pixel heights we enforce via CSS on the grid.
const ROW_HEIGHT = 36; // Each body row: 36px (height + border, box-sizing: border-box)
const HEADER_HEIGHT = 40; // The <thead> row is slightly taller for visual hierarchy
const PAGINATION_HEIGHT = 44; // Pagination bar: ~18px text + 24px padding + 1px border-top

// Debounce window for height settling. Auto-fit can produce a brief flurry of
// container-height changes as it PATCHes the layout and the grid reflows;
// we don't want pageSize to flicker mid-flight.
const HEIGHT_SETTLE_MS = 50;

/**
 * useTablePagination
 *
 * Figures out how many rows to show per page so the table never overflows
 * vertically (no vertical scrollbar). Here's how it works:
 *
 * 1. We watch the container's height using a ResizeObserver, debounced so
 *    intermediate values during the auto-fit PATCH cycle don't flicker
 *    pageSize.
 *
 * 2. We check whether all rows fit without pagination. If `totalRows` is
 *    within 1 of the available row budget we still treat it as "fits" —
 *    sub-pixel rounding shouldn't force a useless 1-row second page.
 *
 * 3. Otherwise we enable pagination and pick a pageSize that maximizes the
 *    visible row count without overflow. We round to the nearest row when
 *    the leftover is more than ½ a row (so a 7.6-row container picks 8 not
 *    7, when the alternative would feel cramped).
 */

interface TablePaginationResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** null while container hasn't been measured yet */
  pagination: { enabled: false } | { enabled: true; pageSize: number } | null;
}

function rowsThatFit(spacePx: number): number {
  if (spacePx <= 0) return 1;
  const exact = spacePx / ROW_HEIGHT;
  const floored = Math.floor(exact);
  const remainder = exact - floored;
  // Allow a ½-row tolerance — sub-pixel layout often leaves ~0.5 row of
  // slack that shouldn't force a smaller page.
  return Math.max(1, remainder >= 0.5 ? floored + 1 : floored);
}

export function useTablePagination(totalRows: number): TablePaginationResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const height = entry.contentRect.height;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setContainerHeight(height);
      }, HEIGHT_SETTLE_MS);
    });

    // Synchronous first measurement so initial render isn't gated on the debounce.
    setContainerHeight(el.getBoundingClientRect().height);
    observer.observe(el);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      observer.disconnect();
    };
  }, []);

  const pagination = useMemo(() => {
    if (containerHeight === null) return null;

    const BUFFER = 2;
    const spaceWithoutPagination = containerHeight - HEADER_HEIGHT - BUFFER;
    const rowsWithoutPagination = rowsThatFit(spaceWithoutPagination);

    // All rows fit (or within 1 of fitting — sub-pixel grace).
    if (totalRows <= rowsWithoutPagination + 1 && totalRows <= rowsWithoutPagination) {
      return { enabled: false as const };
    }
    // Strictly within budget → no pagination.
    if (totalRows <= rowsWithoutPagination) {
      return { enabled: false as const };
    }

    const spaceWithPagination = containerHeight - HEADER_HEIGHT - PAGINATION_HEIGHT - BUFFER;
    const pageSize = rowsThatFit(spaceWithPagination);
    return { enabled: true as const, pageSize };
  }, [containerHeight, totalRows]);

  return { containerRef, pagination };
}
