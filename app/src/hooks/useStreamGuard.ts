/**
 * useStreamGuard - Client-side streaming timeout detection
 *
 * Safety net for detecting stuck/stalled streaming messages.
 * Unlike the old useStreamTimeout, this hook:
 * - Uses a stable getter function instead of the messages array as a dependency
 * - Tracks per-message timers via refs that survive re-renders
 * - Only adds/removes timers when streaming status actually changes
 * - Uses an interval to poll for changes instead of re-running on every message update
 *
 * This fixes Bug 8: timers no longer reset on every message content change during streaming.
 */

import { useEffect, useRef, useCallback } from "react";
import type { MessageWithStreaming } from "../types/conversation";
import { STREAM_TIMEOUT_MS } from "../config/constants";

interface UseStreamGuardOptions {
  timeoutMs?: number;
  onTimeout: (messageId: string) => void;
  onForceComplete?: (messageId: string) => void;
}

export function useStreamGuard(
  conversationId: string | null,
  getMessages: () => MessageWithStreaming[],
  options: UseStreamGuardOptions,
): void {
  const { timeoutMs = STREAM_TIMEOUT_MS, onTimeout, onForceComplete } = options;

  const timersRef = useRef<Map<string, number>>(new Map());
  const trackedIdsRef = useRef<Set<string>>(new Set());

  // Stable refs for callbacks to avoid re-creating timers
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;
  const onForceCompleteRef = useRef(onForceComplete);
  onForceCompleteRef.current = onForceComplete;
  const getMessagesRef = useRef(getMessages);
  getMessagesRef.current = getMessages;

  const syncTimers = useCallback(() => {
    if (!conversationId) return;

    const messages = getMessagesRef.current();
    const timers = timersRef.current;
    const trackedIds = trackedIdsRef.current;

    // Find currently streaming messages
    const streamingIds = new Set<string>();
    const streamingMessages = new Map<string, MessageWithStreaming>();
    for (const m of messages) {
      if (m.isStreaming && m.status !== "failed") {
        streamingIds.add(m.id);
        streamingMessages.set(m.id, m);
      }
    }

    // Clear timers for messages no longer streaming
    for (const msgId of trackedIds) {
      if (!streamingIds.has(msgId)) {
        const timer = timers.get(msgId);
        if (timer !== undefined) {
          clearTimeout(timer);
          timers.delete(msgId);
        }
        trackedIds.delete(msgId);
      }
    }

    // Set timers for newly streaming messages
    for (const [msgId, msg] of streamingMessages) {
      if (trackedIds.has(msgId)) continue; // Already tracking

      trackedIds.add(msgId);

      const lastUpdate = msg.lastStreamedAt
        ? new Date(msg.lastStreamedAt)
        : msg.createdAt
          ? new Date(msg.createdAt)
          : new Date();

      const timeSinceUpdate = Date.now() - lastUpdate.getTime();

      if (timeSinceUpdate >= timeoutMs) {
        // Already timed out
        onForceCompleteRef.current?.(msgId);
        onTimeoutRef.current(msgId);
        trackedIds.delete(msgId);
        return;
      }

      const remainingTime = timeoutMs - timeSinceUpdate;
      const timer = window.setTimeout(() => {
        onForceCompleteRef.current?.(msgId);
        onTimeoutRef.current(msgId);
        timers.delete(msgId);
        trackedIds.delete(msgId);
      }, remainingTime);

      timers.set(msgId, timer);
    }
  }, [conversationId, timeoutMs]);

  // Poll for streaming status changes every 5 seconds
  // This avoids depending on the messages array directly
  useEffect(() => {
    if (!conversationId) return;

    // Initial sync
    syncTimers();

    const intervalId = setInterval(syncTimers, 5000);

    const timers = timersRef.current;
    const tracked = trackedIdsRef.current;
    return () => {
      clearInterval(intervalId);
      // Cleanup all timers on unmount
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      tracked.clear();
    };
  }, [conversationId, syncTimers]);
}
