import { useMutation } from "@tanstack/react-query";
import { conversationsService } from "../services";
import useChatStore from "../store/chatStore";
import type { MessageWithStreaming } from "../types/conversation";

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
  const { currentConversationId } = useChatStore();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!currentConversationId) {
        throw new Error("No active conversation");
      }

      if (import.meta.env.DEV) {
        console.log("[useSendMessage] Sending message:", content);
      }

      // Send to backend
      // Backend will emit Pusher events that add the real message
      return conversationsService.sendMessage(
        currentConversationId,
        content,
        "text",
      );
    },

    // Optimistic update: Add message to UI immediately before API call
    onMutate: async (content: string): Promise<MutationContext | undefined> => {
      const conversationId = useChatStore.getState().currentConversationId;
      if (!conversationId) {
        return undefined;
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

      // Create optimistic user message
      const optimisticUserMessage: MessageWithStreaming = {
        id: optimisticId,
        runId: optimisticId,
        conversationId: conversationId,
        messageType: "text",
        messageContent: content,
        role: "user",
        createdAt: new Date().toISOString(),
        createdBy: null,
        isStreaming: false,
        status: "completed",
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

        if (import.meta.env.DEV) {
          console.log(
            "[useSendMessage] Updated optimistic ID to real ID:",
            context.optimisticId,
            "->",
            response.messageId,
          );
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

          if (import.meta.env.DEV) {
            console.log(
              "[useSendMessage] Removed optimistic messages due to error:",
              context.optimisticId,
              context.optimisticAssistantId,
            );
          }
        }
      }
    },
  });
}
