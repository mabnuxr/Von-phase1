/**
 * useV1EventProcessor - Processes ALL Pusher events for V1 conversations
 *
 * Single-responsibility: Binds to a Pusher channel and processes:
 * - AGUI events → replayAguiEvents() → chatStore.upsertMessage()
 * - User messages (legacy + chunked)
 * - Error events (agent.run_error)
 *
 * Does NOT manage Pusher connection — receives channel from usePusherChannel.
 * Uses a conversationId ref to guard against stale closures.
 */

import { useCallback, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import type { Channel } from "pusher-js";
import type { AguiEventWrapper } from "@vonlabs/design-components";

import type {
  MessageWithStreaming,
  MessageFileAttachment,
  PusherUserMessageData,
  PusherUserMessageStartData,
  PusherUserMessageContentData,
  PusherUserMessageEndData,
} from "../types/conversation";
import useChatStore from "../store/chatStore";
import { replayAguiEvents } from "../utils/replayAguiEvents";

const AGUI_EVENTS = [
  "agent.run_started",
  "agent.step_started",
  "agent.text_message_start",
  "agent.text_message_content",
  "agent.text_message_end",
  "agent.tool_call_start",
  "agent.tool_call_args",
  "agent.tool_call_end",
  "agent.tool_call_result",
  "agent.step_finished",
  "agent.run_finished",
] as const;

export function useV1EventProcessor(
  channel: Channel | null,
  conversationId: string | null,
): void {
  // Ref to always have the latest conversationId (guards against stale closures)
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  // Track in-progress chunked user messages
  const userMessageChunksRef = useRef<
    Map<
      string,
      {
        chunks: Array<{ sequence: number; delta: string }>;
        metadata: {
          conversationId: string;
          messageType: string;
          createdAt: string;
          createdBy: string | null;
          fileAttachments?: MessageFileAttachment[];
        };
      }
    >
  >(new Map());

  // AGUI event handler
  const handleAguiEvent = useCallback((data: string | AguiEventWrapper) => {
    try {
      const wrapper: AguiEventWrapper =
        typeof data === "string" ? JSON.parse(data) : data;
      const { run_id, sequence } = wrapper;
      const convId = conversationIdRef.current;

      if (!convId || !run_id) return;

      const messages = useChatStore.getState().messages[convId] || [];
      const existingMessage = messages.find((m) => m.runId === run_id);

      // Deduplicate by run_id + sequence
      const currentEvents = existingMessage?.events || [];
      const eventExists = currentEvents.some(
        (e) => e.run_id === run_id && e.sequence === sequence,
      );
      if (eventExists) return;

      const updatedEvents = [...currentEvents, wrapper].sort(
        (a, b) => a.sequence - b.sequence,
      );

      const replayed = replayAguiEvents(updatedEvents);

      const isStreaming = wrapper.event?.type !== "RUN_FINISHED";
      const status = isStreaming ? "streaming" : "completed";

      // Extract phase from RUN_FINISHED event
      let phase = existingMessage?.phase;
      if (wrapper.event?.type === "RUN_FINISHED") {
        phase = (wrapper.event as any)?.result?.phase || null;
      }

      const messageUpdate: MessageWithStreaming = {
        ...existingMessage,
        id: run_id,
        runId: run_id,
        conversationId: convId,
        messageType: existingMessage?.messageType || "text",
        role: existingMessage?.role || "assistant",
        createdAt: existingMessage?.createdAt || new Date().toISOString(),
        createdBy: existingMessage?.createdBy || "assistant",
        messageContent: replayed.content,
        stepMessages: replayed.stepMessages,
        toolCalls: replayed.toolCalls,
        events: updatedEvents,
        isStreaming,
        isReasoningStreaming:
          existingMessage?.reasoningContent && isStreaming ? true : undefined,
        status,
        stoppedByUser: replayed.stoppedByUser,
        lastStreamedAt: new Date().toISOString(),
        phase, // Add phase for approval button control
      };

      flushSync(() => {
        useChatStore.getState().upsertMessage(convId, messageUpdate);
      });
    } catch (error) {
      console.error("[useV1EventProcessor] Error handling AGUI event:", error);
    }
  }, []);

  // User message handler (legacy non-chunked)
  const handleUserMessage = useCallback(
    (data: string | PusherUserMessageData) => {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      const convId = conversationIdRef.current;

      if (parsed.conversationId !== convId) return;

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
        fileAttachments: parsed.fileAttachments,
      };

      useChatStore.getState().upsertMessage(parsed.conversationId, userMessage);
    },
    [],
  );

  // Chunked user message handlers
  const handleUserMessageStart = useCallback(
    (data: string | PusherUserMessageStartData) => {
      const parsed: PusherUserMessageStartData =
        typeof data === "string" ? JSON.parse(data) : data;
      const convId = conversationIdRef.current;

      if (parsed.conversationId !== convId) return;

      userMessageChunksRef.current.set(parsed.id, {
        chunks: [],
        metadata: {
          conversationId: parsed.conversationId,
          messageType: parsed.messageType,
          createdAt: parsed.createdAt,
          createdBy: parsed.createdBy,
          fileAttachments: parsed.fileAttachments,
        },
      });
    },
    [],
  );

  const handleUserMessageContent = useCallback(
    (data: string | PusherUserMessageContentData) => {
      const parsed: PusherUserMessageContentData =
        typeof data === "string" ? JSON.parse(data) : data;
      const entry = userMessageChunksRef.current.get(parsed.id);
      if (entry) {
        entry.chunks.push({ sequence: parsed.sequence, delta: parsed.delta });
      }
    },
    [],
  );

  const handleUserMessageEnd = useCallback(
    (data: string | PusherUserMessageEndData) => {
      const parsed: PusherUserMessageEndData =
        typeof data === "string" ? JSON.parse(data) : data;
      const entry = userMessageChunksRef.current.get(parsed.id);

      if (entry) {
        const sortedChunks = entry.chunks.sort(
          (a, b) => a.sequence - b.sequence,
        );
        const messageContent = sortedChunks.map((c) => c.delta).join("");

        const userMessage: MessageWithStreaming = {
          id: parsed.id,
          runId: parsed.id,
          conversationId: entry.metadata.conversationId,
          messageContent,
          messageType: entry.metadata.messageType as "text",
          role: "user",
          createdAt: entry.metadata.createdAt,
          createdBy: entry.metadata.createdBy,
          isStreaming: false,
          status: "completed",
          fileAttachments: entry.metadata.fileAttachments,
        };

        useChatStore
          .getState()
          .upsertMessage(entry.metadata.conversationId, userMessage);

        userMessageChunksRef.current.delete(parsed.id);
      }
    },
    [],
  );

  // Error event handler
  const handleErrorEvent = useCallback(
    (data: string | Record<string, unknown>) => {
      try {
        const errorData = typeof data === "string" ? JSON.parse(data) : data;
        const convId = conversationIdRef.current;
        if (!convId) return;

        const errorEvent = errorData.event || errorData;
        const errorMessage =
          (errorEvent.message as string) || "An error occurred";
        const runId = (errorData.run_id || errorEvent.run_id) as string;
        if (!runId) return;

        const messages = useChatStore.getState().messages[convId] || [];
        const existingMessage = messages.find((m) => m.runId === runId);
        if (!existingMessage) return;

        const messageUpdate: MessageWithStreaming = {
          ...existingMessage,
          isStreaming: false,
          status: "failed",
          errorMessage,
        };

        useChatStore.getState().upsertMessage(convId, messageUpdate);
      } catch (error) {
        console.error("[useV1EventProcessor] Error handling run_error:", error);
      }
    },
    [],
  );

  // Bind/unbind events when channel changes
  useEffect(() => {
    if (!channel) return;

    // Bind AGUI events
    for (const event of AGUI_EVENTS) {
      channel.bind(event, handleAguiEvent);
    }

    // User messages
    channel.bind("user_message", handleUserMessage);
    channel.bind("user_message.start", handleUserMessageStart);
    channel.bind("user_message.content", handleUserMessageContent);
    channel.bind("user_message.end", handleUserMessageEnd);

    // Error events
    channel.bind("agent.run_error", handleErrorEvent);

    return () => {
      for (const event of AGUI_EVENTS) {
        channel.unbind(event, handleAguiEvent);
      }
      channel.unbind("user_message", handleUserMessage);
      channel.unbind("user_message.start", handleUserMessageStart);
      channel.unbind("user_message.content", handleUserMessageContent);
      channel.unbind("user_message.end", handleUserMessageEnd);
      channel.unbind("agent.run_error", handleErrorEvent);
    };
  }, [
    channel,
    handleAguiEvent,
    handleUserMessage,
    handleUserMessageStart,
    handleUserMessageContent,
    handleUserMessageEnd,
    handleErrorEvent,
  ]);
}
