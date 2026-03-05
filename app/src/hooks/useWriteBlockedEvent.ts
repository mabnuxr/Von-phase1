import { useEffect, useState, useCallback } from "react";
import type { Channel } from "pusher-js";
import {
  ConversationChannelEvents,
  type AgentWriteBlockedPayload,
  type WriteBlockCode,
} from "../types/conversationChannelEvents";

export interface WriteBlockedState {
  blockCode: WriteBlockCode;
  message: string;
}

/**
 * Listens for `integration.write_blocked` events on the conversation Pusher channel
 * and exposes the latest block as dismissible banner state.
 */
export function useWriteBlockedEvent(channel: Channel | null) {
  const [writeBlocked, setWriteBlocked] = useState<WriteBlockedState | null>(
    null,
  );

  const dismissWriteBlocked = useCallback(() => {
    setWriteBlocked(null);
  }, []);

  useEffect(() => {
    if (!channel) return;

    const eventName = ConversationChannelEvents.INTEGRATION_WRITE_BLOCKED;

    const handler = (data: AgentWriteBlockedPayload) => {
      setWriteBlocked({
        blockCode: data.block_code,
        message: data.message,
      });
    };

    channel.bind(eventName, handler);

    return () => {
      channel.unbind(eventName, handler);
    };
  }, [channel]);

  return { writeBlocked, dismissWriteBlocked };
}
