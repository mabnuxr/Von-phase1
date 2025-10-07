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

  useEffect(() => {
    if (!channel) {
      console.log('[MessageStream] No channel available');
      return;
    }

    console.log('[MessageStream] Setting up event listeners on channel:', channel.name);

    // Handle message start event
    const handleMessageStart = (data: { message_id: string; role: string }) => {
      console.log('[MessageStream] message.start received:', data);
      const { message_id } = data;

      // Prevent duplicate processing
      if (seenMessageIds.current.has(message_id)) {
        return;
      }
      seenMessageIds.current.add(message_id);

      setStreamingMessages((prev) => new Map(prev).set(message_id, ''));
      events.onMessageStart?.(message_id);
    };

    // Handle message chunk event (incremental streaming)
    const handleMessageChunk = (data: { message_id: string; chunk: string; content?: string }) => {
      console.log('[MessageStream] message.chunk received:', data);
      const { message_id, chunk, content } = data;

      setStreamingMessages((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(message_id) || '';

        // Support both incremental (chunk) and progressive (content) formats
        const newContent = content !== undefined ? content : current + chunk;
        newMap.set(message_id, newContent);

        return newMap;
      });

      events.onMessageChunk?.(message_id, chunk || content || '');
    };

    // Handle message complete event
    const handleMessageComplete = (data: { message_id: string; content: string }) => {
      console.log('[MessageStream] message.complete received:', data);
      const { message_id, content } = data;

      setStreamingMessages((prev) => {
        const newMap = new Map(prev);
        newMap.set(message_id, content);
        return newMap;
      });

      events.onMessageComplete?.(message_id, content);

      // Clean up after a short delay to allow for final rendering
      setTimeout(() => {
        setStreamingMessages((prev) => {
          const newMap = new Map(prev);
          newMap.delete(message_id);
          return newMap;
        });
      }, 100);
    };

    // Handle error event
    const handleError = (data: { message_id: string; error: string }) => {
      console.error('[MessageStream] message.error received:', data);
      const { message_id, error } = data;

      setStreamingMessages((prev) => {
        const newMap = new Map(prev);
        newMap.delete(message_id);
        return newMap;
      });

      events.onError?.(new Error(error));
    };

    // Handle message.received event (immediate complete message - non-streaming)
    const handleMessageReceived = (data: { message_id: string; content: string; role: string }) => {
      console.log('[MessageStream] message.received received:', data);
      const { message_id, content } = data;

      // Treat as immediate start and complete (non-streaming response)
      if (!seenMessageIds.current.has(message_id)) {
        seenMessageIds.current.add(message_id);
        events.onMessageStart?.(message_id);
      }
      events.onMessageComplete?.(message_id, content);
    };

    // Bind to all Pusher events
    channel.bind('message.start', handleMessageStart);
    channel.bind('message.chunk', handleMessageChunk);
    channel.bind('message.complete', handleMessageComplete);
    channel.bind('message.received', handleMessageReceived);
    channel.bind('message.error', handleError);

    // Bind to all events for debugging
    channel.bind_global((eventName: string, data: unknown) => {
      console.log(`[MessageStream] Event received:`, eventName, data);
    });

    // Cleanup
    return () => {
      channel.unbind('message.start', handleMessageStart);
      channel.unbind('message.chunk', handleMessageChunk);
      channel.unbind('message.complete', handleMessageComplete);
      channel.unbind('message.received', handleMessageReceived);
      channel.unbind('message.error', handleError);
      channel.unbind_global();
    };
  }, [channel, events]);

  return {
    streamingMessages,
    isStreaming: streamingMessages.size > 0,
  };
}
