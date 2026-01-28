import { useState, useCallback, useEffect, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface UseHorizontalResizeOptions {
  /** Initial width in pixels */
  initialWidth?: number;
  /** Minimum width in pixels */
  minWidth?: number;
  /** Maximum width in pixels or percentage of viewport */
  maxWidth?: number;
  /** Storage key for persisting width */
  storageKey?: string;
}

export interface UseHorizontalResizeReturn {
  /** Current width in pixels */
  width: number;
  /** Whether the user is currently dragging */
  isDragging: boolean;
  /** Props to spread on the resize handle element */
  handleProps: {
    onMouseDown: (e: React.MouseEvent) => void;
    style: React.CSSProperties;
  };
  /** Reset width to initial value */
  resetWidth: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_INITIAL_WIDTH = 680;
const DEFAULT_MIN_WIDTH = 400;
const DEFAULT_MAX_WIDTH_PERCENTAGE = 0.9; // 90% of viewport

// ============================================================================
// Hook
// ============================================================================

/**
 * useHorizontalResize - Hook for horizontal resize functionality
 *
 * Provides drag-to-resize behavior for panels/drawers with:
 * - Min/max width constraints
 * - Optional localStorage persistence
 * - Smooth cursor handling during drag
 */
export function useHorizontalResize(
  options: UseHorizontalResizeOptions = {}
): UseHorizontalResizeReturn {
  const {
    initialWidth = DEFAULT_INITIAL_WIDTH,
    minWidth = DEFAULT_MIN_WIDTH,
    maxWidth,
    storageKey,
  } = options;

  // Load persisted width or use initial
  const getInitialWidth = useCallback(() => {
    if (storageKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= minWidth) {
          return parsed;
        }
      }
    }
    return initialWidth;
  }, [storageKey, initialWidth, minWidth]);

  const [width, setWidth] = useState(getInitialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Calculate max width based on viewport
  const getMaxWidth = useCallback(() => {
    if (typeof window === 'undefined') return maxWidth || 1200;
    return maxWidth || window.innerWidth * DEFAULT_MAX_WIDTH_PERCENTAGE;
  }, [maxWidth]);

  // Handle mouse down on resize handle
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      startXRef.current = e.clientX;
      startWidthRef.current = width;

      // Add grabbing cursor to body during drag
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    },
    [width]
  );

  // Handle mouse move during drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate new width (dragging left increases width for right-aligned drawer)
      const deltaX = startXRef.current - e.clientX;
      const newWidth = Math.max(minWidth, Math.min(getMaxWidth(), startWidthRef.current + deltaX));

      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      // Persist width if storage key provided
      if (storageKey) {
        localStorage.setItem(storageKey, width.toString());
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minWidth, getMaxWidth, storageKey, width]);

  // Reset to initial width
  const resetWidth = useCallback(() => {
    setWidth(initialWidth);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  }, [initialWidth, storageKey]);

  return {
    width,
    isDragging,
    handleProps: {
      onMouseDown: handleMouseDown,
      style: {
        cursor: 'ew-resize',
      },
    },
    resetWidth,
  };
}
