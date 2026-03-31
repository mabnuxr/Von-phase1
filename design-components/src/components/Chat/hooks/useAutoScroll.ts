import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AUTO_SCROLL_THRESHOLD_PX, SCROLL_LOCK_DURATION_MS } from '../../../constants';
import type { Message } from '../types';

interface UseAutoScrollOptions {
  messages: Message[];
}

export function useAutoScroll({ messages }: UseAutoScrollOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const shouldAutoScrollRef = useRef(true);
  const scrollOnNewUserMessage = useRef(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

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

  // Listen for scroll events to track user scroll position
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (scrollOnNewUserMessage.current) return;

      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      // Within threshold distance of bottom → enable auto-scroll
      shouldAutoScrollRef.current = distanceFromBottom < AUTO_SCROLL_THRESHOLD_PX;
      // Show scroll-to-bottom button when scrolled up more than 150px
      setShowScrollButton(distanceFromBottom > 150);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // Track previous message count to detect initial load vs incremental updates
  const prevMessageCountRef = useRef(0);

  const isStreaming = useMemo(
    () => messages.some((m) => m.type === 'assistant' && m.isStreaming),
    [messages]
  );

  // Auto-scroll to bottom when new messages arrive or content updates
  useEffect(() => {
    if (messages.length === 0) return;

    const isInitialLoad = prevMessageCountRef.current === 0 && messages.length > 0;
    const isNewMessage = messages.length > prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;

    // Always scroll to bottom when new messages are added or streaming, unless user has scrolled up
    if (shouldAutoScrollRef.current) {
      if (isInitialLoad || scrollOnNewUserMessage.current) {
        // Instant scroll for initial load and new message sends — no animation lag
        scrollToBottom('auto');
        if (isInitialLoad) {
          // Scroll again after lazy content loads (markdown, images)
          setTimeout(() => scrollToBottom('auto'), 100);
        }
      } else if (isStreaming || isNewMessage) {
        // Smooth scroll for streaming updates
        requestAnimationFrame(() => {
          scrollToBottom('smooth');
        });
      }
    }
  }, [messages, scrollToBottom, isStreaming]);

  /** Call before dispatching a user message to force-scroll to bottom */
  const prepareForNewMessage = useCallback(() => {
    shouldAutoScrollRef.current = true;
    scrollOnNewUserMessage.current = true;

    setTimeout(() => {
      scrollOnNewUserMessage.current = false;
    }, SCROLL_LOCK_DURATION_MS);
  }, []);

  return {
    containerRef,
    messagesEndRef,
    showScrollButton,
    isStreaming,
    scrollToBottom,
    prepareForNewMessage,
  };
}
