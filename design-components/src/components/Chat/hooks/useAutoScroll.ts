import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AUTO_SCROLL_THRESHOLD_PX } from '../../../constants';
import { useStickToBottom } from '../../../hooks/useStickToBottom';
import type { Message } from '../types';

interface UseAutoScrollOptions {
  messages: Message[];
}

export function useAutoScroll({ messages }: UseAutoScrollOptions) {
  const containerRef = useStickToBottom();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const isStreaming = useMemo(
    () => messages.some((m) => m.type === 'assistant' && m.isStreaming),
    [messages]
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const container = containerRef.current;
    if (!container) return;
    const target = container.scrollHeight - container.clientHeight;
    if (behavior === 'smooth') {
      container.scrollTo({ top: target, behavior: 'smooth' });
    } else {
      container.scrollTop = target;
    }
  }, [containerRef]);

  // Keep the scroll-to-bottom button visibility in sync with scroll position.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollButton(distanceFromBottom > 150);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [containerRef]);

  /**
   * Call before dispatching a user message. Forces a snap even if the
   * user was scrolled up, so their new message lands in view.
   */
  const prepareForNewMessage = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom >= AUTO_SCROLL_THRESHOLD_PX) {
      el.scrollTop = el.scrollHeight;
    }
  }, [containerRef]);

  return {
    containerRef,
    messagesEndRef,
    showScrollButton,
    isStreaming,
    scrollToBottom,
    prepareForNewMessage,
  };
}
