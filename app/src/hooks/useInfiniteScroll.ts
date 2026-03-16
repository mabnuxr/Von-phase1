import { useCallback, useRef } from "react";
import { INFINITE_SCROLL_THRESHOLD } from "../config/constants";

/**
 * Options for infinite scroll behavior
 */
interface UseInfiniteScrollOptions {
  /** Callback to load more items */
  onLoadMore: () => void;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Whether currently loading */
  isLoading: boolean;
}

/**
 * Hook for infinite scroll using Intersection Observer
 *
 * Uses a callback ref so the observer is correctly attached whenever
 * the sentinel element mounts (e.g. after a collapsed sidebar expands).
 *
 * @example
 * ```tsx
 * const loadMoreRef = useInfiniteScroll({
 *   onLoadMore: () => fetchNextPage(),
 *   hasMore: !!hasNextPage,
 *   isLoading: isFetchingNextPage,
 * });
 *
 * return (
 *   <div>
 *     {items.map(item => <Item key={item.id} {...item} />)}
 *     <div ref={loadMoreRef} style={{ height: '1px' }} />
 *   </div>
 * );
 * ```
 */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const callbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Disconnect previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      // Don't observe if no node, no more items, or currently loading
      if (!node || !hasMore || isLoading) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            onLoadMore();
          }
        },
        { threshold: INFINITE_SCROLL_THRESHOLD },
      );

      observerRef.current.observe(node);
    },
    [hasMore, isLoading, onLoadMore],
  );

  return callbackRef;
}
