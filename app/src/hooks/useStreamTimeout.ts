import { useEffect, useRef } from "react";
import type { MessageWithStreaming } from "../types/conversation";
import { STREAM_TIMEOUT_MS } from "../config/constants";

interface UseStreamTimeoutOptions {
  timeoutMs?: number; // Default from STREAM_TIMEOUT_MS constant
  onTimeout: (messageId: string) => void;
  onForceComplete?: (messageId: string) => void; // FIX: Force clear state before refetch
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
  const { timeoutMs = STREAM_TIMEOUT_MS, onTimeout, onForceComplete } = options;
  // Use number instead of NodeJS.Timeout (browser environment)
  const timersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!conversationId) return;

    // Capture ref value for cleanup
    const timers = timersRef.current;

    // Find messages that are actively streaming
    const streamingMessages = messages.filter(
      (m) => m.isStreaming && m.status !== "failed",
    );

    // Clear timers for messages no longer streaming
    timers.forEach((timer, msgId) => {
      if (!streamingMessages.find((m) => m.id === msgId)) {
        clearTimeout(timer);
        timers.delete(msgId);
      }
    });

    // Set timers for actively streaming messages
    streamingMessages.forEach((msg) => {
      if (timers.has(msg.id)) return; // Already tracking

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
      const timer = window.setTimeout(() => {
        // FIX: Force clear streaming state immediately (re-enables input)
        onForceComplete?.(msg.id);

        // THEN trigger refetch for authoritative state
        onTimeout(msg.id);

        timers.delete(msg.id);
      }, remainingTime);

      timers.set(msg.id, timer);
    });

    // Cleanup on unmount
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, [messages, conversationId, timeoutMs, onTimeout, onForceComplete]);
}
