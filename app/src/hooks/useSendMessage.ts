import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { conversationsService } from "../services";
import useChatStore from "../store/chatStore";
import { folderKeys } from "./folders";
import type {
  FolderConversationRow,
  FolderItemsResponse,
} from "../types/chatSidebar";
import type {
  MessageWithStreaming,
  MessageFileAttachment,
  MessageCommand,
  MessageReference,
} from "../types/conversation";

/**
 * Payload for sending a message
 */
export interface SendMessagePayload {
  conversationId: string;
  content: string;
  fileAttachments?: MessageFileAttachment[];
  command?: MessageCommand;
  references?: MessageReference[];
  /**
   * When provided, chatStore has already been seeded by the caller with these
   * message IDs. onMutate skips the chatStore operations and simply returns
   * the IDs so that onSuccess / onError can still update / roll back correctly.
   */
  preSeededOptimisticIds?: { userId: string; assistantId: string };
}

/**
 * Generate a temporary ID for optimistic updates
 * Uses a prefix to identify optimistic messages for reconciliation
 */
function generateOptimisticId(): string {
  return `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Context returned from onMutate for use in onSuccess/onError
 */
interface MutationContext {
  optimisticId: string;
  optimisticAssistantId: string;
  conversationId: string;
}

/**
 * Hook to send messages via Pusher flow with optimistic updates
 * - Immediately adds user message to UI (optimistic update)
 * - Sends message to backend
 * - Backend emits Pusher events which reconcile the optimistic message
 * - If error occurs, removes the optimistic message
 *
 * @returns Mutation object with sendMessage function
 *
 * @example
 * ```tsx
 * const { mutate: sendMessage, isPending } = useSendMessage();
 *
 * const handleSend = (content: string) => {
 *   sendMessage(content);
 * };
 * ```
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      if (import.meta.env.DEV) {
        console.log("[useSendMessage] Sending message:", payload.content);
      }

      // Send to backend
      // Backend will emit Pusher events that add the real message
      return conversationsService.sendMessage(
        payload.conversationId,
        payload.content,
        "text",
        payload.fileAttachments,
        payload.command,
        payload.references,
      );
    },

    // Optimistic update: Add message to UI immediately before API call
    onMutate: async (
      payload: SendMessagePayload,
    ): Promise<MutationContext | undefined> => {
      const conversationId = payload.conversationId;

      // When the caller pre-seeded chatStore (e.g. useCreateAndSendMessage),
      // skip the chatStore operations here to avoid duplicates. Just return
      // the IDs so onSuccess / onError can update / roll back correctly.
      if (payload.preSeededOptimisticIds) {
        return {
          optimisticId: payload.preSeededOptimisticIds.userId,
          optimisticAssistantId: payload.preSeededOptimisticIds.assistantId,
          conversationId,
        };
      }

      // FIX: Set showMessagesFromIndex BEFORE adding optimistic messages
      // This ensures the index update and message addition happen synchronously,
      // preventing flash of previous AI response
      const existingMessages =
        useChatStore.getState().messages[conversationId] || [];
      useChatStore
        .getState()
        .setShowMessagesFromIndex(conversationId, existingMessages.length);

      // Generate optimistic IDs for tracking
      const optimisticId = generateOptimisticId();
      const optimisticAssistantId = generateOptimisticId();

      // Bug 5 fix: Track pending optimistic IDs so Pusher event handlers
      // know to merge instead of inserting duplicates
      useChatStore.getState().addPendingOptimisticId(optimisticId);
      useChatStore.getState().addPendingOptimisticId(optimisticAssistantId);

      // Create optimistic user message
      const optimisticUserMessage: MessageWithStreaming = {
        id: optimisticId,
        runId: optimisticId,
        conversationId: conversationId,
        messageType: "text",
        messageContent: payload.content,
        role: "user",
        createdAt: new Date().toISOString(),
        createdBy: null,
        isStreaming: false,
        status: "completed",
        fileAttachments: payload.fileAttachments,
        command: payload.command,
        references: payload.references,
      };

      // Create optimistic assistant message with streaming state
      // This triggers the TimelineThinkingProcess loading UI immediately
      const optimisticAssistantMessage: MessageWithStreaming = {
        id: optimisticAssistantId,
        runId: optimisticAssistantId,
        conversationId: conversationId,
        messageType: "text",
        messageContent: "",
        role: "assistant",
        createdAt: new Date().toISOString(),
        createdBy: null,
        isStreaming: true,
        status: "streaming",
      };

      // Add both messages to store immediately
      useChatStore.getState().addMessage(conversationId, optimisticUserMessage);
      useChatStore
        .getState()
        .addMessage(conversationId, optimisticAssistantMessage);

      // Trigger scroll to bottom to show the new message
      useChatStore.getState().triggerScrollToBottom(conversationId);

      if (import.meta.env.DEV) {
        console.log(
          "[useSendMessage] Added optimistic messages:",
          optimisticId,
          optimisticAssistantId,
        );
      }

      // Return context for onSuccess/onError
      return { optimisticId, optimisticAssistantId, conversationId };
    },

    onSuccess: (response, _, context) => {
      if (import.meta.env.DEV) {
        console.log(
          "[useSendMessage] Message acknowledged:",
          response.messageId,
        );
      }

      // Update optimistic message ID to real ID for proper reconciliation
      // When Pusher event arrives with the real message, it will find the
      // existing message by ID and update it - no disappearance, no duplicates
      if (context && response.messageId) {
        useChatStore
          .getState()
          .updateMessageId(
            context.conversationId,
            context.optimisticId,
            response.messageId,
          );

        // Clean up pending optimistic IDs now that real IDs are assigned
        useChatStore.getState().removePendingOptimisticId(context.optimisticId);
        useChatStore
          .getState()
          .removePendingOptimisticId(context.optimisticAssistantId);

        if (import.meta.env.DEV) {
          console.log(
            "[useSendMessage] Updated optimistic ID to real ID:",
            context.optimisticId,
            "->",
            response.messageId,
          );
        }
      }

      // Silently invalidate the unfiled chats cache if this conversation
      // isn't already at the top, so the sidebar's sort order stays fresh.
      if (context) {
        const unfiledData = queryClient.getQueryData<
          InfiniteData<FolderItemsResponse<FolderConversationRow>>
        >(folderKeys.unfiled("conversation"));
        const topConversationId =
          unfiledData?.pages[0]?.items[0]?.conversation_id;
        if (unfiledData && topConversationId !== context.conversationId) {
          queryClient.invalidateQueries({
            queryKey: folderKeys.unfiled("conversation"),
          });
          // Folder contents may also need a refresh — same reason.
          queryClient.invalidateQueries({
            queryKey: [...folderKeys.all, "contents"],
          });
        }
      }
    },

    onError: (error: Error, _, context) => {
      console.error("[useSendMessage] Error sending message:", error);

      // Remove both optimistic messages on error
      if (context) {
        const { messages, setMessages } = useChatStore.getState();
        const conversationMessages = messages[context.conversationId] || [];

        // Filter out both optimistic messages
        const filteredMessages = conversationMessages.filter(
          (m) =>
            m.id !== context.optimisticId &&
            m.id !== context.optimisticAssistantId,
        );

        if (filteredMessages.length !== conversationMessages.length) {
          setMessages(context.conversationId, filteredMessages);
        }

        // Clean up pending optimistic IDs
        useChatStore.getState().removePendingOptimisticId(context.optimisticId);
        useChatStore
          .getState()
          .removePendingOptimisticId(context.optimisticAssistantId);

        if (import.meta.env.DEV) {
          console.log(
            "[useSendMessage] Removed optimistic messages due to error:",
            context.optimisticId,
            context.optimisticAssistantId,
          );
        }
      }
    },
  });
}
