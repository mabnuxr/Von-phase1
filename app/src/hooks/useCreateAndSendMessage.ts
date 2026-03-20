/**
 * useCreateAndSendMessage
 *
 * Shared logic for the "create conversation on first message" pattern used in:
 * - NewConversation.tsx  (regular chat)
 * - AnalyticsNewConversationContainer.tsx  (analytics chat pane)
 *
 * Returns:
 *   handleSendMessage  — call with message content (+ optional SendMessageOptions)
 *   transformedMessages — pre-formatted messages for the Chat component
 *   isCreating         — true while the API calls are in-flight
 */

import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ConversationMode } from "@vonlabs/design-components";
import type { SendMessageOptions } from "@vonlabs/design-components";

import { useCreateConversation, conversationKeys } from "./useConversations";
import { chatSidebarKeys } from "./useChatSidebar";
import { useSendMessage } from "./useSendMessage";
import { transformConversationMessages } from "../lib/dashboardUtils";
import type { MessageWithStreaming, MessageReference } from "../types/conversation";

export interface UseCreateAndSendMessageOptions {
  /**
   * Agent version to use when creating the conversation.
   * Defaults to "v2".
   */
  agentVersion?: "v1" | "v2";

  /**
   * Whether the agent is v2 — used when transforming pending messages.
   * Defaults to true.
   */
  isAgentV2?: boolean;

  /**
   * Conversation title. Defaults to "".
   */
  title?: string;

  /**
   * If provided, the conversation is locked to this mode.
   * If undefined, the mode comes from SendMessageOptions.agentMode (regular chat).
   */
  fixedMode?: ConversationMode;

  /**
   * References to attach to the first message (e.g. a dashboard reference).
   */
  references?: MessageReference[];

  /**
   * Called with the new conversationId on success.
   * Provide this instead of `navigateOnCreate` for embedded contexts (e.g. analytics pane).
   */
  onCreated?: (conversationId: string) => void;

  /**
   * When true, navigates to /chat/:id after creation (regular chat flow).
   * Mutually exclusive with onCreated — set one or the other.
   * Defaults to false.
   */
  navigateOnCreate?: boolean;

  /**
   * Required when navigateOnCreate=true.
   * Used to select the correct sidebar refetch key.
   */
  isSidebarV2?: boolean;
}

export function useCreateAndSendMessage({
  agentVersion = "v2",
  isAgentV2 = true,
  title = "",
  fixedMode,
  references,
  onCreated,
  navigateOnCreate = false,
  isSidebarV2 = true,
}: UseCreateAndSendMessageOptions = {}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutateAsync: createConversation } = useCreateConversation();
  const { mutate: sendMessage } = useSendMessage();

  const [isCreating, setIsCreating] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<MessageWithStreaming[] | null>(null);

  const transformedMessages = useMemo(() => {
    if (!pendingMessages) return [];
    return transformConversationMessages(pendingMessages, isAgentV2).messages;
  }, [pendingMessages, isAgentV2]);

  const handleSendMessage = useCallback(
    async (
      content: string,
      _attachments?: unknown,
      options?: SendMessageOptions,
    ) => {
      if (isCreating) return;
      setIsCreating(true);

      // Show user message + thinking indicator immediately, before any API call.
      const tempId = `temp-${Date.now()}`;
      setPendingMessages([
        {
          id: tempId,
          runId: tempId,
          conversationId: "",
          messageType: "text",
          messageContent: content,
          role: "user",
          createdAt: new Date().toISOString(),
          createdBy: null,
          isStreaming: false,
          status: "completed",
        },
        {
          id: `${tempId}-assistant`,
          runId: `${tempId}-assistant`,
          conversationId: "",
          messageType: "text",
          messageContent: "",
          role: "assistant",
          createdAt: new Date().toISOString(),
          createdBy: null,
          isStreaming: true,
          status: "streaming",
        },
      ]);

      try {
        // Resolve conversation mode
        const mode: ConversationMode | undefined = fixedMode
          ?? ((): ConversationMode | undefined => {
            const agentMode = options?.agentMode as ConversationMode | undefined;
            return agentMode && agentMode !== ConversationMode.Auto ? agentMode : undefined;
          })();

        // 1. Create the conversation
        const res = await createConversation({ title, agentVersion, mode });
        const newId = res.conversation.conversationId;

        // 2. Pre-populate React Query cache so the chat renders without waiting for a round-trip
        queryClient.setQueryData(["conversation", newId], res.conversation);

        // 3. Send the first message (optimistic chatStore update via useSendMessage)
        sendMessage({
          conversationId: newId,
          content,
          ...(references?.length ? { references } : {}),
        });

        if (navigateOnCreate) {
          // 4a. Refresh sidebar (fire-and-forget)
          queryClient.refetchQueries({
            queryKey: isSidebarV2
              ? chatSidebarKeys.sidebar()
              : conversationKeys.lists(),
          });

          // 4b. Navigate — replace so back button skips /chat/new.
          //     { newlyCreated: true } tells Conversation.tsx to skip the skeleton.
          navigate(`/chat/${newId}`, {
            replace: true,
            state: { newlyCreated: true },
          });
        } else {
          onCreated?.(newId);
        }
      } catch (error) {
        console.error("[useCreateAndSendMessage] Failed to create conversation:", error);
        setIsCreating(false);
        setPendingMessages(null);
      }
    },
    [
      agentVersion,
      createConversation,
      fixedMode,
      isCreating,
      isSidebarV2,
      navigate,
      navigateOnCreate,
      onCreated,
      queryClient,
      references,
      sendMessage,
      title,
    ],
  );

  return { handleSendMessage, transformedMessages, isCreating };
}
