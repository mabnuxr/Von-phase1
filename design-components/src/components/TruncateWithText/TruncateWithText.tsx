import React, { useRef, useState, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

export interface TruncateWithTextProps {
  /** Text or node to display. Pass a string for automatic tooltip content. */
  children: React.ReactNode;
  /**
   * Max number of lines before truncating with an ellipsis.
   * - 1 (default): single-line, `text-overflow: ellipsis`
   * - N > 1: wraps up to N lines, then clamps with ellipsis (`-webkit-line-clamp`)
   */
  maxLines?: number;
  /**
   * Tooltip content shown on hover when the text is truncated.
   * Defaults to `children` when `children` is a plain string.
   */
  tooltip?: React.ReactNode;
  /** Extra classes for the text wrapper element. */
  className?: string;
}

/**
 * TruncateWithText — truncates overflowing text with an ellipsis and shows a
 * portal-based tooltip **only when the text is actually truncated**. The tooltip
 * appears instantly (no delay) and is never clipped by ancestor overflow.
 *
 * @example Single-line
 * ```tsx
 * <TruncateWithText className="w-40">Dashboard: My Long Name</TruncateWithText>
 * ```
 *
 * @example Multi-line (up to 3 lines, then clamp)
 * ```tsx
 * <TruncateWithText maxLines={3} className="w-40">
 *   A very long paragraph that may or may not overflow...
 * </TruncateWithText>
 * ```
 */
export const TruncateWithText: React.FC<TruncateWithTextProps> = ({
  children,
  maxLines = 1,
  tooltip,
  className = '',
}) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; width: number } | null>(
    null
  );

  // ── Truncation detection ────────────────────────────────────────────────────

  const checkTruncation = useCallback(() => {
    const el = textRef.current;
    if (!el) return;
    const truncated =
      maxLines === 1 ? el.scrollWidth > el.clientWidth : el.scrollHeight > el.clientHeight;
    setIsTruncated(truncated);
    if (!truncated) setTooltipPos(null);
  }, [maxLines]);

  useLayoutEffect(() => {
    checkTruncation();
    const ro = new ResizeObserver(checkTruncation);
    if (textRef.current) ro.observe(textRef.current);
    return () => ro.disconnect();
  }, [checkTruncation]);

  // Re-run when children change (content may grow or shrink)
  useLayoutEffect(() => {
    checkTruncation();
  }, [children, checkTruncation]);

  // ── Tooltip positioning ─────────────────────────────────────────────────────

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isTruncated) return;
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltipPos({
        top: rect.top - 6,
        left: rect.left,
        width: rect.width,
      });
    },
    [isTruncated]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltipPos(null);
  }, []);

  // ── Resolve tooltip content ─────────────────────────────────────────────────

  const tooltipContent = tooltip ?? (typeof children === 'string' ? children : null);

  // ── Styles for multi-line clamp ─────────────────────────────────────────────

  const multiLineStyle: React.CSSProperties =
    maxLines > 1
      ? {
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }
      : {};

  return (
    <>
      <div
        ref={textRef}
        className={`${maxLines === 1 ? 'truncate' : ''} ${className}`}
        style={multiLineStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      {tooltipPos &&
        isTruncated &&
        tooltipContent &&
        createPortal(
          <div
            role="tooltip"
            className="fixed z-[10000] px-2 py-1 text-xs text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none break-words"
            style={{
              top: tooltipPos.top,
              left: tooltipPos.left,
              width: tooltipPos.width,
              transform: 'translateY(-100%)',
            }}
          >
            {tooltipContent}
          </div>,
          document.body
        )}
    </>
  );
};
