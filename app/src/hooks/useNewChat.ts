import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateConversation, conversationKeys } from "./useConversations";
import { generateConversationTitle } from "../lib/conversationUtils";

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

      // Wait for cache to update before navigating
      // This ensures useConversationInit validation passes on first try
      await queryClient.refetchQueries({ queryKey: conversationKeys.lists() });

      // FIX: Navigate FIRST, let Dashboard's useEffect sync the store
      // This prevents race condition where Chat component sees mismatched
      // currentConversationId (new) vs messages (old) during transition
      navigate(`/chat/${newConversationId}`);

      // NOTE: Don't call setCurrentConversationId here
      // Dashboard.tsx line 270-278 will update store when URL param changes
      // This ensures clean, predictable state transition: URL → Store → Messages → UI

      return response.conversation;
    } catch (err) {
      console.error("[useNewChat] Failed to create conversation:", err);
      throw err;
    }
  }, [createConversation, navigate, queryClient]);

  return {
    createNewChat,
    isCreating,
    error,
  };
}
