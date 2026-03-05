import { useEffect } from "react";
import type { Channel } from "pusher-js";
import { useToast } from "./useToast";
import {
  ConversationChannelEvents,
  type AgentWriteBlockedPayload,
} from "../types/conversationChannelEvents";

/**
 * Listens for `agent.write_blocked` events on the conversation Pusher channel
 * and surfaces the server-provided message as a toast notification.
 */
export function useWriteBlockedEvent(channel: Channel | null) {
  const { showToast } = useToast();

  useEffect(() => {
    if (!channel) return;

    const eventName = ConversationChannelEvents.AGENT_WRITE_BLOCKED;

    const handler = (data: AgentWriteBlockedPayload) => {
      showToast({
        message: data.event.message,
        variant: "warning",
        autoDismissMs: 8000,
      });
    };

    channel.bind(eventName, handler);

    return () => {
      channel.unbind(eventName, handler);
    };
  }, [channel, showToast]);
}
