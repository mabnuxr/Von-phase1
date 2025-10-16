import { useCallback } from "react";
import { useInfiniteConversations } from "./useInfiniteConversations";
import { useCreateConversation } from "./useConversations";
import useChatStore from "../store/chatStore";
import { generateConversationTitle } from "../lib/conversationUtils";
import { CONVERSATIONS_PAGE_LIMIT } from "../config/constants";

/**
 * Hook for creating and switching to a new chat conversation
 *
 * Handles:
 * - Creating a new conversation with numbered title
 * - Setting it as the current conversation
 * - Invalidating React Query cache to update sidebar
 *
 * @returns Object with createNewChat function and loading state
 */
export function useNewChat() {
  const { setCurrentConversationId } = useChatStore();

  // Get current conversations data for title numbering
  const { data: infiniteConversationsData } = useInfiniteConversations(
    CONVERSATIONS_PAGE_LIMIT,
  );

  // Create conversation mutation
  const {
    mutateAsync: createConversation,
    isPending: isCreating,
    error,
  } = useCreateConversation();

  /**
   * Create a new chat conversation and switch to it
   */
  const createNewChat = useCallback(async () => {
    try {
      // Get total count for numbering from first page
      const firstPage = infiniteConversationsData?.pages[0];
      const existingCount = firstPage?.pagination?.total || 0;
      const title = generateConversationTitle(existingCount);

      if (import.meta.env.DEV) {
        console.log(`[useNewChat] Creating: ${title}`);
      }

      // Create conversation
      const response = await createConversation(title);

      // Switch to the new conversation (use UUID, not MongoDB ObjectId)
      setCurrentConversationId(response.conversation.conversationId);

      if (import.meta.env.DEV) {
        console.log(
          `[useNewChat] Created and switched to: ${response.conversation.conversationId}`,
        );
      }

      return response.conversation;
    } catch (err) {
      console.error("[useNewChat] Failed to create conversation:", err);
      throw err;
    }
  }, [infiniteConversationsData, createConversation, setCurrentConversationId]);

  return {
    createNewChat,
    isCreating,
    error,
  };
}
