import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useInfiniteConversations } from "./useInfiniteConversations";
import { useCreateConversation, conversationKeys } from "./useConversations";
import useChatStore from "../store/chatStore";
import { generateConversationTitle } from "../lib/conversationUtils";
import { CONVERSATIONS_PAGE_LIMIT } from "../config/constants";

/**
 * Hook for creating and switching to a new chat conversation
 *
 * Handles:
 * - Creating a new conversation with numbered title
 * - Navigating to the new conversation URL
 * - Invalidating React Query cache to update sidebar
 *
 * @returns Object with createNewChat function and loading state
 */
export function useNewChat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
   * Create a new chat conversation and navigate to it
   */
  const createNewChat = useCallback(async () => {
    try {
      // Generate empty title - LLM will create title on first message
      const title = generateConversationTitle();

      if (import.meta.env.DEV) {
        console.log(`[useNewChat] Creating: ${title}`);
      }

      // Create conversation
      const response = await createConversation(title);
      const newConversationId = response.conversation.conversationId;

      if (import.meta.env.DEV) {
        console.log(`[useNewChat] Created: ${newConversationId}`);
      }

      // Set conversation ID in store BEFORE navigating
      setCurrentConversationId(newConversationId);

      // Wait for cache to update before navigating
      // This ensures useConversationInit validation passes on first try
      await queryClient.refetchQueries({ queryKey: conversationKeys.lists() });

      // Navigate to conversation with UUID
      navigate(`/chat/${newConversationId}`);

      return response.conversation;
    } catch (err) {
      console.error("[useNewChat] Failed to create conversation:", err);
      throw err;
    }
  }, [
    infiniteConversationsData,
    createConversation,
    navigate,
    setCurrentConversationId,
    queryClient,
  ]);

  return {
    createNewChat,
    isCreating,
    error,
  };
}
