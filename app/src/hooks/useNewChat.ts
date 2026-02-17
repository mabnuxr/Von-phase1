import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateConversation, conversationKeys } from "./useConversations";
import { chatSidebarKeys } from "./useChatSidebar";
import { generateConversationTitle } from "../lib/conversationUtils";

interface UseNewChatParams {
  currentConversationId: string | null;
  isSidebarV2: boolean;
  isAgentV2Flag: boolean;
}

/**
 * Encapsulates new chat creation logic.
 *
 * - Creates conversation via API
 * - Refetches the correct sidebar query (V1 vs V2)
 * - Manages loading state for chat pane skeleton
 * - Navigates to the new conversation
 */
export function useNewChat({
  currentConversationId,
  isSidebarV2,
  isAgentV2Flag,
}: UseNewChatParams) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutateAsync: createConversation } = useCreateConversation();

  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [pendingConversationId, setPendingConversationId] = useState<
    string | null
  >(null);

  // Clear loading states when we arrive at the target conversation
  useEffect(() => {
    if (
      pendingConversationId &&
      currentConversationId === pendingConversationId
    ) {
      setIsCreatingChat(false);
      setPendingConversationId(null);
    }
  }, [currentConversationId, pendingConversationId]);

  const handleNewChatClick = useCallback(async () => {
    setIsCreatingChat(true);
    try {
      const title = generateConversationTitle();
      const response = await createConversation({
        title,
        agentVersion: isAgentV2Flag ? "v2" : "v1",
      });
      const newId = response.conversation.conversationId;
      setPendingConversationId(newId);
      await queryClient.refetchQueries({
        queryKey: isSidebarV2
          ? chatSidebarKeys.sidebar()
          : conversationKeys.lists(),
      });
      navigate(`/chat/${newId}`);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("[useNewChat] Failed to create conversation:", error);
      }
      setIsCreatingChat(false);
      setPendingConversationId(null);
    }
  }, [createConversation, isAgentV2Flag, isSidebarV2, queryClient, navigate]);

  return {
    handleNewChatClick,
    isCreatingChat,
  };
}
