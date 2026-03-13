import { useRef, useState, useCallback, useEffect } from "react";

interface UseResizablePaneOptions {
  /** Default width as a percentage of viewport (0–100). */
  defaultPercent?: number;
  /** Minimum width as a percentage of viewport (0–100). */
  minPercent?: number;
  /** Maximum width as a percentage of viewport (0–100). */
  maxPercent?: number;
}

interface UseResizablePaneReturn {
  /** Current width as a CSS percentage string (e.g. "30%"). */
  widthCss: string;
  isResizing: boolean;
  handlePointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  handlePointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  handlePointerUp: (e: React.PointerEvent<HTMLElement>) => void;
}

/**
 * Hook for drag-to-resize pane behavior using pointer capture.
 * Stores width as a viewport percentage — no window access during SSR.
 * The pane resizes from the left edge (dragging left = wider).
 */
export function useResizablePane({
  defaultPercent = 30,
  minPercent = 20,
  maxPercent = 40,
}: UseResizablePaneOptions = {}): UseResizablePaneReturn {
  const [percent, setPercent] = useState(defaultPercent);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startPercentRef = useRef(0);

  useEffect(() => {
    if (isResizing) {
      return () => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isResizing]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      startXRef.current = e.clientX;
      startPercentRef.current = percent;
      setIsResizing(true);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    },
    [percent],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!isResizing) return;
      const deltaX = startXRef.current - e.clientX;
      const deltaPct = (deltaX / window.innerWidth) * 100;
      const newPercent = startPercentRef.current + deltaPct;
      setPercent(Math.min(maxPercent, Math.max(minPercent, newPercent)));
    },
    [isResizing, minPercent, maxPercent],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  return {
    widthCss: `${percent}%`,
    isResizing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
