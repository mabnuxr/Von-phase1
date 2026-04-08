import { useRef, useEffect } from 'react';
import type { TimelineStep } from '../types';

/**
 * Manages auto-scrolling within the thinking process container.
 *
 * Tracks whether the user has manually scrolled away from the bottom
 * and only auto-scrolls when appropriate (during thinking or approval).
 */
export function useTimelineAutoScroll({
  isThinking,
  awaitingApprovalStep,
  isCollapsed,
  visibleSteps,
}: {
  isThinking: boolean;
  awaitingApprovalStep: TimelineStep | undefined;
  isCollapsed: boolean;
  visibleSteps: TimelineStep[];
}): React.RefObject<HTMLDivElement | null> {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userHasScrolledRef = useRef(false);
  const lastScrollTopRef = useRef(0);

  // Track user scroll to detect when they've scrolled away from bottom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const isAtBottom = distanceFromBottom < 50;

      if (!isAtBottom && scrollTop < lastScrollTopRef.current) {
        userHasScrolledRef.current = true;
      }
      if (isAtBottom) {
        userHasScrolledRef.current = false;
      }

      lastScrollTopRef.current = scrollTop;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [visibleSteps.length, isCollapsed]);

  // Reset scroll tracking when thinking starts or an approval step arrives
  useEffect(() => {
    if (isThinking || awaitingApprovalStep) {
      userHasScrolledRef.current = false;
    }
  }, [isThinking, awaitingApprovalStep]);

  // Auto-scroll to bottom (only if user hasn't scrolled away)
  useEffect(() => {
    const shouldAutoScroll = isThinking || !!awaitingApprovalStep;
    if (
      scrollContainerRef.current &&
      !isCollapsed &&
      shouldAutoScroll &&
      !userHasScrolledRef.current
    ) {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current && !userHasScrolledRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      });
    }
  }, [visibleSteps.length, isCollapsed, isThinking, awaitingApprovalStep]);

  return scrollContainerRef;
}
