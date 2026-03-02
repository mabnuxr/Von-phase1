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
 *
 * When `anchorRect` is provided, the popup aligns horizontally and vertically
 * to a specific point (e.g. a caret position) inside the relative container
 * using CSS offsets — no portal required.
 */

import React, { useState, useLayoutEffect, useRef } from 'react';
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
  /**
   * When provided, the popup aligns to this viewport rect instead of the
   * sentinel's edges. Placement (above/below) and maxHeight are computed
   * relative to this rect, and a CSS left offset + adjusted margin is applied
   * so the popup appears next to the anchor point (e.g. a caret position).
   * No portal — pure CSS offset via `left` + negative margin adjustment.
   */
  anchorRect?: { left: number; top: number; bottom: number } | null;
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
  anchorRect,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<PopupPlacement>('above');
  const [computedMaxHeight, setComputedMaxHeight] = useState(maxHeightCap);
  // CSS offsets applied when anchorRect is provided
  const [anchorOffset, setAnchorOffset] = useState<{ left: number; verticalMargin: number } | null>(
    null
  );

  useLayoutEffect(() => {
    if (!isOpen || !sentinelRef.current) return;

    const updatePlacement = () => {
      if (!sentinelRef.current) return;
      const sentinelRect = sentinelRef.current.getBoundingClientRect();

      if (anchorRect) {
        // Compute placement relative to the caret/anchor point
        const spaceAbove = anchorRect.top;
        const spaceBelow = window.innerHeight - anchorRect.bottom;

        const prefersAbove = spaceAbove >= minHeight + margin && spaceAbove >= spaceBelow;
        const canGoBelow = spaceBelow >= minHeight + margin;

        let p: PopupPlacement;
        let mh: number;
        if (prefersAbove) {
          p = 'above';
          mh = Math.min(spaceAbove - margin, maxHeightCap);
        } else if (canGoBelow) {
          p = 'below';
          mh = Math.min(spaceBelow - margin, maxHeightCap);
        } else if (spaceAbove >= spaceBelow) {
          p = 'above';
          mh = Math.max(minHeight, spaceAbove - margin);
        } else {
          p = 'below';
          mh = Math.max(minHeight, spaceBelow - margin);
        }

        setPlacement(p);
        setComputedMaxHeight(mh);

        // Horizontal: shift popup so its left edge aligns with the caret
        const left = anchorRect.left - sentinelRect.left;

        // Vertical: adjust margin so the gap is relative to the caret, not the sentinel edge
        // For "above": default popup bottom = sentinelRect.top - margin (in viewport)
        //   We want:  popup bottom = anchorRect.top - margin
        //   => verticalMargin = margin - (anchorRect.top - sentinelRect.top)
        // For "below": default popup top = sentinelRect.bottom + margin (in viewport)
        //   We want:  popup top = anchorRect.bottom + margin
        //   => verticalMargin = margin - (sentinelRect.bottom - anchorRect.bottom)
        const verticalMargin =
          p === 'above'
            ? margin - (anchorRect.top - sentinelRect.top)
            : margin - (sentinelRect.bottom - anchorRect.bottom);

        setAnchorOffset({ left, verticalMargin });
      } else {
        const result = computePlacement(sentinelRect, minHeight, maxHeightCap, margin);
        setPlacement(result.placement);
        setComputedMaxHeight(result.maxHeight);
        setAnchorOffset(null);
      }
    };

    // Throttle resize recalculations to one per animation frame
    let rafId: number | null = null;
    const handleResize = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updatePlacement);
    };

    updatePlacement();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isOpen, minHeight, maxHeightCap, margin, anchorRect]);

  const isAbove = placement === 'above';

  // When anchorOffset is active, drop `left-0 right-0` so the popup is
  // only as wide as its content (not stretched edge-to-edge).
  const positionClass = anchorOffset
    ? isAbove
      ? 'absolute bottom-full'
      : 'absolute top-full'
    : isAbove
      ? 'absolute bottom-full left-0 right-0'
      : 'absolute top-full left-0 right-0';

  const positionStyle: React.CSSProperties = anchorOffset
    ? {
        left: anchorOffset.left,
        ...(isAbove
          ? { marginBottom: anchorOffset.verticalMargin }
          : { marginTop: anchorOffset.verticalMargin }),
      }
    : isAbove
      ? { marginBottom: margin }
      : { marginTop: margin };

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
