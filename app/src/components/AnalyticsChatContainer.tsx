/**
 * AnalyticsChatContainer - Chat sidebar for the Analytics/Dashboard page
 *
 * Reuses the same chat infrastructure (useChatV2, Pusher, event processing)
 * as the Conversation page, rendered inside a collapsible sidebar pane.
 *
 * Mounted with key={conversationId} to ensure clean remount if conversation changes.
 */

import { useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Chat, ChatSkeleton } from "@vonlabs/design-components";
import { ConversationMode } from "@vonlabs/design-components";
import { dashboardKeys } from "../hooks/useDashboardQuery";

import { AnalyticsChatEmptyState } from "./AnalyticsChatEmptyState";
import { useAppShell } from "../hooks/useAppShell";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { useMessages } from "../hooks/useMessages";
import { useCurrentConversation } from "../hooks/useCurrentConversation";
import { useSalesforceConnection } from "../hooks/useSalesforceConnection";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { useCommandsPanel } from "../hooks/useCommandsPanel";
import { useReferenceStack } from "../hooks/useReferenceStack";
import type { ReferenceStackLayer } from "../hooks/useReferenceStack";
import { ReferenceType } from "../types/conversation";
import useChatStore from "../store/chatStore";
import { useChatV2 } from "../hooks/useChatV2";
import { config } from "../config";
import { MESSAGES_PAGE_LIMIT } from "../config/constants";

const CHAT_PANE_AGENT_MODES = [
  ConversationMode.Ask,
  ConversationMode.DashboardBuilder,
] as const;

const CHAT_PANE_DISABLED_AGENT_MODES = [
  ConversationMode.DashboardBuilder,
] as const;

export interface AnalyticsChatContainerProps {
  conversationId: string;
  dashboardId: string;
  dashboardTitle: string;
  dashboardVersion: number;
}

/**
 * Inner component that uses useChatV2 — only mounted when currentConversation is available.
 */
function AnalyticsChatInner({
  conversationId,
  dashboardId,
  dashboardTitle,
  dashboardVersion,
}: AnalyticsChatContainerProps) {
  const { user } = useAppShell();
  const { isSourcesEnabled, isSlashCommandsEnabled, isFileUploadEnabled } =
    useFeatureFlag();

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
    isLoading: isLoadingMessages,
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

  const {
    commands,
    isLoadingCommands,
    isSavingCommand,
    handleSaveCommand,
    handleUploadFile,
    handleRequestFilePreviewUrl,
    handleDeleteCommand,
    handleToggleFavorite,
  } = useCommandsPanel(user?.id);

  // Reference stack: dashboard base layer (always present, not removable)
  // Widget overlays can be pushed on top via refStack.push()
  const dashboardBaseLayer: ReferenceStackLayer = useMemo(
    () => ({
      display: {
        type: ReferenceType.Dashboard,
        name: dashboardTitle,
        id: dashboardId,
      },
      reference: {
        refId: `dashboard-${dashboardId}`,
        type: ReferenceType.Dashboard,
        context: {
          dashboardId,
          dashboardVersion,
          dashboardName: dashboardTitle,
        },
      },
    }),
    [dashboardId, dashboardTitle, dashboardVersion],
  );

  const refStack = useReferenceStack(dashboardBaseLayer);

  const queryClient = useQueryClient();

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
    isSlashCommandsEnabled,
    isActionsEnabled: false,
    isDeepLinksEnabled: false,
    isSourcesEnabled,
    isFileUploadEnabled,
    syncConversationModeToBackend: async () => {},
    onCollapseSidebar: () => {},
    references: refStack.references,
  });

  // Invalidate dashboard query when a RUN_FINISHED event produces a newer dashboard version
  useEffect(() => {
    if (
      chatV2.dashboard &&
      chatV2.dashboard.dashboard_version !== dashboardVersion
    ) {
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
    }
  }, [chatV2.dashboard, dashboardId, dashboardVersion, queryClient]);

  if (isLoadingMessages && conversationMessages.length === 0) {
    return <ChatSkeleton messageCount={4} />;
  }

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
      enableCommands={isSlashCommandsEnabled}
      commands={commands}
      isLoadingCommands={isLoadingCommands}
      onSaveCommand={handleSaveCommand}
      onDeleteCommand={handleDeleteCommand}
      isSavingCommand={isSavingCommand}
      isAdmin={user?.roles?.some((r) => r.toLowerCase() === "admin")}
      onToggleFavorite={handleToggleFavorite}
      onRequestFilePreviewUrl={handleRequestFilePreviewUrl}
      onUploadFile={handleUploadFile}
      enableFileUpload={isFileUploadEnabled}
      controlledAttachments={chatV2.fileAttachmentState}
      onRemoveAttachment={chatV2.handleRemoveAttachment}
      onFilesSelected={chatV2.handleFilesSelected}
      onFileClick={chatV2.handleFileClick}
      fileErrorMessage={chatV2.fileErrorMessage}
      onDismissFileError={() => chatV2.setFileErrorMessage(null)}
      referenceContext={refStack.activeContext}
      onRemoveReference={refStack.canRemove ? refStack.removeTop : undefined}
      availableAgentModes={[...CHAT_PANE_AGENT_MODES]}
      disabledAgentModes={[...CHAT_PANE_DISABLED_AGENT_MODES]}
    >
      <Chat.EmptyState>
        <AnalyticsChatEmptyState />
      </Chat.EmptyState>
    </Chat>
  );
}

/**
 * Public component — handles loading state, then mounts AnalyticsChatInner
 * with key={conversationId} for clean remount.
 */
export function AnalyticsChatContainer({
  conversationId,
  dashboardId,
  dashboardTitle,
  dashboardVersion,
}: AnalyticsChatContainerProps) {
  return (
    <AnalyticsChatInner
      key={conversationId}
      conversationId={conversationId}
      dashboardId={dashboardId}
      dashboardTitle={dashboardTitle}
      dashboardVersion={dashboardVersion}
    />
  );
}
