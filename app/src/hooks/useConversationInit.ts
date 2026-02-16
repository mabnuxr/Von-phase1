import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useFirstConversationId } from "./useFirstConversationId";
import { useCreateConversation } from "./useConversations";
import useChatStore from "../store/chatStore";
import { generateConversationTitle } from "../lib/conversationUtils";
import { useFeatureFlag } from "./useFeatureFlag";

/**
 * Initialize conversation on Dashboard mount
 *
 * Flow:
 * 1. If URL has conversationId → Trust and use it directly
 * 2. If no URL param → Redirect to most recent conversation
 *    (lightweight fetch — only 1 item, version-aware endpoint)
 * 3. If no conversations exist → Create "New Chat 1" and redirect to it
 *
 * @param urlConversationId - Optional conversation ID from URL params
 * @returns Current conversation ID and initialization state
 */
export function useConversationInit(urlConversationId?: string) {
  const navigate = useNavigate();
  const currentConversationId = useChatStore.use.currentConversationId();
  const setCurrentConversationId = useChatStore.use.setCurrentConversationId();

  // Get feature flag for agent version (used when creating first conversation)
  const { isAgentV2 } = useFeatureFlag();

  // Track whether we've already attempted to create the initial conversation
  // Prevents duplicate creation when isAgentV2 flag value changes asynchronously
  const hasCreatedInitialConversationRef = useRef(false);

  // Lightweight fetch — only 1 conversation, version-aware endpoint.
  // Own query key, no interference with sidebar caches.
  const {
    data: firstConversationId,
    isLoading,
    error: fetchError,
  } = useFirstConversationId();

  // Mutation for creating new conversation
  const {
    mutateAsync: createConversation,
    isPending: isCreating,
    error: createError,
  } = useCreateConversation();

  // Run initialization logic once data is available
  useEffect(() => {
    // CASE 1: URL has conversationId — trust it directly.
    // No validation against loaded pages; useMessages handles fetching.
    if (urlConversationId) {
      setCurrentConversationId(urlConversationId);

      if (import.meta.env.DEV) {
        console.log(
          `[useConversationInit] Loaded conversation from URL: ${urlConversationId}`,
        );
      }
      return;
    }

    // For CASE 2 & 3 we need data
    if (isLoading) return;

    // CASE 2: Redirect to most recent conversation
    if (firstConversationId) {
      if (import.meta.env.DEV) {
        console.log(
          `[useConversationInit] Redirecting to most recent conversation: ${firstConversationId}`,
        );
      }

      // Navigate with replace to avoid back button issues
      navigate(`/chat/${firstConversationId}`, { replace: true });
      // Don't set store here — the URL change will trigger Dashboard's useEffect
      return;
    }

    // CASE 3: No conversations — create first one
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
    firstConversationId,
    isLoading,
    urlConversationId,
    setCurrentConversationId,
    navigate,
    createConversation,
    isAgentV2,
  ]);

  return {
    currentConversationId,
    isInitializing: isLoading || isCreating,
    error: fetchError || createError,
  };
}
