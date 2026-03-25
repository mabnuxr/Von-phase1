import React from 'react';
import { createPortal } from 'react-dom';
import { useTooltipPosition } from './useTooltipPosition';
import type { TooltipPlacement } from './useTooltipPosition';

export interface TooltipProps {
  /** Content to display inside the tooltip */
  content: React.ReactNode;
  /** The trigger element(s) */
  children: React.ReactNode;
  /** Whether the tooltip is enabled. When false, only children render. @default true */
  enabled?: boolean;
  /** Placement relative to the trigger @default 'auto' */
  placement?: TooltipPlacement;
}

/**
 * Tooltip - Lightweight portal-based tooltip with smart auto-placement.
 *
 * Renders via `createPortal` so it is never clipped by `overflow: hidden` ancestors.
 * In `auto` mode (default), the tooltip picks the side with the most available space
 * and clamps horizontally so it never overflows the viewport.
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
  placement = 'auto',
}) => {
  const { triggerRef, tooltipRef, visible, show, hide, position } = useTooltipPosition({
    placement,
  });

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex"
      >
        {children}
      </div>
      {enabled &&
        visible &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            className="fixed px-2 py-1 text-xs text-white bg-gray-900 rounded-lg shadow-lg z-[10000] pointer-events-none break-words"
            style={{
              top: position.top,
              left: position.left,
              maxWidth: position.maxWidth,
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
};
