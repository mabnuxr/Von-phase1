import { useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface PanelConstraint {
  /** Minimum ratio (0–1) this panel may occupy. @default 0 */
  min?: number;
  /** Maximum ratio (0–1) this panel may occupy. @default 1 */
  max?: number;
}

export interface UsePanelResizeOptions {
  /**
   * Default ratios for each panel. Must sum to 1.
   * Length determines the number of panels.
   * @example [0.4, 0.6]        // two panels
   * @example [0.25, 0.5, 0.25] // three panels
   */
  defaultRatios: number[];
  /**
   * Per-panel min/max constraints.
   * Array indices correspond to panel indices.
   * Panels without an entry are unconstrained.
   */
  constraints?: PanelConstraint[];
  /** Resize direction. @default 'horizontal' */
  direction?: 'horizontal' | 'vertical';
}

export interface HandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  style: React.CSSProperties;
}

export interface UsePanelResizeReturn {
  /** Ref to attach to the outer container element. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Current ratio (0–1) for each panel. */
  ratios: number[];
  /**
   * Returns props to spread on the resize handle between
   * `panel[index]` and `panel[index + 1]`.
   */
  getHandleProps: (index: number) => HandleProps;
  /** Whether any handle is currently being dragged. */
  isDragging: boolean;
  /** Reset all ratios to their defaults. */
  reset: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function clampRatio(ratio: number, constraint?: PanelConstraint): number {
  const min = constraint?.min ?? 0;
  const max = constraint?.max ?? 1;
  return Math.max(min, Math.min(max, ratio));
}

// ============================================================================
// Hook
// ============================================================================

/**
 * usePanelResize — Generic resizable split-panel hook.
 *
 * Supports 2 or more panels in horizontal or vertical orientation.
 * Each panel gets a ratio (0–1) of the container's size.
 * Drag handles between adjacent panels redistribute space between them
 * while respecting per-panel min/max constraints.
 *
 * @example Two-panel horizontal split (chat 40% / dashboard 60%)
 * ```tsx
 * const { containerRef, ratios, getHandleProps } = usePanelResize({
 *   defaultRatios: [0.4, 0.6],
 *   constraints: [{ min: 0.4, max: 0.6 }, { min: 0.4, max: 0.6 }],
 * });
 *
 * return (
 *   <div ref={containerRef} className="flex h-full w-full">
 *     <div style={{ width: `${ratios[0] * 100}%` }}>Left</div>
 *     <div {...getHandleProps(0)} className="w-1 cursor-ew-resize" />
 *     <div style={{ width: `${ratios[1] * 100}%` }}>Right</div>
 *   </div>
 * );
 * ```
 */
export function usePanelResize(options: UsePanelResizeOptions): UsePanelResizeReturn {
  const { defaultRatios, constraints = [], direction = 'horizontal' } = options;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [ratios, setRatios] = useState<number[]>(() =>
    defaultRatios.map((r, i) => clampRatio(r, constraints[i]))
  );

  // Track active listeners so we can clean up on unmount
  const cleanupRef = useRef<(() => void) | null>(null);

  // Re-sync ratios when defaultRatios or constraints change (e.g. slot count changes)
  useEffect(() => {
    setRatios(defaultRatios.map((r, i) => clampRatio(r, constraints[i])));
  }, [defaultRatios, constraints]);

  useEffect(() => {
    return () => {
      // If unmounted while dragging, remove listeners and reset cursor
      cleanupRef.current?.();
    };
  }, []);

  const getHandleProps = useCallback(
    (handleIndex: number): HandleProps => {
      const isHorizontal = direction === 'horizontal';
      const cursor = isHorizontal ? 'ew-resize' : 'ns-resize';

      const onMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        // Clean up any stale drag session (e.g. missed mouseup)
        cleanupRef.current?.();
        const container = containerRef.current;
        if (!container) return;

        // Bounds check: handle must sit between two valid panels
        if (handleIndex < 0 || handleIndex >= ratios.length - 1) return;

        const containerRect = container.getBoundingClientRect();
        const containerSize = isHorizontal ? containerRect.width : containerRect.height;
        const containerStart = isHorizontal ? containerRect.left : containerRect.top;

        // Bail out if container is hidden or not yet laid out
        if (containerSize === 0) return;

        // Snapshot ratios at drag start so we only redistribute between
        // the two panels adjacent to this handle.
        const snapshotRatios = [...ratios];
        const combinedRatio = snapshotRatios[handleIndex] + snapshotRatios[handleIndex + 1];

        // Offset of panels before the handle (in ratio space)
        const precedingRatio = snapshotRatios.slice(0, handleIndex).reduce((sum, r) => sum + r, 0);

        setIsDragging(true);
        document.body.style.cursor = cursor;
        document.body.style.userSelect = 'none';

        const onMouseMove = (ev: MouseEvent) => {
          const clientPos = isHorizontal ? ev.clientX : ev.clientY;
          const posInContainer = clientPos - containerStart;
          const posRatio = posInContainer / containerSize;

          // Desired ratio for panel[handleIndex]
          let leftRatio = posRatio - precedingRatio;
          let rightRatio = combinedRatio - leftRatio;

          // Clamp both panels
          leftRatio = clampRatio(leftRatio, constraints[handleIndex]);
          rightRatio = combinedRatio - leftRatio;
          rightRatio = clampRatio(rightRatio, constraints[handleIndex + 1]);
          leftRatio = combinedRatio - rightRatio;
          // Re-clamp left after right adjustment
          leftRatio = clampRatio(leftRatio, constraints[handleIndex]);
          rightRatio = combinedRatio - leftRatio;

          const next = [...snapshotRatios];
          next[handleIndex] = leftRatio;
          next[handleIndex + 1] = rightRatio;
          setRatios(next);
        };

        const teardown = () => {
          setIsDragging(false);
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
          cleanupRef.current = null;
        };

        const onMouseUp = () => {
          teardown();
        };

        // Store teardown so unmount can call it
        cleanupRef.current = teardown;

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      };

      return {
        onMouseDown,
        style: { cursor },
      };
    },
    [ratios, constraints, direction]
  );

  const reset = useCallback(() => {
    setRatios(defaultRatios.map((r, i) => clampRatio(r, constraints[i])));
  }, [defaultRatios, constraints]);

  return {
    containerRef,
    ratios,
    getHandleProps,
    isDragging,
    reset,
  };
}
