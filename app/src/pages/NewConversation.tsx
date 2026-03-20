/**
 * NewConversation - Empty chat page for starting a new conversation.
 *
 * The conversation is NOT created upfront. Instead, it is created when the
 * user sends their first message:
 *   1. Create conversation (with mode if agent/bot selected)
 *   2. Pre-populate React Query cache with the created conversation metadata
 *   3. Send the message via useSendMessage (adds optimistic messages to chatStore)
 *   4. Refetch sidebar
 *   5. Navigate to /chat/:id with { newlyCreated: true } so Conversation.tsx
 *      skips the loading skeleton (chatStore already has the optimistic messages)
 *
 * This avoids orphaned conversations that have no user messages.
 */

import { useCallback, useMemo, useState, Profiler } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Chat } from "@vonlabs/design-components";
import { ConversationMode } from "@vonlabs/design-components";
import type { SendMessageOptions, FileAttachment } from "@vonlabs/design-components";

import { useAppShell } from "../hooks/useAppShell";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { useSalesforceConnection } from "../hooks/useSalesforceConnection";
import { useCreateConversation, conversationKeys } from "../hooks/useConversations";
import { chatSidebarKeys } from "../hooks/useChatSidebar";
import { useSendMessage } from "../hooks/useSendMessage";
import { SalesforceConnectionBanner } from "../components/SalesforceConnectionBanner";
import { SubscriptionInactiveBanner } from "../components/SubscriptionInactiveBanner";
import { config } from "../config";
import { reportRenderTiming } from "../lib/datadog";

const NewConversation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, collapseSidebar } = useAppShell();
  const {
    isSidebarV2,
    isAgentV2: isAgentV2Flag,
    isDeepResearchEnabled,
    isTenantDisabled,
    isSlashCommandsEnabled,
  } = useFeatureFlag();

  const {
    isConnected: isSalesforceConnected,
    isAuthenticated: isSalesforceAuthenticated,
  } = useSalesforceConnection();

  const isSalesforceReady = isSalesforceConnected && isSalesforceAuthenticated;
  const canSubmit = isSalesforceReady && !isTenantDisabled;

  const { mutateAsync: createConversation } = useCreateConversation();
  const { mutate: sendMessage } = useSendMessage();

  const [isCreating, setIsCreating] = useState(false);
  const [shouldShakeBanner, setShouldShakeBanner] = useState(false);
  const [shouldShakeSubscriptionBanner, setShouldShakeSubscriptionBanner] =
    useState(false);

  const availableAgentModes = useMemo(() => {
    const modes: ConversationMode[] = [ConversationMode.Auto];
    if (isDeepResearchEnabled) modes.push(ConversationMode.DashboardBuilder);
    return modes;
  }, [isDeepResearchEnabled]);

  const handleSendMessage = useCallback(
    async (
      content: string,
      _attachments?: FileAttachment[],
      options?: SendMessageOptions,
    ) => {
      if (isCreating) return;
      setIsCreating(true);
      try {
        const agentMode = options?.agentMode as ConversationMode | undefined;
        const mode =
          agentMode && agentMode !== ConversationMode.Auto
            ? agentMode
            : undefined;

        // 1. Create conversation (with mode if an agent/bot was selected)
        const res = await createConversation({
          title: "",
          agentVersion: isAgentV2Flag ? "v2" : "v1",
          mode,
        });
        const newId = res.conversation.conversationId;

        // 2. Pre-populate conversation metadata cache so Conversation.tsx
        //    renders instantly without waiting for a network round-trip.
        queryClient.setQueryData(["conversation", newId], res.conversation);

        // 3. Send the first message (adds optimistic messages to chatStore
        //    so the chat renders with the message immediately on navigation).
        sendMessage({ conversationId: newId, content });

        // 4. Refresh sidebar (fire-and-forget)
        queryClient.refetchQueries({
          queryKey: isSidebarV2
            ? chatSidebarKeys.sidebar()
            : conversationKeys.lists(),
        });

        // 5. Navigate — replace so back button skips /chat/new.
        //    { newlyCreated: true } tells Conversation.tsx to skip the skeleton
        //    since chatStore already has the optimistic messages.
        navigate(`/chat/${newId}`, {
          replace: true,
          state: { newlyCreated: true },
        });
      } catch (error) {
        console.error("[NewConversation] Failed to create conversation:", error);
        setIsCreating(false);
      }
    },
    [
      createConversation,
      isAgentV2Flag,
      isCreating,
      isSidebarV2,
      navigate,
      queryClient,
      sendMessage,
    ],
  );

  const handleDisabledInteraction = useCallback(() => {
    if (isTenantDisabled) {
      setShouldShakeSubscriptionBanner(true);
    } else {
      setShouldShakeBanner(true);
    }
  }, [isTenantDisabled]);

  const banner = isTenantDisabled ? (
    <SubscriptionInactiveBanner
      isTenantDisabled={isTenantDisabled}
      shouldShakeBanner={shouldShakeSubscriptionBanner}
      onShakeComplete={() => setShouldShakeSubscriptionBanner(false)}
    />
  ) : (
    <SalesforceConnectionBanner
      isSalesforceReady={isSalesforceReady}
      shouldShakeBanner={shouldShakeBanner}
      onShakeComplete={() => setShouldShakeBanner(false)}
    />
  );

  return (
    <Profiler id="new-conversation" onRender={reportRenderTiming}>
      <Chat
        title="von AI"
        userId={user?.id}
        userName={user?.firstName || user?.name?.split(" ")[0]}
        userEmail={user?.email}
        apiBaseUrl={config.apiBaseUrl}
        conversationId=""
        messages={[]}
        onSendMessage={handleSendMessage}
        isLoading={false}
        placeholder="Ask von anything"
        variant="floating"
        height="100%"
        width="100%"
        banner={banner}
        disableSubmit={!canSubmit || isCreating}
        onExamplePromptDisabledClick={handleDisabledInteraction}
        onInputWhileDisabled={handleDisabledInteraction}
        availableAgentModes={availableAgentModes}
        isAgentLocked={false}
        lockedConversationMode={ConversationMode.Auto}
        thinkingProcessVersion={isAgentV2Flag ? "v2" : "v1"}
        useStandardInput={isAgentV2Flag}
        enableFileUpload={false}
        enableCommands={isSlashCommandsEnabled}
        onCollapseSidebar={collapseSidebar}
      />
    </Profiler>
  );
};

export default NewConversation;
