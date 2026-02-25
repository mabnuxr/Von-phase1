import { useRef, useState, useCallback } from "react";

interface UseResizablePaneOptions {
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

interface UseResizablePaneReturn {
  width: number;
  isResizing: boolean;
  handlePointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  handlePointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  handlePointerUp: (e: React.PointerEvent<HTMLElement>) => void;
}

/**
 * Hook for drag-to-resize pane behavior using pointer capture.
 * Pointer capture directs all pointer events to the handle element,
 * avoiding document-level listeners entirely.
 *
 * The pane resizes from the left edge (dragging left = wider).
 */
export function useResizablePane({
  defaultWidth = 380,
  minWidth = 280,
  maxWidth = 600,
}: UseResizablePaneOptions = {}): UseResizablePaneReturn {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      startXRef.current = e.clientX;
      startWidthRef.current = width;
      setIsResizing(true);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    },
    [width],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!isResizing) return;
      const deltaX = startXRef.current - e.clientX;
      setWidth(
        Math.min(maxWidth, Math.max(minWidth, startWidthRef.current + deltaX)),
      );
    },
    [isResizing, minWidth, maxWidth],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  return {
    width,
    isResizing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
