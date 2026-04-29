import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { TruncationTooltipState } from '../components/TruncationTooltip';

interface UseTruncationTooltipResult {
  /** Current tooltip — pass to <TruncationTooltip>. Null when no cell is hovered
   *  or the hovered cell isn't truncated. */
  tooltip: TruncationTooltipState | null;
  /** Wire onto the wrapper's onMouseOver. */
  onMouseEnter: (e: React.MouseEvent) => void;
  /** Wire onto the wrapper's onMouseOut. */
  onMouseLeave: (e: React.MouseEvent) => void;
}

/**
 * Reproduces the TruncateWithText hover tooltip for Grid Lite cells whose
 * content overflows. The default cell formatter wraps text in an inner
 * element with overflow:hidden, so we check both the `<td>` itself and its
 * first child.
 *
 * Tooltip is cleared when the user scrolls the grid viewport so it doesn't
 * detach from its anchor cell.
 *
 * Set `disabled=true` when a custom expand-popover is taking over (e.g.
 * dashboard widgets that show a click-to-expand modal instead).
 */
export function useTruncationTooltip(
  wrapperRef: RefObject<HTMLDivElement | null>,
  disabled: boolean,
): UseTruncationTooltipResult {
  const [tooltip, setTooltip] = useState<TruncationTooltipState | null>(null);
  const lastHoveredTd = useRef<HTMLElement | null>(null);

  const onMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      const td = (e.target as HTMLElement).closest('td') as HTMLElement | null;
      if (!td || td === lastHoveredTd.current) return;
      lastHoveredTd.current = td;

      // The default Grid Lite formatter wraps text in an inner element with
      // overflow:hidden, so the td's scrollWidth equals clientWidth even
      // when content is clipped. Check both td and its first child.
      const firstChild = td.firstElementChild as HTMLElement | null;
      const isTruncated =
        td.scrollWidth > td.clientWidth ||
        (firstChild !== null && firstChild.scrollWidth > firstChild.clientWidth);
      if (!isTruncated) return;

      // Prefer explicit data-tooltip (set by owner / multiPicklist cells
      // where textContent concatenates avatar initials or tag text without
      // separators).
      const tooltipEl = td.querySelector('[data-tooltip]') as HTMLElement | null;
      const text = tooltipEl?.getAttribute('data-tooltip') || td.textContent?.trim();
      if (!text) return;

      const rect = td.getBoundingClientRect();
      setTooltip({
        text,
        top: rect.top - 6,
        left: rect.left,
        width: rect.width,
      });
    },
    [disabled],
  );

  const onMouseLeave = useCallback((e: React.MouseEvent) => {
    const td = (e.target as HTMLElement).closest('td') as HTMLElement | null;
    const related = (e.relatedTarget as HTMLElement | null)?.closest?.('td');
    // Only clear when truly leaving the cell — not when moving between
    // child elements of the same cell.
    if (td && td !== related) {
      lastHoveredTd.current = null;
      setTooltip(null);
    }
  }, []);

  // Clear on scroll so the tooltip doesn't visually detach from its anchor.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const viewport = wrapper.querySelector('.hcg-scrollable-content');
    if (!viewport) return;

    const onScroll = () => {
      lastHoveredTd.current = null;
      setTooltip(null);
    };
    viewport.addEventListener('scroll', onScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', onScroll);
    // wrapperRef is stable so we depend on its current value implicitly; we
    // re-bind only on mount/unmount which matches the original behavior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { tooltip, onMouseEnter, onMouseLeave };
}
