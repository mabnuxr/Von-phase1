import { useRef, useState, useCallback, useLayoutEffect } from 'react';

export type TooltipPlacement = 'top' | 'bottom' | 'auto';

export interface TooltipPosition {
  top: number;
  left: number;
  maxWidth: number;
}

const EDGE_PADDING = 8;
const GAP = 6;

/**
 * useTooltipPosition — computes viewport-safe coordinates for a portal tooltip.
 *
 * - **Vertical**: `auto` (default) picks whichever side (top/bottom) has more
 *   room, then clamps so the tooltip never overflows the viewport.
 * - **Horizontal**: centers on the trigger, then clamps to keep the tooltip
 *   within `EDGE_PADDING` of each viewport edge.
 *
 * Returns refs for the trigger and tooltip elements, visibility state with
 * show/hide helpers, and a `position` object to spread onto the tooltip style.
 *
 * @example
 * ```tsx
 * const { triggerRef, tooltipRef, visible, show, hide, position } =
 *   useTooltipPosition({ placement: 'auto' });
 * ```
 */
export function useTooltipPosition(opts: { placement?: TooltipPlacement } = {}) {
  const { placement = 'auto' } = opts;

  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({
    top: 0,
    left: 0,
    maxWidth: typeof window !== 'undefined' ? window.innerWidth - EDGE_PADDING * 2 : 300,
  });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;

    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // ── Vertical placement ──────────────────────────────────────────────────
    let resolved = placement as 'top' | 'bottom';
    if (placement === 'auto') {
      const spaceAbove = triggerRect.top;
      const spaceBelow = vh - triggerRect.bottom;
      const fitsAbove = spaceAbove >= tooltipRect.height + GAP;
      const fitsBelow = spaceBelow >= tooltipRect.height + GAP;
      resolved = fitsAbove
        ? 'top'
        : fitsBelow
          ? 'bottom'
          : spaceAbove >= spaceBelow
            ? 'top'
            : 'bottom';
    }

    let top =
      resolved === 'top' ? triggerRect.top - tooltipRect.height - GAP : triggerRect.bottom + GAP;

    // Clamp vertically
    top = Math.max(EDGE_PADDING, Math.min(top, vh - tooltipRect.height - EDGE_PADDING));

    // ── Horizontal placement ────────────────────────────────────────────────
    let left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    left = Math.max(EDGE_PADDING, Math.min(left, vw - tooltipRect.width - EDGE_PADDING));

    const maxWidth = vw - EDGE_PADDING * 2;

    setPosition({ top, left, maxWidth });
  }, [placement]);

  // Recalculate once the tooltip is painted in the DOM
  useLayoutEffect(() => {
    if (visible) updatePosition();
  }, [visible, updatePosition]);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);

  return { triggerRef, tooltipRef, visible, show, hide, position } as const;
}
