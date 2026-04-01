import { useMemo } from 'react';
import type { Message } from '../types';

interface UseVisibleMessagesOptions {
  messages: Message[];
  isLoading: boolean;
  showMessagesFromIndex: number;
}

export function useVisibleMessages({
  messages,
  isLoading,
  showMessagesFromIndex,
}: UseVisibleMessagesOptions) {
  return useMemo(() => {
    // Filter messages first
    const filtered = messages
      .map((message, index) => ({
        ...message,
        // Mark messages before showMessagesFromIndex as compressed
        isCompressed: index < showMessagesFromIndex,
        originalIndex: index,
      }))
      .filter((message) => {
        // Hide empty assistant messages when typing indicator is showing
        if (
          isLoading &&
          message.type === 'assistant' &&
          !message.content &&
          !message.reasoningContent
        ) {
          return false;
        }
        return true;
      });

    // Then mark the latest message
    return filtered.map((message, visibleIndex) => ({
      ...message,
      isLatestMessage: visibleIndex === filtered.length - 1,
    }));
  }, [messages, isLoading, showMessagesFromIndex]);
}
