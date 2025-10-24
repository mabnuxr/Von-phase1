import { useEffect, useRef } from "react";
import type { MessageWithStreaming } from "../types/conversation";

interface UseStreamTimeoutOptions {
  timeoutMs?: number; // Default 60 seconds
  onTimeout: (messageId: string) => void;
}

/**
 * Hook to detect streaming timeouts on the client side.
 *
 * Monitors messages that are actively streaming and triggers a timeout
 * callback if no updates are received within the specified time period.
 *
 * This provides a safety net in case:
 * - Pusher connection is lost
 * - Backend crashes mid-stream
 * - Stream gets stuck for any reason
 *
 * When timeout is detected, the callback triggers a refetch.
 * Backend soft-deletes stuck messages, so they simply disappear from the list.
 * This is elegant because:
 * - No need for timeout/error UI states
 * - Message just vanishes (user can retry)
 * - Data preserved in DB for debugging
 */
export function useStreamTimeout(
  messages: MessageWithStreaming[],
  conversationId: string | null,
  options: UseStreamTimeoutOptions,
) {
  const { timeoutMs = 60000, onTimeout } = options; // 60 seconds default
  // Use number instead of NodeJS.Timeout (browser environment)
  const timersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!conversationId) return;

    // Find messages that are actively streaming
    const streamingMessages = messages.filter(
      (m) => m.isStreaming && m.status !== "failed",
    );

    // Clear timers for messages no longer streaming
    timersRef.current.forEach((timer, msgId) => {
      if (!streamingMessages.find((m) => m.id === msgId)) {
        clearTimeout(timer);
        timersRef.current.delete(msgId);
      }
    });

    // Set timers for actively streaming messages
    streamingMessages.forEach((msg) => {
      if (timersRef.current.has(msg.id)) return; // Already tracking

      // Calculate time since last update
      const lastUpdate = msg.lastStreamedAt
        ? new Date(msg.lastStreamedAt)
        : msg.createdAt
          ? new Date(msg.createdAt)
          : new Date();

      const timeSinceUpdate = Date.now() - lastUpdate.getTime();

      if (timeSinceUpdate >= timeoutMs) {
        // Already timed out
        onTimeout(msg.id);
        return;
      }

      // Set timer for remaining time
      const remainingTime = timeoutMs - timeSinceUpdate;
      const timer = setTimeout(() => {
        console.warn(`Message ${msg.id} timed out after ${timeoutMs}ms`);
        onTimeout(msg.id);
        timersRef.current.delete(msg.id);
      }, remainingTime);

      timersRef.current.set(msg.id, timer);
    });

    // Cleanup on unmount
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, [messages, conversationId, timeoutMs, onTimeout]);
}
