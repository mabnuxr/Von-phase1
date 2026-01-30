import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// Constants
// ============================================================================

/**
 * Default row height in pixels (padding + font size + borders)
 * Based on: py-2 (8px * 2) + text-[13px] (13px line height ~20px) + border (1px)
 */
const DEFAULT_ROW_HEIGHT = 37;

/**
 * Header height in pixels
 * Based on: py-2 (8px * 2) + text-xs (12px) + border (1px)
 */
const HEADER_HEIGHT = 33;

/**
 * Footer/pagination height in pixels
 * Based on: py-3 (12px * 2) + text content
 */
const FOOTER_HEIGHT = 48;

/**
 * Additional overhead for SQL query section when expanded (rough estimate)
 */
const QUERY_SECTION_OVERHEAD = 60;

/**
 * Minimum rows to display
 */
const MIN_ROWS = 5;

/**
 * Maximum rows to display (for very large screens)
 */
const MAX_ROWS = 50;

/**
 * Default fallback rows per page
 */
const DEFAULT_ROWS = 10;

// ============================================================================
// Types
// ============================================================================

export interface UseDynamicPageSizeOptions {
  /** Custom row height override */
  rowHeight?: number;
  /** Additional overhead to subtract from available height */
  additionalOverhead?: number;
  /** Minimum rows to display */
  minRows?: number;
  /** Maximum rows to display */
  maxRows?: number;
}

export interface UseDynamicPageSizeReturn {
  /** Calculated rows per page based on container height */
  rowsPerPage: number;
  /** Ref to attach to the container element */
  containerRef: React.RefObject<HTMLDivElement | null>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * useDynamicPageSize - Calculates optimal rows per page based on container height
 *
 * This hook measures the available height of a container element and calculates
 * how many table rows can fit while accounting for header, footer, and other overhead.
 *
 * @param options - Configuration options
 * @returns Object with rowsPerPage value and containerRef to attach to element
 *
 * @example
 * ```tsx
 * const { rowsPerPage, containerRef } = useDynamicPageSize();
 *
 * return (
 *   <div ref={containerRef} className="flex-1 h-full">
 *     <Table rowsPerPage={rowsPerPage} />
 *   </div>
 * );
 * ```
 */
export function useDynamicPageSize(
  options: UseDynamicPageSizeOptions = {}
): UseDynamicPageSizeReturn {
  const {
    rowHeight = DEFAULT_ROW_HEIGHT,
    additionalOverhead = QUERY_SECTION_OVERHEAD,
    minRows = MIN_ROWS,
    maxRows = MAX_ROWS,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);

  const calculateRowsPerPage = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return DEFAULT_ROWS;
    }

    const containerHeight = container.clientHeight;

    // Calculate available height for rows
    const availableHeight = containerHeight - HEADER_HEIGHT - FOOTER_HEIGHT - additionalOverhead;

    // Calculate how many rows can fit
    const calculatedRows = Math.floor(availableHeight / rowHeight);

    // Clamp between min and max
    return Math.max(minRows, Math.min(maxRows, calculatedRows));
  }, [rowHeight, additionalOverhead, minRows, maxRows]);

  useEffect(() => {
    // Initial calculation
    const newRowsPerPage = calculateRowsPerPage();
    setRowsPerPage(newRowsPerPage);

    // Set up ResizeObserver for container size changes
    const container = containerRef.current;
    if (!container) return;

    // Track last calculated value to avoid unnecessary state updates
    let lastCalculatedRows = newRowsPerPage;
    let rafId: number | null = null;

    // Debounced resize handler using requestAnimationFrame
    const handleResize = () => {
      // Cancel any pending RAF to debounce rapid-fire events (e.g., during animation)
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        const newRows = calculateRowsPerPage();
        // Only update state if the value actually changed
        if (newRows !== lastCalculatedRows) {
          lastCalculatedRows = newRows;
          setRowsPerPage(newRows);
        }
      });
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Also listen for window resize as fallback
    window.addEventListener('resize', handleResize);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateRowsPerPage]);

  return {
    rowsPerPage,
    containerRef,
  };
}
