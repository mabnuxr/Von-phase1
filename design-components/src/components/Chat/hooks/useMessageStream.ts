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
  onMessageComplete?: (messageId: string, fullContent: string) => void;
  onMessageReceived?: (messageId: string, content: string, role: 'user' | 'assistant') => void;
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
  const seenMessageIds = useRef<Set<string>>(new Set());
  const eventsRef = useRef(events);

  // Update ref when events change, but don't re-run effect
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

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

    // Handle message start event
    const handleMessageStart = (data: { id: string; role: string }) => {
      const { id } = data;

      // Prevent duplicate processing
      if (seenMessageIds.current.has(id)) {
        return;
      }
      seenMessageIds.current.add(id);

      setStreamingMessages((prev) => new Map(prev).set(id, ''));
      eventsRef.current.onMessageStart?.(id);
    };

    // Handle message chunk event (incremental streaming)
    const handleMessageChunk = (data: { id: string; chunk: string; content?: string }) => {
      const { id, chunk, content } = data;

      setStreamingMessages((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(id) || '';

        // Support both incremental (chunk) and progressive (content) formats
        const newContent = content !== undefined ? content : current + chunk;
        newMap.set(id, newContent);

        return newMap;
      });

      eventsRef.current.onMessageChunk?.(id, chunk || content || '');
    };

    // Handle message complete event
    const handleMessageComplete = (data: { id: string; content: string }) => {
      const { id, content } = data;

      setStreamingMessages((prev) => {
        const newMap = new Map(prev);
        newMap.set(id, content);
        return newMap;
      });

      eventsRef.current.onMessageComplete?.(id, content);

      // Clean up after a short delay to allow for final rendering
      setTimeout(() => {
        setStreamingMessages((prev) => {
          const newMap = new Map(prev);
          newMap.delete(id);
          return newMap;
        });
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

    // Bind to all Pusher events
    channel.bind('message.start', handleMessageStart);
    channel.bind('message.chunk', handleMessageChunk);
    channel.bind('message.complete', handleMessageComplete);
    channel.bind('message.content', handleMessageReceived); // Message content event (user and assistant messages)
    channel.bind('message.error', handleError);

    // Cleanup
    return () => {
      channel.unbind('message.start', handleMessageStart);
      channel.unbind('message.chunk', handleMessageChunk);
      channel.unbind('message.complete', handleMessageComplete);
      channel.unbind('message.content', handleMessageReceived);
      channel.unbind('message.error', handleError);
    };
  }, [channel]); // Only re-run when channel changes, not when event handlers change

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      seenMessageIds.current.clear();
      setStreamingMessages(new Map());
    };
  }, []);

  return {
    streamingMessages,
    isStreaming: streamingMessages.size > 0,
  };
}
