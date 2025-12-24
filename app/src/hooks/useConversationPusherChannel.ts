import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Pusher from "pusher-js";
import type { Channel } from "pusher-js";
import type { AguiEventWrapper } from "@vonlabs/design-components";

import type {
  MessageWithStreaming,
  PusherUserMessageData,
} from "../types/conversation";
import useChatStore from "../store/chatStore";
import { replayAguiEvents } from "../utils/replayAguiEvents";
import { config as appConfig } from "../config";

export interface UseConversationPusherChannelConfig {
  conversationId: string | null;
  tenantId: string | undefined;
  userId: string | undefined;
}

export interface UseConversationPusherChannelReturn {
  isConnected: boolean;
  error: Error | null;
  channel: Channel | null;
}

/**
 * Manages Pusher connection and AGUI event reconciliation.
 * Events array is the source of truth - appends, replays, and updates store with flushSync for smooth streaming.
 */
export function useConversationPusherChannel(
  config: UseConversationPusherChannelConfig,
): UseConversationPusherChannelReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<Channel | null>(null);
  const prevConfigRef = useRef<UseConversationPusherChannelConfig | null>(null);
  const connectionEventsBound = useRef(false);

  // Processes AGUI events: deduplicates by run_id + sequence, appends to events array, replays all events to reconstruct state
  const handleAguiEvent = useCallback(
    (data: string | AguiEventWrapper) => {
      try {
        const wrapper: AguiEventWrapper =
          typeof data === "string" ? JSON.parse(data) : data;
        const { run_id, sequence } = wrapper;

        if (!config.conversationId) return;

        // Get existing message
        const messages =
          useChatStore.getState().messages[config.conversationId] || [];
        let existingMessage = messages.find((m) => m.runId === run_id);

        // Fallback: If new run after approval, update the last assistant message instead of creating duplicate
        if (!existingMessage) {
          const lastAssistantMessage = messages
            .filter((m) => m.role === "assistant")
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )[0];

          // Check if last message has approval tool calls with a result (indicates continuation after approval/rejection)
          if (
            lastAssistantMessage?.toolCalls?.some(
              (tc) => tc.result !== undefined && tc.result !== null,
            )
          ) {
            existingMessage = lastAssistantMessage;
            if (import.meta.env.DEV) {
              console.log(
                "[useConversationPusherChannel] New run after approval detected, updating existing message",
                {
                  oldRunId: existingMessage.runId,
                  newRunId: run_id,
                },
              );
            }
          }
        }

        // Append new event (dedup by run_id + sequence to prevent cross-run collisions)
        const currentEvents = existingMessage?.events || [];
        const eventExists = currentEvents.some(
          (e) => e.run_id === run_id && e.sequence === sequence,
        );

        if (eventExists) return; // Already processed

        const updatedEvents = [...currentEvents, wrapper].sort(
          (a, b) => a.sequence - b.sequence,
        );

        // Replay to get current state
        const replayed = replayAguiEvents(updatedEvents);

        // Determine streaming status (safe check for event.type)
        const isStreaming = wrapper.event?.type !== "RUN_FINISHED";
        const status = isStreaming ? "streaming" : "completed";

        // Build message update - preserve existing fields when possible to avoid blip
        const messageUpdate: MessageWithStreaming = {
          // Preserve existing fields first
          ...existingMessage,
          // Override with updated values
          id: run_id,
          runId: run_id,
          conversationId: config.conversationId,
          messageType: existingMessage?.messageType || "text",
          role: existingMessage?.role || "assistant",
          createdAt: existingMessage?.createdAt || new Date().toISOString(),
          createdBy: existingMessage?.createdBy || "assistant",
          messageContent: replayed.content,
          stepMessages: replayed.stepMessages,
          toolCalls: replayed.toolCalls,
          events: updatedEvents,
          isStreaming,
          // Only set isReasoningStreaming if there's reasoning content (avoid double thinking blocks)
          isReasoningStreaming:
            existingMessage?.reasoningContent && isStreaming ? true : undefined,
          status,
          stoppedByUser: replayed.stoppedByUser,
          lastStreamedAt: new Date().toISOString(), // Track last update time
        };

        // CRITICAL: Use flushSync for smooth streaming
        flushSync(() => {
          useChatStore
            .getState()
            .upsertMessage(config.conversationId!, messageUpdate);
        });
      } catch (error) {
        console.error(
          "[useConversationPusherChannel] Error handling event:",
          error,
        );
      }
    },
    [config.conversationId],
  );

  // Handles user messages from Pusher (validates conversation match, relies on store deduplication)
  const handleUserMessage = useCallback(
    (data: string | PusherUserMessageData) => {
      if (import.meta.env.DEV) {
        console.log(
          "[useConversationPusherChannel] Received user_message:",
          data,
        );
      }

      const parsed = typeof data === "string" ? JSON.parse(data) : data;

      // Validate conversation ID matches to prevent cross-conversation pollution
      if (parsed.conversationId !== config.conversationId) {
        console.warn(
          "[useConversationPusherChannel] Message for different conversation, ignoring",
        );
        return;
      }

      // Let chatStore.upsertMessage handle deduplication
      const userMessage: MessageWithStreaming = {
        id: parsed.id,
        runId: parsed.id,
        conversationId: parsed.conversationId,
        messageContent: parsed.messageContent,
        messageType: "text",
        role: "user",
        createdAt: parsed.createdAt,
        createdBy: parsed.createdBy,
        isStreaming: false,
        status: "completed",
      };

      useChatStore.getState().upsertMessage(parsed.conversationId, userMessage);
    },
    [config.conversationId],
  );

  // Handles error events from backend, updates message status to "failed"
  const handleErrorEvent = useCallback(
    (data: string | Record<string, unknown>) => {
      try {
        const errorData = typeof data === "string" ? JSON.parse(data) : data;

        if (!config.conversationId) return;

        const errorEvent = errorData.event || errorData;
        const errorMessage =
          (errorEvent.message as string) || "An error occurred";
        const runId = (errorData.run_id || errorEvent.run_id) as string;

        if (!runId) {
          console.warn(
            "[useConversationPusherChannel] No run_id in error event",
          );
          return;
        }

        // Get existing message
        const messages =
          useChatStore.getState().messages[config.conversationId] || [];
        const existingMessage = messages.find((m) => m.runId === runId);

        if (!existingMessage) {
          console.warn(
            "[useConversationPusherChannel] No message found for error event",
          );
          return;
        }

        // Update with error status
        const messageUpdate: MessageWithStreaming = {
          ...existingMessage,
          isStreaming: false,
          status: "failed",
          errorMessage,
        };

        useChatStore
          .getState()
          .upsertMessage(config.conversationId, messageUpdate);
      } catch (error) {
        console.error(
          "[useConversationPusherChannel] Error handling run_error:",
          error,
        );
      }
    },
    [config.conversationId],
  );

  // Pusher connection management
  useEffect(() => {
    if (!config.conversationId || !config.tenantId || !config.userId) {
      if (import.meta.env.DEV) {
        console.log("[useConversationPusherChannel] Missing required config:", {
          hasConversationId: !!config.conversationId,
          hasTenantId: !!config.tenantId,
          hasUserId: !!config.userId,
        });
      }

      // Clean up any existing connection
      if (channelRef.current && pusherRef.current) {
        pusherRef.current.unsubscribe(channelRef.current.name);
        channelRef.current = null;
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Check if config changed
    const configChanged =
      !prevConfigRef.current ||
      prevConfigRef.current.tenantId !== config.tenantId ||
      prevConfigRef.current.userId !== config.userId;

    prevConfigRef.current = config;

    // Build channel name
    const channelName = `private-vonlabs-chat-${config.tenantId}-${config.userId}-${config.conversationId}`;

    try {
      // Get access token
      const accessToken = localStorage.getItem("access_token");

      if (!accessToken || accessToken.trim() === "") {
        console.warn(
          "[useConversationPusherChannel] No access token available",
        );
        setError(new Error("No access token available"));
        return;
      }

      // Reuse existing Pusher instance if config hasn't changed
      let pusher = pusherRef.current;

      if (!pusher || configChanged) {
        if (pusher) {
          pusher.disconnect();
          connectionEventsBound.current = false;
        }

        pusher = new Pusher(appConfig.pusherKey, {
          cluster: appConfig.pusherCluster,
          authEndpoint: appConfig.pusherAuthEndpoint,
          forceTLS: true,
          auth: {
            headers: {
              Authorization: `Bearer ${accessToken.trim()}`,
            },
          },
        });

        // Enable Pusher logging in development
        if (
          typeof window !== "undefined" &&
          (window as Window & { localStorage?: Storage }).localStorage?.getItem(
            "debug",
          ) === "pusher"
        ) {
          Pusher.logToConsole = true;
        }

        // Bind connection events only once per instance
        if (!connectionEventsBound.current) {
          pusher.connection.bind("connected", () => {
            setIsConnected(true);
            setError(null);
          });

          pusher.connection.bind("disconnected", () => {
            setIsConnected(false);
          });

          pusher.connection.bind(
            "error",
            (err: { error?: { message?: string } }) => {
              if (import.meta.env.DEV) {
                console.error("[Pusher] Connection error:", err);
              }
              setError(
                new Error(err.error?.message || "Pusher connection error"),
              );
            },
          );

          pusher.connection.bind(
            "state_change",
            (states: { previous: string; current: string }) => {
              if (import.meta.env.DEV) {
                console.log(`[Pusher] ${states.previous} -> ${states.current}`);
              }
            },
          );

          connectionEventsBound.current = true;
        }

        pusherRef.current = pusher;
      }

      // Unsubscribe from old channel if switching conversations
      if (channelRef.current && channelRef.current.name !== channelName) {
        pusher.unsubscribe(channelRef.current.name);
        channelRef.current = null;
      }

      // Subscribe to conversation channel
      if (!channelRef.current) {
        const channel = pusher.subscribe(channelName);
        channelRef.current = channel;

        // Bind to AGUI events
        channel.bind("agent.run_started", handleAguiEvent);
        channel.bind("agent.step_started", handleAguiEvent);
        channel.bind("agent.text_message_start", handleAguiEvent);
        channel.bind("agent.text_message_content", handleAguiEvent);
        channel.bind("agent.text_message_end", handleAguiEvent);
        channel.bind("agent.tool_call_start", handleAguiEvent);
        channel.bind("agent.tool_call_args", handleAguiEvent);
        channel.bind("agent.tool_call_end", handleAguiEvent);
        channel.bind("agent.tool_call_result", handleAguiEvent);
        channel.bind("agent.step_finished", handleAguiEvent);
        channel.bind("agent.run_finished", handleAguiEvent);

        // User messages
        channel.bind("user_message", handleUserMessage);

        // Error events
        channel.bind("agent.run_error", handleErrorEvent);

        // Handle subscription error
        channel.bind("pusher:subscription_error", (status: unknown) => {
          console.error(`[PUSHER] Subscription failed:`, status);
          setError(new Error(`Subscription failed: ${JSON.stringify(status)}`));
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to initialize Pusher"),
      );
    }

    // Cleanup on unmount or conversation change
    return () => {
      if (channelRef.current && pusherRef.current) {
        const channel = channelRef.current;

        // Unbind all events at once to avoid stale closure issues
        channel.unbind_all();

        pusherRef.current.unsubscribe(channel.name);
        channelRef.current = null;
      }
    };
  }, [config, handleAguiEvent, handleUserMessage, handleErrorEvent]);

  return {
    isConnected,
    error,
    channel: channelRef.current,
  };
}
