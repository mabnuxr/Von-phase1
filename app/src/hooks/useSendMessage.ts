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

      // Generate optimistic ID for tracking
      const optimisticId = generateOptimisticId();

      // Create optimistic user message
      const optimisticMessage: MessageWithStreaming = {
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

      // Add optimistic message to store immediately
      useChatStore.getState().addMessage(conversationId, optimisticMessage);

      // Trigger scroll to bottom to show the new message
      useChatStore.getState().triggerScrollToBottom(conversationId);

      if (import.meta.env.DEV) {
        console.log("[useSendMessage] Added optimistic message:", optimisticId);
      }

      // Return context for onSuccess/onError
      return { optimisticId, conversationId };
    },

    onSuccess: (response, _content, _context) => {
      if (import.meta.env.DEV) {
        console.log(
          "[useSendMessage] Message acknowledged:",
          response.messageId,
        );
      }

      // NOTE: We intentionally do NOT remove the optimistic message here.
      // The optimistic message will remain visible until the Pusher user_message
      // event arrives and reconciles it via upsertMessage in the store.
      // This prevents the message from briefly disappearing between the HTTP
      // response and the Pusher event.
    },

    onError: (error: Error, _content, context) => {
      console.error("[useSendMessage] Error sending message:", error);

      // Remove the optimistic message on error
      if (context) {
        const { messages, setMessages } = useChatStore.getState();
        const conversationMessages = messages[context.conversationId] || [];

        // Filter out the optimistic message
        const filteredMessages = conversationMessages.filter(
          (m) => m.id !== context.optimisticId,
        );

        if (filteredMessages.length !== conversationMessages.length) {
          setMessages(context.conversationId, filteredMessages);

          if (import.meta.env.DEV) {
            console.log(
              "[useSendMessage] Removed optimistic message due to error:",
              context.optimisticId,
            );
          }
        }
      }
    },
  });
}
