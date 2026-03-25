import React, { useRef, useState, useCallback, useLayoutEffect } from 'react';
import { Tooltip } from '../Tooltip/Tooltip';

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
 * tooltip **only when the text is actually truncated**. Uses the shared Tooltip
 * component with auto-placement so the tooltip never clips out of the viewport.
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

  // ── Truncation detection ────────────────────────────────────────────────────

  const checkTruncation = useCallback(() => {
    const el = textRef.current;
    if (!el) return;
    const truncated =
      maxLines === 1 ? el.scrollWidth > el.clientWidth : el.scrollHeight > el.clientHeight;
    setIsTruncated(truncated);
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
          overflowWrap: 'break-word',
        }
      : {};

  const textElement = (
    <div
      ref={textRef}
      className={`${maxLines === 1 ? 'truncate' : ''} ${isTruncated ? 'cursor-pointer' : ''} ${className}`}
      style={multiLineStyle}
    >
      {children}
    </div>
  );

  if (isTruncated && tooltipContent) {
    return (
      <Tooltip content={tooltipContent} placement="auto">
        {textElement}
      </Tooltip>
    );
  }

  return textElement;
};
