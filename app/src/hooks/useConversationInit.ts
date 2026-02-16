import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteConversations } from "./useInfiniteConversations";
import { useCreateConversation } from "./useConversations";
import useChatStore from "../store/chatStore";
import { generateConversationTitle } from "../lib/conversationUtils";
import { CONVERSATIONS_PAGE_LIMIT } from "../config/constants";
import { useFeatureFlag } from "./useFeatureFlag";

/**
 * Initialize conversation on Dashboard mount
 *
 * Flow:
 * 1. If URL has conversationId → Trust and use it directly
 * 2. If no URL param → Fetch conversations, redirect to most recent
 * 3. If no conversations exist → Create "New Chat 1" and redirect to it
 *
 * @param urlConversationId - Optional conversation ID from URL params
 * @returns Current conversation ID and initialization state
 */
export function useConversationInit(urlConversationId?: string) {
  const navigate = useNavigate();
  const currentConversationId = useChatStore.use.currentConversationId();
  const setCurrentConversationId = useChatStore.use.setCurrentConversationId();

  // Get feature flag for agent version
  const { isAgentV2 } = useFeatureFlag();

  // Track whether we've already attempted to create the initial conversation
  // Prevents duplicate creation when isAgentV2 flag value changes asynchronously
  const hasCreatedInitialConversationRef = useRef(false);

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

    // CASE 1: URL has conversationId - trust it directly
    // We don't validate against loaded pages because older conversations
    // may not be on the first page of paginated data yet.
    // useMessages will handle fetching messages for any valid conversation.
    if (urlConversationId) {
      setCurrentConversationId(urlConversationId);

      if (import.meta.env.DEV) {
        console.log(
          `[useConversationInit] Loaded conversation from URL: ${urlConversationId}`,
        );
      }
      return;
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
    // Guard against duplicate creation when isAgentV2 flag changes asynchronously
    if (hasCreatedInitialConversationRef.current) {
      return;
    }
    hasCreatedInitialConversationRef.current = true;

    (async () => {
      try {
        const title = generateConversationTitle();

        if (import.meta.env.DEV) {
          console.log(`[useConversationInit] Creating: ${title}`);
        }

        const response = await createConversation({
          title,
          agentVersion: isAgentV2 ? "v2" : "v1",
        });
        const newConversationId = response.conversation.conversationId;

        if (import.meta.env.DEV) {
          console.log(`[useConversationInit] Created: ${newConversationId}`);
        }

        // Navigate to conversation with UUID
        navigate(`/chat/${newConversationId}`, { replace: true });
        setCurrentConversationId(newConversationId);
      } catch (error) {
        // Reset flag on error to allow retry
        hasCreatedInitialConversationRef.current = false;
        console.error(
          "[useConversationInit] Failed to create conversation:",
          error,
        );
      }
    })();
  }, [
    infiniteConversationsData,
    isLoadingConversations,
    urlConversationId,
    setCurrentConversationId,
    navigate,
    createConversation,
    isAgentV2,
  ]);

  return {
    currentConversationId,
    isInitializing: isLoadingConversations || isCreating,
    error: conversationsError || createError,
  };
}
