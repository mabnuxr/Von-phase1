import { useEffect, useRef, useState, useCallback } from "react";
import type { Channel } from "pusher-js";
import {
  ConversationChannelEvents,
  type AgentWriteBlockedPayload,
  type WriteBlockCode,
} from "../types/conversationChannelEvents";

export interface WriteBlockedState {
  blockCode: WriteBlockCode;
  message: string;
  idempotencyKey: string;
}

/**
 * Listens for `integration.write_blocked` events on the conversation Pusher channel
 * and exposes the latest block as dismissible banner state.
 *
 * Uses the idempotency key from the backend to:
 * - Ignore duplicate deliveries of the same event
 * - Prevent dismissed banners from reappearing on re-delivery
 */
export function useWriteBlockedEvent(channel: Channel | null) {
  const [writeBlocked, setWriteBlocked] = useState<WriteBlockedState | null>(
    null,
  );
  const dismissedKeysRef = useRef<Set<string>>(new Set());

  const dismissWriteBlocked = useCallback(() => {
    setWriteBlocked((prev) => {
      if (prev) {
        dismissedKeysRef.current.add(prev.idempotencyKey);
      }
      return null;
    });
  }, []);

  useEffect(() => {
    if (!channel) return;

    const eventName = ConversationChannelEvents.INTEGRATION_WRITE_BLOCKED;

    const handler = (data: AgentWriteBlockedPayload) => {
      const key = data.idempotency_key;

      if (dismissedKeysRef.current.has(key)) return;

      setWriteBlocked((prev) => {
        if (prev?.idempotencyKey === key) return prev;
        return {
          blockCode: data.block_code,
          message: data.message,
          idempotencyKey: key,
        };
      });
    };

    channel.bind(eventName, handler);

    return () => {
      channel.unbind(eventName, handler);
    };
  }, [channel]);

  return { writeBlocked, dismissWriteBlocked };
}
