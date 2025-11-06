import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
 * 2. If URL has conversationId → Validate and use it
 * 3. If no URL param or invalid → Redirect to first conversation
 * 4. If no conversations exist → Create "New Chat 1" and redirect to it
 *
 * @param urlConversationId - Optional conversation ID from URL params
 * @returns Current conversation ID and initialization state
 */
export function useConversationInit(urlConversationId?: string) {
  const navigate = useNavigate();
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
    if (!infiniteConversationsData) return;

    // Get all conversations
    const conversations = infiniteConversationsData.pages.flatMap(
      (page) => page.data,
    );

    // CASE 1: URL has conversationId - validate it
    if (urlConversationId) {
      const exists = conversations.some(
        (conv) => conv.conversationId === urlConversationId,
      );

      if (exists) {
        // Valid conversation - set as current and we're done
        setCurrentConversationId(urlConversationId);

        if (import.meta.env.DEV) {
          console.log(
            `[useConversationInit] Loaded conversation from URL: ${urlConversationId}`,
          );
        }
        return;
      }

      // Invalid conversation ID in URL - fall through to CASE 2
      if (import.meta.env.DEV) {
        console.warn(
          `[useConversationInit] Invalid conversation ID in URL: ${urlConversationId}`,
        );
      }
    }

    // CASE 2: No URL param OR invalid conversation - redirect to first conversation
    if (conversations.length > 0) {
      const mostRecent = conversations[0];

      if (import.meta.env.DEV) {
        console.log(
          `[useConversationInit] Redirecting to most recent conversation: ${mostRecent.conversationId}`,
        );
      }

      // Navigate with replace to avoid back button issues
      navigate(`/chat/${mostRecent.conversationId}`, { replace: true });
      // Don't set store here - the URL change will trigger Dashboard's useEffect
      return;
    }

    // CASE 3: No conversations - create first one
    (async () => {
      try {
        const title = generateConversationTitle();

        if (import.meta.env.DEV) {
          console.log(`[useConversationInit] Creating: ${title}`);
        }

        const response = await createConversation(title);
        const newConversationId = response.conversation.conversationId;

        if (import.meta.env.DEV) {
          console.log(`[useConversationInit] Created: ${newConversationId}`);
        }

        // Navigate to conversation with UUID
        navigate(`/chat/${newConversationId}`, { replace: true });
        setCurrentConversationId(newConversationId);
      } catch (error) {
        console.error(
          "[useConversationInit] Failed to create conversation:",
          error,
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    infiniteConversationsData,
    isLoadingConversations,
    urlConversationId,
    setCurrentConversationId,
    navigate,
  ]);

  return {
    currentConversationId,
    isInitializing: isLoadingConversations || isCreating,
    error: conversationsError || createError,
  };
}
