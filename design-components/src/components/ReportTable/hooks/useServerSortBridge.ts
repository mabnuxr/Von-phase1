import { useCallback, useEffect, useRef } from 'react';
import { addEvent } from '@highcharts/grid-lite/es-modules/Shared/Utilities.js';

// Grid Lite's classes aren't typed in the React wrapper's exports, so we
// describe just the surface this hook touches.
type GridInstance = unknown;

/** addEvent returns a cleanup function. */
type RemoveEvent = () => void;

interface AfterSortEvent {
  target?: { id?: string };
  order?: 'asc' | 'desc' | null;
}

/**
 * Bridges Grid Lite's `afterSort` event into a parent-level callback so the
 * parent can re-fetch server-sorted data. Returns a stable `handleGridReady`
 * to pass to <Grid callback={...}>.
 *
 * Grid Lite reinitializes the grid instance on options changes, so the
 * callback re-fires; we rebind by removing the previous listener first.
 *
 * The latest `onSortChange` is captured in a ref so consumers don't need
 * to memoize their callback to keep the listener stable.
 */
export function useServerSortBridge(
  onSortChange: ((columnId: string, order: 'asc' | 'desc' | null) => void) | undefined
) {
  const onSortChangeRef = useRef(onSortChange);
  onSortChangeRef.current = onSortChange;

  const removeEventRef = useRef<RemoveEvent | null>(null);

  const handleGridReady = useCallback((grid: GridInstance) => {
    removeEventRef.current?.();
    removeEventRef.current = null;

    if (!onSortChangeRef.current) return;

    removeEventRef.current = addEvent(grid, 'afterSort', (e: AfterSortEvent) => {
      const columnId = e?.target?.id;
      const order = e?.order ?? null;
      if (columnId) {
        onSortChangeRef.current?.(columnId, order);
      }
    }) as RemoveEvent;
  }, []);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      removeEventRef.current?.();
    };
  }, []);

  return { handleGridReady };
}
