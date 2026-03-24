/**
 * ChatV2Container - Container component for V2 chat conversations
 *
 * Renders the V2 chat experience using either:
 * - DeepResearchConversation (when in deep research mode)
 * - Chat with thinkingProcessVersion="v2" (regular mode)
 *
 * All business logic lives in useChatV2 — this component is JSX only.
 *
 * Mounted with key={conversationId} from Dashboard, so it remounts cleanly
 * on conversation switch (no stale state, no race conditions).
 */

import { Profiler, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chat,
  FilePreviewModal,
  ArtifactViewerPanel,
} from "@vonlabs/design-components";
import { ConversationMode } from "@vonlabs/design-components";
import type { MentionItem } from "@vonlabs/design-components";
import { MentionItemType } from "@vonlabs/design-components";

import type { MessageWithStreaming, Conversation } from "../types/conversation";
import type { User } from "../services";
import { config } from "../config";
import { useChatV2 } from "../hooks/useChatV2";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { useDashboardPane } from "../hooks/useDashboardPane";
import { useDashboardList } from "../hooks/useDashboardList";
import { DeepResearchConversation } from "./DeepResearchConversation";
import { DashboardPreviewPane } from "./DashboardPreviewPane";
import { SingleArtifactDrawerContainer } from "./SingleArtifactDrawerContainer";
import { LazyTransparencyDrawer } from "./LazyTransparencyDrawer";
import { reportRenderTiming } from "../lib/datadog";
import { useCommandsPanel } from "../hooks/useCommandsPanel";
import { useTeamMembers } from "../hooks/useTeam";
import { WriteBlockedBanner } from "./WriteBlockedBanner";
import { GmailDraftCardContainer } from "./GmailDraftCardContainer";
import type { FileArtifact } from "@vonlabs/design-components";

export interface ChatV2ContainerProps {
  conversationId: string;
  user: User | null;
  currentConversation: Conversation;
  conversationMessages: MessageWithStreaming[];
  isLoadingMessages: boolean;
  fetchNextMessagePage: () => void;
  hasNextMessagePage: boolean;
  isFetchingNextMessagePage: boolean;
  refetchMessages: () => Promise<unknown>;
  lockedConversationMode: ConversationMode;
  isAgentLocked: boolean;
  canSubmit: boolean;
  onDisabledInteraction: () => void;
  salesforceInstanceUrl?: string;
  isSlashCommandsEnabled: boolean;
  isActionsEnabled: boolean;
  isDeepLinksEnabled: boolean;
  isSourcesEnabled: boolean;
  isFileUploadEnabled: boolean;
  isArtifactsEnabled: boolean;
  isScheduledCommandsEnabled: boolean;
  availableAgentModes?: ConversationMode[];
  syncConversationModeToBackend: (mode: ConversationMode) => Promise<void>;
  banner: React.ReactNode;
  onCollapseSidebar: () => void;
  onGoogleDriveClick?: (fileId: string) => void;
  isDriveEnabled?: boolean;
  isDriveConnected?: boolean;
  driveTooltip?: string;
  driveLoadingFileId?: string | null;
}

export function ChatV2Container(props: ChatV2ContainerProps) {
  const {
    conversationId,
    user,
    isFetchingNextMessagePage,
    fetchNextMessagePage,
    hasNextMessagePage,
    lockedConversationMode,
    isAgentLocked,
    onDisabledInteraction,
    salesforceInstanceUrl,
    isSlashCommandsEnabled,
    isActionsEnabled,
    isDeepLinksEnabled,
    isSourcesEnabled,
    isArtifactsEnabled,
    isFileUploadEnabled,
    isScheduledCommandsEnabled,
    availableAgentModes,
    banner,
    onGoogleDriveClick,
    isDriveEnabled,
    isDriveConnected,
    driveTooltip,
    driveLoadingFileId,
    onCollapseSidebar,
  } = props;

  const navigate = useNavigate();

  const chatV2 = useChatV2({
    conversationId: props.conversationId,
    user: props.user,
    currentConversation: props.currentConversation,
    conversationMessages: props.conversationMessages,
    refetchMessages: props.refetchMessages,
    lockedConversationMode: props.lockedConversationMode,
    isAgentLocked: props.isAgentLocked,
    canSubmit: props.canSubmit,
    onDisabledInteraction: props.onDisabledInteraction,
    salesforceInstanceUrl: props.salesforceInstanceUrl,
    isSlashCommandsEnabled: props.isSlashCommandsEnabled,
    isActionsEnabled: props.isActionsEnabled,
    isDeepLinksEnabled: props.isDeepLinksEnabled,
    isSourcesEnabled: props.isSourcesEnabled,
    isFileUploadEnabled: props.isFileUploadEnabled,
    syncConversationModeToBackend: props.syncConversationModeToBackend,
    onCollapseSidebar: props.onCollapseSidebar,
  });

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
    handleSendTest,
  } = useCommandsPanel(user?.id);

  // @ Mention: lazily fetch dashboard list only after user types "@"
  const [mentionsActivated, setMentionsActivated] = useState(false);
  const handleMentionsActivated = useCallback(() => {
    setMentionsActivated(true);
  }, []);
  const { data: dashboardListData, isLoading: isLoadingMentions } =
    useDashboardList(mentionsActivated);

  const mentionItems: MentionItem[] = useMemo(
    () =>
      dashboardListData?.data.map((d) => ({
        id: d.dashboard_id,
        name: d.dashboard_name,
        type: MentionItemType.Dashboard,
        version: d.dashboard_version,
      })) ?? [],
    [dashboardListData],
  );

  // Custom artifact card renderer — renders GmailDraftCard for email_draft artifacts
  const renderArtifactCard = useCallback(
    (artifact: FileArtifact) => {
      if (
        artifact.artifactType === "email_draft" ||
        artifact.fileName?.endsWith(".eml")
      ) {
        return (
          <GmailDraftCardContainer
            conversationId={conversationId}
            artifact={artifact}
          />
        );
      }
      return null;
    },
    [conversationId],
  );

  // Dashboard preview pane state
  const { dashboardPaneState, openDashboardPane, closeDashboardPane } =
    useDashboardPane();

  // Dashboard preview button: open artifact preview pane & collapse sidebar
  const handleDashboardPreview = useCallback(
    (dashboardId: string) => {
      openDashboardPane(dashboardId);
      onCollapseSidebar();
    },
    [openDashboardPane, onCollapseSidebar],
  );

  // Dashboard open button: navigate to full dashboard page
  const handleDashboardOpen = useCallback(
    (dashboardId: string) => {
      navigate(`/dashboard/${dashboardId}?conversationId=${conversationId}`);
    },
    [conversationId, navigate],
  );

  const { data: teamMembersData } = useTeamMembers(
    isScheduledCommandsEnabled ? user?.tenantId : undefined,
  );
  const teamMembersForSchedule = isScheduledCommandsEnabled
    ? (teamMembersData ?? []).map((m) => ({
        id: m.id,
        email: m.email,
        firstName: m.firstName,
        lastName: m.lastName,
      }))
    : undefined;
  const currentUserRecipient =
    isScheduledCommandsEnabled && user
      ? {
          id: user.id,
          email: user.email,
          firstName: user.firstName ?? user.name?.split(" ")[0] ?? "",
          lastName:
            user.lastName ?? user.name?.split(" ").slice(1).join(" ") ?? "",
        }
      : undefined;

  return (
    <Profiler id="ChatV2Container" onRender={reportRenderTiming}>
      {chatV2.isDeepResearchMode && chatV2.transformedMessages.length > 0 ? (
        /* Deep Research Mode */
        <div className="flex h-full w-full gap-1">
          <div
            className={`min-w-0 flex flex-col ${dashboardPaneState.isOpen ? "flex-shrink-0" : "flex-1"}`}
            style={dashboardPaneState.isOpen ? { width: 480 } : undefined}
          >
            {banner}
            {chatV2.writeBlocked && (
              <div className="w-full max-w-4xl mx-auto mb-2 px-2">
                <WriteBlockedBanner
                  writeBlocked={chatV2.writeBlocked}
                  onDismiss={chatV2.dismissWriteBlocked}
                />
              </div>
            )}
            <DeepResearchConversation
              messages={chatV2.transformedMessages}
              userName={user?.firstName || user?.name?.split(" ")[0]}
              userEmail={user?.email}
              conversationId={conversationId}
              researchResults={chatV2.effectiveResearchResults ?? undefined}
              isDeepResearchRunning={chatV2.isDeepResearchRunning}
              dashboard={chatV2.dashboard ?? undefined}
              lockedConversationMode={lockedConversationMode}
              onSendMessage={chatV2.handleSendMessage}
              onStopStreaming={chatV2.handleStopStreaming}
              onArtifactClick={chatV2.handleArtifactClick}
              onApprove={chatV2.handleApproval}
              onReject={chatV2.handleRejection}
              placeholder="Ask von anything"
              disableSubmit={!chatV2.canSubmitFinal}
              onInputWhileDisabled={onDisabledInteraction}
              enableCommands={isSlashCommandsEnabled}
              availableAgentModes={availableAgentModes}
              fetchNextMessagePage={fetchNextMessagePage}
              hasNextMessagePage={hasNextMessagePage}
              isFetchingNextMessagePage={isFetchingNextMessagePage}
              onDashboardPreview={handleDashboardPreview}
              onDashboardOpen={handleDashboardOpen}
            />
          </div>

          {/* Dashboard Preview Pane */}
          {dashboardPaneState.isOpen && dashboardPaneState.dashboardId && (
            <DashboardPreviewPane
              dashboardId={dashboardPaneState.dashboardId}
              conversationId={conversationId}
              onClose={closeDashboardPane}
            />
          )}
        </div>
      ) : (
        /* Regular V2 Mode */
        <div className="flex h-full w-full gap-1">
          <div className="flex-1 min-w-0">
            <Chat
              title="von AI"
              userId={user?.id}
              userName={user?.firstName || user?.name?.split(" ")[0]}
              userEmail={user?.email}
              apiBaseUrl={config.apiBaseUrl}
              conversationId={conversationId}
              messages={chatV2.transformedMessages}
              onSendMessage={chatV2.handleSendMessage}
              onStopStreaming={chatV2.handleStopStreaming}
              inputValue={chatV2.autoPopulatedInput}
              onInputValueChange={chatV2.setAutoPopulatedInput}
              isLoading={false}
              loadMoreRef={loadMoreMessagesRef}
              isFetchingMore={isFetchingNextMessagePage}
              placeholder="Ask von anything"
              variant="floating"
              height="100%"
              width="100%"
              showMessagesFromIndex={chatV2.showMessagesFromIndex}
              onArtifactClick={chatV2.handleArtifactClick}
              banner={
                <>
                  {banner}
                  {chatV2.writeBlocked && (
                    <WriteBlockedBanner
                      writeBlocked={chatV2.writeBlocked}
                      onDismiss={chatV2.dismissWriteBlocked}
                    />
                  )}
                </>
              }
              disableSubmit={!chatV2.canSubmitFinal}
              examplePromptsDisabled={!chatV2.canSubmitFinal}
              onExamplePromptDisabledClick={onDisabledInteraction}
              onInputWhileDisabled={onDisabledInteraction}
              enableCommands={isSlashCommandsEnabled}
              commands={commands}
              isLoadingCommands={isLoadingCommands}
              onSaveCommand={handleSaveCommand}
              onDeleteCommand={handleDeleteCommand}
              isSavingCommand={isSavingCommand}
              isAdmin={user?.roles?.some((r) => r.toLowerCase() === "admin")}
              teamMembers={teamMembersForSchedule}
              currentUser={currentUserRecipient}
              onSendTest={
                isScheduledCommandsEnabled ? handleSendTest : undefined
              }
              onToggleFavorite={handleToggleFavorite}
              onRequestFilePreviewUrl={handleRequestFilePreviewUrl}
              onUploadFile={handleUploadFile}
              enableActions={isActionsEnabled}
              onApprove={chatV2.handleApproval}
              onReject={chatV2.handleRejection}
              showTransparency={isSourcesEnabled}
              onTransparencyClick={chatV2.handleTransparencyClick}
              salesforceInstanceUrl={salesforceInstanceUrl}
              enableDeepLinks={isDeepLinksEnabled}
              thinkingProcessVersion="v2"
              useStandardInput={true}
              isAgentLocked={isAgentLocked}
              lockedConversationMode={lockedConversationMode}
              controlledAttachments={chatV2.fileAttachmentState}
              onRemoveAttachment={chatV2.handleRemoveAttachment}
              onFilesSelected={chatV2.handleFilesSelected}
              onFileClick={chatV2.handleFileClick}
              onFileError={(_error: string, message: string) => {
                chatV2.setFileErrorMessage(message);
              }}
              fileErrorMessage={chatV2.fileErrorMessage}
              onDismissFileError={() => chatV2.setFileErrorMessage(null)}
              showArtifacts={isArtifactsEnabled}
              renderArtifactCard={renderArtifactCard}
              onFileArtifactClick={chatV2.handleFileArtifactClick}
              onArtifactDownload={chatV2.handleArtifactDownload}
              onGoogleDriveClick={onGoogleDriveClick}
              isDriveEnabled={isDriveEnabled}
              isDriveConnected={isDriveConnected}
              driveTooltip={driveTooltip}
              driveLoadingFileId={driveLoadingFileId}
              availableAgentModes={availableAgentModes}
              enableFileUpload={isFileUploadEnabled}
              enableMentions={
                availableAgentModes?.includes(
                  ConversationMode.DashboardBuilder,
                ) ?? false
              }
              mentionItems={mentionItems}
              isLoadingMentions={isLoadingMentions}
              onMentionsActivated={handleMentionsActivated}
            />
          </div>

          {/* File Artifact Viewer Panel (self-manages width + resize) */}
          {isArtifactsEnabled &&
            chatV2.fileArtifactPanel.isOpen &&
            chatV2.fileArtifactPanel.fileName && (
              <ArtifactViewerPanel
                fileName={chatV2.fileArtifactPanel.fileName}
                artifactType={
                  chatV2.fileArtifactPanel.artifactType ?? "document"
                }
                mimeType={chatV2.fileArtifactPanel.mimeType}
                downloadUrl={chatV2.fileArtifactPanel.downloadUrl}
                pdfDownloadUrl={chatV2.fileArtifactPanel.pdfDownloadUrl}
                onClose={chatV2.closeFileArtifactPanel}
                onDownload={
                  chatV2.fileArtifactPanel.fileId
                    ? () =>
                        chatV2.handleArtifactDownload(
                          chatV2.fileArtifactPanel.fileId!,
                        )
                    : undefined
                }
                onGoogleDriveClick={
                  onGoogleDriveClick && chatV2.fileArtifactPanel.fileId
                    ? () => onGoogleDriveClick(chatV2.fileArtifactPanel.fileId!)
                    : undefined
                }
                isDriveEnabled={isDriveEnabled}
                isDriveConnected={isDriveConnected}
                driveTooltip={driveTooltip}
                isDriveLoading={
                  driveLoadingFileId === chatV2.fileArtifactPanel.fileId
                }
              />
            )}
        </div>
      )}

      {/* Transparency Drawer */}
      <LazyTransparencyDrawer
        isOpen={chatV2.isTransparencyOpen}
        onClose={chatV2.handleCloseTransparency}
        conversationId={conversationId}
        runId={chatV2.transparencyRunId}
        artifactSummaries={chatV2.transparencyArtifactSummaries}
        isListLoading={chatV2.isTransparencyLoading}
        title="Data Sources"
      />

      {/* Artifact Drawer (V2 style) */}
      <SingleArtifactDrawerContainer
        conversationId={conversationId}
        drawerState={chatV2.artifactState}
        onClose={chatV2.closeArtifact}
      />

      {/* File Preview Modal */}
      {chatV2.filePreviewAttachment && (
        <FilePreviewModal
          attachment={chatV2.filePreviewAttachment}
          downloadUrl={chatV2.filePreviewUrl}
          isLoading={chatV2.isFilePreviewLoading}
          onClose={() => {
            chatV2.setFilePreviewAttachment(null);
            chatV2.setFilePreviewUrl(null);
          }}
        />
      )}
    </Profiler>
  );
}
