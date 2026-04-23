import { useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { AUTO_SCROLL_THRESHOLD_PX } from '../constants';

interface UseStickToBottomOptions {
  /** When true, the hook is inert — no snapping, no observers. */
  disabled?: boolean;
}

interface UseStickToBottomReturn {
  ref: React.RefObject<HTMLDivElement | null>;
  /** Clear the user-scrolled-up flag so auto-snap resumes. Call after a programmatic scroll to bottom. */
  resetUserScroll: () => void;
}

/**
 * Keeps a scroll container pinned to the bottom as content grows, unless
 * the user has scrolled up. User intent is detected from wheel/touch/key
 * events rather than `scroll` because programmatic scrolls race with
 * pending mutations during rapid content growth.
 */
export function useStickToBottom({
  disabled = false,
}: UseStickToBottomOptions = {}): UseStickToBottomReturn {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userHasScrolledRef = useRef(false);

  const resetUserScroll = useCallback(() => {
    userHasScrolledRef.current = false;
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const checkUserPosition = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      userHasScrolledRef.current = distanceFromBottom >= AUTO_SCROLL_THRESHOLD_PX;
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

    userHasScrolledRef.current = false;

    let rafId = 0;
    const snap = () => {
      if (rafId !== 0) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        if (userHasScrolledRef.current) return;
        const target = container.scrollHeight - container.clientHeight;
        if (container.scrollTop !== target) {
          container.scrollTop = target;
        }
      });
    };

    // Snap synchronously once pre-paint so reopened views don't flash at the top.
    const initialTarget = container.scrollHeight - container.clientHeight;
    if (container.scrollTop !== initialTarget) {
      container.scrollTop = initialTarget;
    }

    const mutationObserver = new MutationObserver(snap);
    mutationObserver.observe(container, { childList: true, subtree: true });

    // A max-height cap means the container's own size stops changing once capped,
    // but its children keep growing — observe them directly.
    const resizeObserver = new ResizeObserver(snap);
    resizeObserver.observe(container);
    for (const child of Array.from(container.children)) {
      resizeObserver.observe(child);
    }

    const childListObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of Array.from(m.addedNodes)) {
          if (node instanceof Element) resizeObserver.observe(node);
        }
        for (const node of Array.from(m.removedNodes)) {
          if (node instanceof Element) resizeObserver.unobserve(node);
        }
      }
    });
    childListObserver.observe(container, { childList: true });

    return () => {
      if (rafId !== 0) cancelAnimationFrame(rafId);
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      childListObserver.disconnect();
    };
  }, [disabled]);

  return { ref: scrollContainerRef, resetUserScroll };
}
