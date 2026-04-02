import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useFirstConversationId } from "./useFirstConversationId";
import { useCreateConversation } from "./useConversations";
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
 * @returns Initialization state
 */
export function useConversationInit(urlConversationId?: string) {
  const navigate = useNavigate();

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
      if (import.meta.env.DEV) {
        console.log(
          `[useConversationInit] Loaded conversation from URL: ${urlConversationId}`,
        );
      }
      return;
    }

    // For CASE 2 & 3 we need data
    if (isLoading) return;

    // CASE 2: Conversations exist — redirect to new conversation page
    if (firstConversationId) {
      if (import.meta.env.DEV) {
        console.log(
          `[useConversationInit] Redirecting to new conversation page`,
        );
      }

      // Navigate with replace to avoid back button issues
      navigate(`/chat/new`, { replace: true });
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

        // Navigate to conversation — URL is the single source of truth
        navigate(`/chat/${newConversationId}`, { replace: true });
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
    navigate,
    createConversation,
    isAgentV2,
  ]);

  return {
    isInitializing: isLoading || isCreating,
    error: fetchError || createError,
  };
}
