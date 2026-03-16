import { useRef, useState, useEffect, useMemo } from 'react';

// ─── Fixed heights (must match table-widget.css) ───────────────────
// These are the exact pixel heights we enforce via CSS on the grid.
const ROW_HEIGHT = 30; // Each body row: 30px (height + border, box-sizing: border-box)
const HEADER_HEIGHT = 30; // The <thead> row: same 30px
const PAGINATION_HEIGHT = 44; // Pagination bar: ~18px text + 24px padding + 1px border-top

/**
 * useTablePagination
 *
 * Figures out how many rows to show per page so the table never overflows
 * vertically (no vertical scrollbar). Here's how it works in plain English:
 *
 * 1. We watch the container's height using a ResizeObserver.
 *    → This tells us exactly how many pixels we have to work with.
 *
 * 2. We check: can ALL rows fit without needing pagination?
 *    → availableForRows = containerHeight − headerHeight
 *    → If totalRows ≤ floor(availableForRows / rowHeight), we disable pagination.
 *
 * 3. If not all rows fit, we enable pagination and shrink the row budget
 *    by subtracting the pagination bar height:
 *    → availableForRows = containerHeight − headerHeight − paginationHeight
 *    → pageSize = floor(availableForRows / rowHeight)
 *
 * We subtract an extra 2px safety buffer to avoid sub-pixel rounding issues
 * that can cause a partial row to peek out and trigger a scrollbar.
 */

interface TablePaginationResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** null while container hasn't been measured yet */
  pagination: { enabled: false } | { enabled: true; pageSize: number } | null;
}

export function useTablePagination(totalRows: number): TablePaginationResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);

  // Step 1: Measure the container height whenever it changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Step 2 & 3: Calculate pagination config
  const pagination = useMemo(() => {
    if (containerHeight === null) return null;

    const BUFFER = 2; // safety margin for sub-pixel rendering

    // How many rows fit if we DON'T show the pagination bar?
    const spaceWithoutPagination = containerHeight - HEADER_HEIGHT - BUFFER;
    const rowsWithoutPagination = Math.max(1, Math.floor(spaceWithoutPagination / ROW_HEIGHT));

    // All rows fit → no pagination needed
    if (totalRows <= rowsWithoutPagination) {
      return { enabled: false as const };
    }

    // Not all rows fit → enable pagination, subtract pagination bar height
    const spaceWithPagination = containerHeight - HEADER_HEIGHT - PAGINATION_HEIGHT - BUFFER;
    const pageSize = Math.max(1, Math.floor(spaceWithPagination / ROW_HEIGHT));

    return { enabled: true as const, pageSize };
  }, [containerHeight, totalRows]);

  return { containerRef, pagination };
}
