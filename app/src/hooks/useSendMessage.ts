import { useMutation } from "@tanstack/react-query";
import { conversationsService } from "../services";
import useChatStore from "../store/chatStore";

/**
 * Hook to send messages via Pusher flow
 * - Sends message to backend
 * - Backend emits Pusher events:
 *   1. message.received (user's message with real ID)
 *   2. message.start (assistant placeholder)
 *   3. message.chunk (streaming content)
 *   4. message.complete (final message)
 * - Frontend listens to Pusher events and updates UI automatically
 * - No optimistic updates - single source of truth from backend
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

      // Send to backend - no optimistic update
      // Backend will emit Pusher events that update the UI
      return conversationsService.sendMessage(
        currentConversationId,
        content,
        "text",
      );
    },

    onSuccess: (response) => {
      if (import.meta.env.DEV) {
        console.log(
          "[useSendMessage] Message acknowledged:",
          response.messageId,
        );
      }
    },

    onError: (error: Error) => {
      console.error("[useSendMessage] Error sending message:", error);
    },
  });
}
