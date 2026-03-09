/**
 * AnalyticsChatContainer - Chat sidebar for the Analytics/Dashboard page
 *
 * Reuses the same chat infrastructure (useChatV2, Pusher, event processing)
 * as the Conversation page, rendered inside a collapsible sidebar pane.
 *
 * Mounted with key={conversationId} to ensure clean remount if conversation changes.
 */

import { useMemo } from "react";
import { Chat } from "@vonlabs/design-components";
import { ConversationMode } from "@vonlabs/design-components";

import { useAppShell } from "../hooks/useAppShell";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { useMessages } from "../hooks/useMessages";
import { useCurrentConversation } from "../hooks/useCurrentConversation";
import { useSalesforceConnection } from "../hooks/useSalesforceConnection";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import useChatStore from "../store/chatStore";
import { useChatV2 } from "../hooks/useChatV2";
import { config } from "../config";
import { MESSAGES_PAGE_LIMIT } from "../config/constants";

export interface AnalyticsChatContainerProps {
  conversationId: string;
  dashboardTitle: string;
}

/**
 * Inner component that uses useChatV2 — only mounted when currentConversation is available.
 */
function AnalyticsChatInner({
  conversationId,
  dashboardTitle,
}: AnalyticsChatContainerProps) {
  const { user } = useAppShell();
  const { isSourcesEnabled } = useFeatureFlag();

  const { data: currentConversation } = useCurrentConversation(conversationId);

  const { messages } = useChatStore();
  const conversationMessages = useMemo(
    () => messages[conversationId] || [],
    [conversationId, messages],
  );

  const {
    fetchNextPage: fetchNextMessagePage,
    hasNextPage: hasNextMessagePage,
    isFetchingNextPage: isFetchingNextMessagePage,
    refetch: refetchMessages,
  } = useMessages(conversationId, MESSAGES_PAGE_LIMIT);

  const {
    isConnected: isSalesforceConnected,
    isAuthenticated: isSalesforceAuthenticated,
  } = useSalesforceConnection();

  const canSubmit = isSalesforceConnected && isSalesforceAuthenticated;

  const lockedConversationMode =
    currentConversation?.mode || ConversationMode.DashboardBuilder;

  // Infinite scroll for loading older messages
  const loadMoreMessagesRef = useInfiniteScroll({
    onLoadMore: fetchNextMessagePage,
    hasMore: !!hasNextMessagePage,
    isLoading: isFetchingNextMessagePage,
  });

  const chatV2 = useChatV2({
    conversationId,
    user,
    currentConversation: currentConversation ?? {
      conversationId,
      userId: user?.id ?? "",
      tenantId: user?.tenantId ?? "",
      title: dashboardTitle,
      agentVersion: "v2" as const,
      mode: ConversationMode.DashboardBuilder,
      createdAt: new Date().toISOString(),
      createdBy: null,
      updatedAt: null,
    },
    conversationMessages,
    refetchMessages: refetchMessages as () => Promise<unknown>,
    lockedConversationMode,
    isAgentLocked: true,
    canSubmit,
    onDisabledInteraction: () => {},
    salesforceInstanceUrl: undefined,
    isSlashCommandsEnabled: false,
    isActionsEnabled: false,
    isDeepLinksEnabled: false,
    isSourcesEnabled,
    isFileUploadEnabled: false,
    syncConversationModeToBackend: async () => {},
    onCollapseSidebar: () => {},
  });

  return (
    <Chat
      title={dashboardTitle}
      userId={user?.id}
      userName={user?.firstName || user?.name?.split(" ")[0]}
      userEmail={user?.email}
      apiBaseUrl={config.apiBaseUrl}
      conversationId={conversationId}
      messages={chatV2.transformedMessages}
      onSendMessage={chatV2.handleSendMessage}
      onStopStreaming={chatV2.handleStopStreaming}
      isLoading={false}
      placeholder="Make changes to this dashboard..."
      variant="floating"
      height="100%"
      width="100%"
      showMessagesFromIndex={chatV2.showMessagesFromIndex}
      thinkingProcessVersion="v2"
      useStandardInput
      disableSubmit={!chatV2.canSubmitFinal}
      showTransparency={isSourcesEnabled}
      onTransparencyClick={chatV2.handleTransparencyClick}
      onApprove={chatV2.handleApproval}
      onReject={chatV2.handleRejection}
      loadMoreRef={loadMoreMessagesRef}
      isFetchingMore={isFetchingNextMessagePage}
    />
  );
}

/**
 * Public component — handles loading state, then mounts AnalyticsChatInner
 * with key={conversationId} for clean remount.
 */
export function AnalyticsChatContainer({
  conversationId,
  dashboardTitle,
}: AnalyticsChatContainerProps) {
  return (
    <AnalyticsChatInner
      key={conversationId}
      conversationId={conversationId}
      dashboardTitle={dashboardTitle}
    />
  );
}
