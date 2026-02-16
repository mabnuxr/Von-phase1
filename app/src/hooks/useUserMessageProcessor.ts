/**
 * useUserMessageProcessor - Handles user_message and error events from Pusher
 *
 * Used by V2 containers where the V2EventProcessor only handles AGUI events.
 * Processes:
 * - user_message (legacy non-chunked)
 * - user_message.start/content/end (chunked for large messages)
 * - agent.run_error (updates message status to "failed")
 *
 * Writes to chatStore via upsertMessage.
 */

import { useCallback, useEffect, useRef } from "react";
import type { Channel } from "pusher-js";

import type {
  MessageWithStreaming,
  MessageFileAttachment,
  PusherUserMessageData,
  PusherUserMessageStartData,
  PusherUserMessageContentData,
  PusherUserMessageEndData,
} from "../types/conversation";
import useChatStore from "../store/chatStore";

export function useUserMessageProcessor(
  channel: Channel | null,
  conversationId: string | null,
): void {
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

  const handleUserMessage = useCallback(
    (data: string | PusherUserMessageData) => {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      const convId = conversationIdRef.current;

      if (parsed.conversationId !== convId) return;

      // Skip if this message ID already exists in the store (Pusher retry / duplicate event)
      const existing = useChatStore.getState().messages[convId] || [];
      if (existing.some((m) => m.id === parsed.id)) return;

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
        // Skip if this message ID already exists in the store (Pusher retry / duplicate event)
        const existing =
          useChatStore.getState().messages[entry.metadata.conversationId] || [];
        if (existing.some((m) => m.id === parsed.id)) {
          userMessageChunksRef.current.delete(parsed.id);
          return;
        }

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
        console.error(
          "[useUserMessageProcessor] Error handling run_error:",
          error,
        );
      }
    },
    [],
  );

  useEffect(() => {
    if (!channel) return;

    channel.bind("user_message", handleUserMessage);
    channel.bind("user_message.start", handleUserMessageStart);
    channel.bind("user_message.content", handleUserMessageContent);
    channel.bind("user_message.end", handleUserMessageEnd);
    channel.bind("agent.run_error", handleErrorEvent);

    return () => {
      channel.unbind("user_message", handleUserMessage);
      channel.unbind("user_message.start", handleUserMessageStart);
      channel.unbind("user_message.content", handleUserMessageContent);
      channel.unbind("user_message.end", handleUserMessageEnd);
      channel.unbind("agent.run_error", handleErrorEvent);
    };
  }, [
    channel,
    handleUserMessage,
    handleUserMessageStart,
    handleUserMessageContent,
    handleUserMessageEnd,
    handleErrorEvent,
  ]);
}
