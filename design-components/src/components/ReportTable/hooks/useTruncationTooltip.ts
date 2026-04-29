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

/** Pick the inner element whose overflow we actually care about.
 *  - For body cells: Grid Lite's default formatter wraps text in an element
 *    with overflow:hidden, so the td's own scrollWidth/clientWidth doesn't
 *    reveal truncation. We check the td plus its first child.
 *  - For header cells: the truncation lives on `.hcg-header-cell-content`
 *    specifically — the th's scrollWidth includes the sort-icon affordance
 *    which would falsely report "truncated" even on short labels. */
function detectTruncatedTarget(cell: HTMLElement): HTMLElement | null {
  const tag = cell.tagName;
  if (tag === 'TH') {
    const content = cell.querySelector('.hcg-header-cell-content') as HTMLElement | null;
    if (content && content.scrollWidth > content.clientWidth) return content;
    return null;
  }
  // td
  if (cell.scrollWidth > cell.clientWidth) return cell;
  const firstChild = cell.firstElementChild as HTMLElement | null;
  if (firstChild !== null && firstChild.scrollWidth > firstChild.clientWidth) {
    return firstChild;
  }
  return null;
}

/** Closest ancestor cell — header cell takes precedence over body cell so
 *  we never pick up a stray td from inside a th's contents (defensive). */
function findHostCell(target: HTMLElement): HTMLElement | null {
  return (target.closest('th, td') as HTMLElement | null) ?? null;
}

/**
 * Reproduces the TruncateWithText hover tooltip for Grid Lite cells (body
 * and header) whose content overflows.
 *
 * Tooltip is cleared when the user scrolls the grid viewport so it doesn't
 * visually detach from its anchor cell.
 *
 * Set `disabled=true` when a custom expand-popover is taking over (e.g.
 * dashboard widgets that show a click-to-expand modal instead). The header
 * tooltip stays enabled even when `disabled` is true since the expand
 * popover is a body-cell affordance and headers still need a tooltip
 * fallback to read truncated labels.
 */
export function useTruncationTooltip(
  wrapperRef: RefObject<HTMLDivElement | null>,
  disabled: boolean,
): UseTruncationTooltipResult {
  const [tooltip, setTooltip] = useState<TruncationTooltipState | null>(null);
  const lastHoveredCell = useRef<HTMLElement | null>(null);

  const onMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      const cell = findHostCell(e.target as HTMLElement);
      if (!cell || cell === lastHoveredCell.current) return;
      // Body-cell tooltips are suppressed when the consumer takes over with
      // a custom popover; header-cell tooltips always run since they're the
      // only fallback for reading truncated header labels.
      if (disabled && cell.tagName === 'TD') return;
      lastHoveredCell.current = cell;

      const truncatedEl = detectTruncatedTarget(cell);
      if (!truncatedEl) return;

      // Prefer explicit data-tooltip (set by owner / multiPicklist cells
      // where textContent concatenates avatar initials or tag text without
      // separators).
      const tooltipEl = cell.querySelector('[data-tooltip]') as HTMLElement | null;
      const text = tooltipEl?.getAttribute('data-tooltip') || cell.textContent?.trim();
      if (!text) return;

      const rect = cell.getBoundingClientRect();
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
    const cell = findHostCell(e.target as HTMLElement);
    const related = (e.relatedTarget as HTMLElement | null)
      ? findHostCell(e.relatedTarget as HTMLElement)
      : null;
    // Only clear when truly leaving the cell — not when moving between
    // child elements of the same cell.
    if (cell && cell !== related) {
      lastHoveredCell.current = null;
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
      lastHoveredCell.current = null;
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
