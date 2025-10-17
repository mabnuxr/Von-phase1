import { useEffect, useRef, useState } from 'react';
import type { Channel } from 'pusher-js';

export interface StreamMessage {
  id: string;
  content: string;
  isComplete: boolean;
  type: 'user' | 'assistant';
  timestamp: Date;
}

export interface MessageStreamEvents {
  onMessageStart?: (messageId: string) => void;
  onMessageChunk?: (messageId: string, chunk: string) => void;
  onMessageComplete?: (messageId: string, fullContent: string, reasoningContent?: string) => void;
  onMessageReceived?: (messageId: string, content: string, role: 'user' | 'assistant') => void;
  onThinkingChunk?: (messageId: string, chunk: string) => void;
  onThinkingComplete?: (messageId: string, fullThinking: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for handling real-time message streaming from Pusher
 *
 * @param channel - Pusher channel to listen to
 * @param events - Event handlers for different message lifecycle events
 */
export function useMessageStream(channel: Channel | null, events: MessageStreamEvents = {}) {
  const [streamingMessages, setStreamingMessages] = useState<Map<string, string>>(new Map());
  const [streamingReasoning, setStreamingReasoning] = useState<Map<string, string>>(new Map());
  const currentMessageIdRef = useRef<string | null>(null);
  const streamingMessagesRef = useRef<Map<string, string>>(new Map());
  const streamingReasoningRef = useRef<Map<string, string>>(new Map());
  const seenMessageIds = useRef<Set<string>>(new Set());
  const eventsRef = useRef(events);

  // Update refs when state changes
  useEffect(() => {
    eventsRef.current = events;
    streamingMessagesRef.current = streamingMessages;
    streamingReasoningRef.current = streamingReasoning;
  }, [events, streamingMessages, streamingReasoning]);

  // Cleanup seen message IDs periodically to prevent unbounded growth
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const currentSize = seenMessageIds.current.size;

      // If we have more than 100 seen messages, clear old ones
      // Keep only the most recent by clearing half when limit reached
      if (currentSize > 100) {
        const idsArray = Array.from(seenMessageIds.current);
        // Keep the newer half
        seenMessageIds.current = new Set(idsArray.slice(Math.floor(currentSize / 2)));
      }
    }, 60000); // Run every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  useEffect(() => {
    if (!channel) {
      return;
    }

    // Handle Claude-style message_start event
    const handleMessageStart = (data: { type: string; message: { id: string; role: string } }) => {
      const messageId = data.message.id;

      // Prevent duplicate processing
      if (seenMessageIds.current.has(messageId)) {
        return;
      }
      seenMessageIds.current.add(messageId);

      currentMessageIdRef.current = messageId;
      setStreamingMessages((prev) => new Map(prev).set(messageId, ''));
      setStreamingReasoning((prev) => new Map(prev).set(messageId, ''));
      eventsRef.current.onMessageStart?.(messageId);
    };

    // Handle Claude-style content_block_delta event
    const handleContentBlockDelta = (data: {
      type: string;
      index: number;
      delta: { type: string; thinking?: string; text?: string };
    }) => {
      const messageId = currentMessageIdRef.current;
      if (!messageId) return;

      const { index, delta } = data;

      // Index 0 = thinking block, Index 1 = content block
      if (index === 0 && delta.type === 'thinking_delta' && delta.thinking) {
        // Thinking/reasoning chunk
        setStreamingReasoning((prev) => {
          const newMap = new Map(prev);
          const current = newMap.get(messageId) || '';
          newMap.set(messageId, current + delta.thinking);
          return newMap;
        });
        eventsRef.current.onThinkingChunk?.(messageId, delta.thinking);
      } else if (index === 1 && delta.type === 'text_delta' && delta.text) {
        // Content chunk
        setStreamingMessages((prev) => {
          const newMap = new Map(prev);
          const current = newMap.get(messageId) || '';
          newMap.set(messageId, current + delta.text);
          return newMap;
        });
        eventsRef.current.onMessageChunk?.(messageId, delta.text);
      }
    };

    // Handle Claude-style content_block_stop event
    const handleContentBlockStop = (data: { type: string; index: number }) => {
      const messageId = currentMessageIdRef.current;
      if (!messageId) return;

      const { index } = data;

      // Index 0 = thinking complete, Index 1 = content complete
      if (index === 0) {
        const fullThinking = streamingReasoningRef.current.get(messageId) || '';
        eventsRef.current.onThinkingComplete?.(messageId, fullThinking);
      }
      // Note: We don't call onMessageComplete here for index 1,
      // we wait for message_stop to ensure we have the final state
    };

    // Handle Claude-style message_stop event (final completion)
    const handleMessageStop = () => {
      const messageId = currentMessageIdRef.current;
      if (!messageId) return;

      const fullContent = streamingMessagesRef.current.get(messageId) || '';
      const fullReasoning = streamingReasoningRef.current.get(messageId) || '';

      eventsRef.current.onMessageComplete?.(messageId, fullContent, fullReasoning);

      // Clean up after a short delay to allow for final rendering
      setTimeout(() => {
        setStreamingMessages((prev) => {
          const newMap = new Map(prev);
          newMap.delete(messageId);
          return newMap;
        });
        setStreamingReasoning((prev) => {
          const newMap = new Map(prev);
          newMap.delete(messageId);
          return newMap;
        });
        currentMessageIdRef.current = null;
      }, 100);
    };

    // Handle error event
    const handleError = (data: { id: string; error: string }) => {
      const { id, error } = data;

      setStreamingMessages((prev) => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });

      eventsRef.current.onError?.(new Error(error));
    };

    // Handle new-message event (immediate complete message - non-streaming)
    const handleMessageReceived = (data: {
      id: string;
      messageContent?: string;
      content?: string;
      role: string;
    }) => {
      const { id, messageContent, content, role } = data;
      // Backend uses messageContent, fallback to content for compatibility
      const messageText = messageContent || content || '';

      // Prevent duplicate processing
      if (seenMessageIds.current.has(id)) {
        return;
      }
      seenMessageIds.current.add(id);

      // Call onMessageReceived if available (for immediate messages like user messages)
      if (eventsRef.current.onMessageReceived) {
        eventsRef.current.onMessageReceived(id, messageText, role as 'user' | 'assistant');
      } else {
        // Fallback: treat as immediate start and complete (for backwards compatibility)
        eventsRef.current.onMessageStart?.(id);
        eventsRef.current.onMessageComplete?.(id, messageText);
      }
    };

    // Bind to Claude-style Pusher events
    channel.bind('message_start', handleMessageStart);
    channel.bind('content_block_delta', handleContentBlockDelta);
    channel.bind('content_block_stop', handleContentBlockStop);
    channel.bind('message_stop', handleMessageStop);
    channel.bind('user_message', handleMessageReceived); // User messages (non-streaming)
    channel.bind('error', handleError);

    // Cleanup
    return () => {
      channel.unbind('message_start', handleMessageStart);
      channel.unbind('content_block_delta', handleContentBlockDelta);
      channel.unbind('content_block_stop', handleContentBlockStop);
      channel.unbind('message_stop', handleMessageStop);
      channel.unbind('user_message', handleMessageReceived);
      channel.unbind('error', handleError);
    };
  }, [channel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      seenMessageIds.current.clear();
      setStreamingMessages(new Map());
      setStreamingReasoning(new Map());
      currentMessageIdRef.current = null;
    };
  }, []);

  return {
    streamingMessages,
    streamingReasoning,
    isStreaming: streamingMessages.size > 0 || streamingReasoning.size > 0,
  };
}
