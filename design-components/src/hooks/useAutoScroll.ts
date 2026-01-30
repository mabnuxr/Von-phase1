import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * Configuration for useAutoScroll hook
 */
export interface UseAutoScrollConfig {
  /**
   * Threshold in pixels from bottom to consider "at bottom"
   * @default 100
   */
  threshold?: number;

  /**
   * Threshold for showing scroll-to-bottom button
   * @default 150
   */
  buttonThreshold?: number;

  /**
   * Duration to lock scroll after user sends message (ms)
   * @default 500
   */
  scrollLockDuration?: number;

  /**
   * Whether auto-scroll is enabled
   * @default true
   */
  enabled?: boolean;
}

/**
 * Return type for useAutoScroll hook
 */
export interface UseAutoScrollReturn {
  /**
   * Ref to attach to the scrollable container
   */
  containerRef: React.RefObject<HTMLDivElement | null>;

  /**
   * Ref to attach to the bottom anchor element (optional, for scrollIntoView)
   */
  bottomRef: React.RefObject<HTMLDivElement | null>;

  /**
   * Scroll to bottom of container
   */
  scrollToBottom: (behavior?: ScrollBehavior) => void;

  /**
   * Whether the scroll-to-bottom button should be shown
   */
  showScrollButton: boolean;

  /**
   * Call this before sending a message to ensure scroll to bottom
   */
  onBeforeSend: () => void;

  /**
   * Whether auto-scroll is currently active (user hasn't scrolled up)
   */
  isAutoScrollActive: boolean;
}

/**
 * useAutoScroll - Reusable hook for chat-style auto-scroll behavior
 *
 * Features:
 * - Auto-scrolls to bottom when dependencies change (new messages, streaming)
 * - Disables auto-scroll when user scrolls up
 * - Re-enables when user scrolls back to bottom
 * - Shows scroll-to-bottom button when scrolled up
 * - Handles initial load with delayed scroll for lazy content
 *
 * @example
 * ```tsx
 * const { containerRef, scrollToBottom, showScrollButton, onBeforeSend } = useAutoScroll({
 *   dependencies: [messages],
 *   isStreaming,
 * });
 *
 * return (
 *   <div ref={containerRef} className="overflow-y-auto">
 *     {messages.map(...)}
 *   </div>
 * );
 * ```
 */
export function useAutoScroll(
  /**
   * Dependencies that trigger scroll check (e.g., messages array)
   */
  dependencies: unknown[],
  /**
   * Whether content is currently streaming
   */
  isStreaming: boolean = false,
  /**
   * Configuration options
   */
  config: UseAutoScrollConfig = {}
): UseAutoScrollReturn {
  const {
    threshold = 100,
    buttonThreshold = 150,
    scrollLockDuration = 500,
    enabled = true,
  } = config;

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Track scroll state
  const shouldAutoScrollRef = useRef(true);
  const scrollLockRef = useRef(false);
  const prevScrollHeightRef = useRef(0);

  // UI state
  const [showScrollButton, setShowScrollButton] = useState(false);

  /**
   * Scroll to bottom of container
   */
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const container = containerRef.current;
    if (!container) return;

    const targetScroll = container.scrollHeight - container.clientHeight;

    if (behavior === 'smooth') {
      container.scrollTo({ top: targetScroll, behavior: 'smooth' });
    } else {
      container.scrollTop = targetScroll;
    }
  }, []);

  /**
   * Call before sending a message to ensure scroll
   */
  const onBeforeSend = useCallback(() => {
    shouldAutoScrollRef.current = true;
    scrollLockRef.current = true;

    setTimeout(() => {
      scrollLockRef.current = false;
    }, scrollLockDuration);
  }, [scrollLockDuration]);

  /**
   * Handle scroll events to track user scroll position
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    const handleScroll = () => {
      // Don't update auto-scroll state during scroll lock
      if (scrollLockRef.current) return;

      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;

      // Within threshold of bottom → enable auto-scroll
      shouldAutoScrollRef.current = distanceFromBottom < threshold;

      // Show button when scrolled up past button threshold
      setShowScrollButton(distanceFromBottom > buttonThreshold);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [enabled, threshold, buttonThreshold]);

  /**
   * Use ResizeObserver to detect content height changes
   * This handles lazy-loaded content (markdown, images, etc.)
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    const resizeObserver = new ResizeObserver(() => {
      // Only auto-scroll if enabled and scroll height actually changed
      const newScrollHeight = container.scrollHeight;
      if (newScrollHeight === prevScrollHeightRef.current) return;
      prevScrollHeightRef.current = newScrollHeight;

      // Only scroll if auto-scroll is active
      if (shouldAutoScrollRef.current) {
        // Use requestAnimationFrame for smooth rendering
        requestAnimationFrame(() => {
          scrollToBottom(isStreaming ? 'smooth' : 'auto');
        });
      }
    });

    // Observe the container for size changes
    resizeObserver.observe(container);

    // Also observe children for content changes
    const children = container.children;
    for (let i = 0; i < children.length; i++) {
      resizeObserver.observe(children[i]);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [enabled, isStreaming, scrollToBottom]);

  /**
   * Auto-scroll when dependencies change (new messages added)
   */
  useEffect(() => {
    if (!enabled) return;

    // Check if we have content
    const currentLength = Array.isArray(dependencies[0])
      ? (dependencies[0] as unknown[]).length
      : 1;

    // Skip if no content
    if (currentLength === 0) return;

    // Only scroll if auto-scroll is active
    if (shouldAutoScrollRef.current) {
      // Use requestAnimationFrame to ensure DOM is laid out
      requestAnimationFrame(() => {
        scrollToBottom(isStreaming ? 'smooth' : 'auto');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, isStreaming, enabled, scrollToBottom]);

  return {
    containerRef,
    bottomRef,
    scrollToBottom,
    showScrollButton,
    onBeforeSend,
    isAutoScrollActive: shouldAutoScrollRef.current,
  };
}

export default useAutoScroll;
