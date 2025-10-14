import { useEffect, useRef } from "react";
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
 * Automatically triggers onLoadMore when the ref element becomes visible
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
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Don't observe if no more items or currently loading
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Trigger load more when element is visible
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: INFINITE_SCROLL_THRESHOLD },
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    // Cleanup observer on unmount or dependency change
    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, onLoadMore]);

  return observerRef;
}
