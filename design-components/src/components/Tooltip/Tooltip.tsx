import React, { useState, useRef, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

export interface TooltipProps {
  /** Content to display inside the tooltip */
  content: React.ReactNode;
  /** The trigger element(s) */
  children: React.ReactNode;
  /** Whether the tooltip is enabled. When false, only children render. @default true */
  enabled?: boolean;
  /** Placement relative to the trigger @default 'top' */
  placement?: 'top' | 'bottom';
}

/**
 * Tooltip - Lightweight portal-based tooltip.
 *
 * Renders via `createPortal` so it is never clipped by `overflow: hidden` ancestors.
 * Position is recalculated on every mouse-enter to stay accurate after scrolls/resizes.
 *
 * @example
 * ```tsx
 * <Tooltip content="Full text here" enabled={isTruncated}>
 *   <span className="truncate max-w-[120px]">Some long text…</span>
 * </Tooltip>
 * ```
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  enabled = true,
  placement = 'top',
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;

    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top: number;
    if (placement === 'top') {
      top = triggerRect.top - tooltipRect.height - 6;
    } else {
      top = triggerRect.bottom + 6;
    }

    // Center horizontally, clamp to viewport
    let left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));

    setPosition({ top, left });
  }, [placement]);

  // Recalculate position once the tooltip is in the DOM
  useLayoutEffect(() => {
    if (visible) updatePosition();
  }, [visible, updatePosition]);

  if (!enabled) return <>{children}</>;

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="inline-flex"
      >
        {children}
      </div>
      {visible &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            className="fixed px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap z-[10000] pointer-events-none"
            style={{ top: position.top, left: position.left }}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
};
