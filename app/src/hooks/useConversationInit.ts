import { useEffect } from "react";
import { useInfiniteConversations } from "./useInfiniteConversations";
import { useCreateConversation } from "./useConversations";
import useChatStore from "../store/chatStore";
import { generateConversationTitle } from "../lib/conversationUtils";
import { CONVERSATIONS_PAGE_LIMIT } from "../config/constants";

/**
 * Initialize conversation on Dashboard mount
 *
 * Flow:
 * 1. Fetch user's conversations from backend
 * 2. If conversations exist → Set most recent as current
 * 3. If no conversations exist → Create "New Chat 1" and set as current
 *
 * @returns Current conversation ID and initialization state
 */
export function useConversationInit() {
  const currentConversationId = useChatStore.use.currentConversationId();
  const setCurrentConversationId = useChatStore.use.setCurrentConversationId();

  // Fetch conversations with infinite scroll (sorted by updatedAt DESC from backend)
  const {
    data: infiniteConversationsData,
    isLoading: isLoadingConversations,
    error: conversationsError,
  } = useInfiniteConversations(CONVERSATIONS_PAGE_LIMIT);

  // Mutation for creating new conversation
  const {
    mutateAsync: createConversation,
    isPending: isCreating,
    error: createError,
  } = useCreateConversation();

  // Run initialization logic once data is available
  useEffect(() => {
    // Guard clauses
    if (isLoadingConversations) return;
    if (currentConversationId) return; // Already initialized
    if (!infiniteConversationsData) return;

    // Get first page data
    const firstPage = infiniteConversationsData.pages[0];
    const conversations = firstPage.data;
    const pagination = firstPage.pagination;

    if (conversations.length > 0) {
      // Use most recent conversation (index 0, sorted by updatedAt DESC)
      // Use UUID as primary identifier
      const mostRecent = conversations[0];
      setCurrentConversationId(mostRecent.conversationId);

      if (import.meta.env.DEV) {
        console.log(
          `[useConversationInit] Loaded conversation: ${mostRecent.title} (${mostRecent.conversationId})`,
        );
      }
    } else {
      // No conversations - create first one
      initializeNewConversation(pagination.total);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    infiniteConversationsData,
    isLoadingConversations,
    currentConversationId,
    setCurrentConversationId,
  ]);

  /**
   * Create first conversation for user
   */
  async function initializeNewConversation(existingCount: number) {
    try {
      const title = generateConversationTitle(existingCount);

      if (import.meta.env.DEV) {
        console.log(`[useConversationInit] Creating: ${title}`);
      }

      const response = await createConversation(title);
      setCurrentConversationId(response.conversation.conversationId);

      if (import.meta.env.DEV) {
        console.log(
          `[useConversationInit] Created: ${response.conversation.conversationId}`,
        );
      }
    } catch (error) {
      console.error(
        "[useConversationInit] Failed to create conversation:",
        error,
      );
    }
  }

  return {
    currentConversationId,
    isInitializing: isLoadingConversations || isCreating,
    error: conversationsError || createError,
  };
}
