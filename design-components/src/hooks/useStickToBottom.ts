import { useRef, useEffect, useLayoutEffect } from 'react';

const AT_BOTTOM_THRESHOLD_PX = 50;

interface UseStickToBottomOptions {
  /**
   * When true, the hook is inert — no snapping, no observers. Useful when
   * the container is collapsed/hidden. When this flips back to false, the
   * hook snaps to bottom again (so re-expanding a collapsed timeline lands
   * you at the bottom).
   */
  disabled?: boolean;
}

/**
 * Keeps a scroll container pinned to the bottom as content grows, unless
 * the user has scrolled up.
 *
 * On mount, the container is snapped to bottom synchronously (pre-paint)
 * so reopened views don't flash at the top. A MutationObserver plus a
 * ResizeObserver on both the container and its inner content wrapper
 * catch subsequent content growth — including growth that doesn't change
 * the container's own clientHeight (e.g. when a max-height cap is hit).
 *
 * User intent is detected from `wheel`/`touchmove`/`keydown` rather than
 * the `scroll` event, because during rapid content growth programmatic
 * scrolls race with pending mutations and the `scroll` event's
 * distance-from-bottom reading is unreliable.
 */
export function useStickToBottom({
  disabled = false,
}: UseStickToBottomOptions = {}): React.RefObject<HTMLDivElement | null> {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userHasScrolledRef = useRef(false);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const checkUserPosition = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      userHasScrolledRef.current = distanceFromBottom >= AT_BOTTOM_THRESHOLD_PX;
    };

    const onUserScroll = () => {
      queueMicrotask(checkUserPosition);
    };

    container.addEventListener('wheel', onUserScroll, { passive: true });
    container.addEventListener('touchmove', onUserScroll, { passive: true });
    container.addEventListener('keydown', onUserScroll);

    return () => {
      container.removeEventListener('wheel', onUserScroll);
      container.removeEventListener('touchmove', onUserScroll);
      container.removeEventListener('keydown', onUserScroll);
    };
  }, []);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || disabled) return;

    const snap = () => {
      if (disabledRef.current || userHasScrolledRef.current) return;
      container.scrollTop = container.scrollHeight;
    };

    snap();

    const mutationObserver = new MutationObserver(snap);
    mutationObserver.observe(container, { childList: true, subtree: true });

    // Observe the container itself for clientHeight changes, plus every
    // direct child for scrollHeight-changing content growth. When the
    // container has a max-height cap, its own size stops changing once
    // capped, but its children keep growing — we still need to snap.
    const resizeObserver = new ResizeObserver(snap);
    resizeObserver.observe(container);
    for (const child of Array.from(container.children)) {
      resizeObserver.observe(child);
    }

    // Re-observe children when they're added.
    const childListObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of Array.from(m.addedNodes)) {
          if (node instanceof Element) resizeObserver.observe(node);
        }
      }
    });
    childListObserver.observe(container, { childList: true });

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      childListObserver.disconnect();
    };
  }, [disabled]);

  return scrollContainerRef;
}
