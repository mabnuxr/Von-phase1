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
import { Chat } from "@vonlabs/design-components";
import { ConversationMode } from "@vonlabs/design-components";

import { useAppShell } from "../hooks/useAppShell";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { useSalesforceConnection } from "../hooks/useSalesforceConnection";
import { useCreateAndSendMessage } from "../hooks/useCreateAndSendMessage";
import { SalesforceConnectionBanner } from "../components/SalesforceConnectionBanner";
import { SubscriptionInactiveBanner } from "../components/SubscriptionInactiveBanner";
import { config } from "../config";
import { reportRenderTiming } from "../lib/datadog";

const NewConversation = () => {
  const { user } = useAppShell();
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

  const { handleSendMessage, transformedMessages, isCreating } =
    useCreateAndSendMessage({
      agentVersion: isAgentV2Flag ? "v2" : "v1",
      isAgentV2: isAgentV2Flag,
      title: "",
      navigateOnCreate: true,
      isSidebarV2,
    });

  const [shouldShakeBanner, setShouldShakeBanner] = useState(false);
  const [shouldShakeSubscriptionBanner, setShouldShakeSubscriptionBanner] =
    useState(false);

  const availableAgentModes = useMemo(() => {
    const modes: ConversationMode[] = [ConversationMode.Auto];
    if (isDeepResearchEnabled) modes.push(ConversationMode.DashboardBuilder);
    return modes;
  }, [isDeepResearchEnabled]);

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
        messages={transformedMessages}
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
      />
    </Profiler>
  );
};

export default NewConversation;
