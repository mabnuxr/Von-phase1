/**
 * AnchoredPopup
 *
 * A self-positioning popup that measures the available space above and below
 * its anchor (via an internal sentinel div) and picks the better side.
 *
 * Renders a sentinel div that must live inside a `position: relative` container
 * so that measurements are taken against the correct ancestor.
 *
 * Usage:
 * ```tsx
 * // Parent must be position: relative
 * <div className="relative">
 *   <AnchoredPopup isOpen={open} className="w-72 z-50">
 *     {({ maxHeight, placement }) => (
 *       <MyList style={{ maxHeight }} />
 *     )}
 *   </AnchoredPopup>
 * </div>
 * ```
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PopupPlacement = 'above' | 'below';

export interface AnchoredPopupRenderProps {
  /** Calculated max height in px the popup content should respect */
  maxHeight: number;
  /** Which side the popup opened on */
  placement: PopupPlacement;
}

export interface AnchoredPopupProps {
  isOpen: boolean;
  /**
   * Render prop — receives `maxHeight` and `placement`.
   * Use `maxHeight` to cap the scrollable content inside the popup.
   */
  children: (props: AnchoredPopupRenderProps) => React.ReactNode;
  /**
   * Minimum height (px) a side needs before it is considered.
   * If neither side meets this threshold the side with more space wins.
   * @default 150
   */
  minHeight?: number;
  /**
   * Hard cap on the popup's max height regardless of available space.
   * @default 300
   */
  maxHeight?: number;
  /**
   * Gap (px) between the anchor edge and the popup.
   * @default 8
   */
  margin?: number;
  /** Extra Tailwind / CSS classes applied to the popup wrapper (e.g. width, z-index) */
  className?: string;
  /** Framer Motion transition overrides */
  transition?: object;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_MIN_HEIGHT = 150;
const DEFAULT_MAX_HEIGHT = 300;
const DEFAULT_MARGIN = 8;
const DEFAULT_TRANSITION = { duration: 0.15, ease: 'easeOut' } as const;

// ---------------------------------------------------------------------------
// Placement helpers
// ---------------------------------------------------------------------------

function computePlacement(
  rect: DOMRect,
  minHeight: number,
  maxHeightCap: number,
  margin: number
): { placement: PopupPlacement; maxHeight: number } {
  const spaceAbove = rect.top;
  const spaceBelow = window.innerHeight - rect.bottom;

  const prefersAbove = spaceAbove >= minHeight + margin && spaceAbove >= spaceBelow;
  const canGoBelow = spaceBelow >= minHeight + margin;

  if (prefersAbove) {
    return { placement: 'above', maxHeight: Math.min(spaceAbove - margin, maxHeightCap) };
  }
  if (canGoBelow) {
    return { placement: 'below', maxHeight: Math.min(spaceBelow - margin, maxHeightCap) };
  }
  // Fallback: whichever side has more room
  if (spaceAbove >= spaceBelow) {
    return { placement: 'above', maxHeight: Math.max(minHeight, spaceAbove - margin) };
  }
  return { placement: 'below', maxHeight: Math.max(minHeight, spaceBelow - margin) };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AnchoredPopup: React.FC<AnchoredPopupProps> = ({
  isOpen,
  children,
  minHeight = DEFAULT_MIN_HEIGHT,
  maxHeight: maxHeightCap = DEFAULT_MAX_HEIGHT,
  margin = DEFAULT_MARGIN,
  className = '',
  transition = DEFAULT_TRANSITION,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<PopupPlacement>('above');
  const [computedMaxHeight, setComputedMaxHeight] = useState(maxHeightCap);

  useEffect(() => {
    if (!isOpen || !sentinelRef.current) return;
    const rect = sentinelRef.current.getBoundingClientRect();
    const result = computePlacement(rect, minHeight, maxHeightCap, margin);
    setPlacement(result.placement);
    setComputedMaxHeight(result.maxHeight);
  }, [isOpen, minHeight, maxHeightCap, margin]);

  const isAbove = placement === 'above';
  const positionClass = isAbove
    ? 'absolute bottom-full left-0 right-0'
    : 'absolute top-full left-0 right-0';
  const positionStyle = isAbove ? { marginBottom: margin } : { marginTop: margin };
  const motionY = isAbove ? 8 : -8;

  return (
    <>
      {/* Invisible sentinel fills the relative container for measurement */}
      <div ref={sentinelRef} className="absolute inset-0 pointer-events-none" aria-hidden />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`${positionClass} ${className}`}
            style={positionStyle}
            initial={{ opacity: 0, y: motionY }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: motionY }}
            transition={transition}
          >
            {children({ maxHeight: computedMaxHeight, placement })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AnchoredPopup;
