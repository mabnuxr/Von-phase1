/**
 * ChatSession
 *
 * Self-contained chat component. Owns all state internally via hooks.
 * Callers pass context config — ChatSession handles the rest.
 *
 * Supports compound pattern for overrides:
 *   <ChatSession ...>
 *     <ChatSession.EmptyState>
 *       <MyCustomEmptyState />
 *     </ChatSession.EmptyState>
 *   </ChatSession>
 */

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Chat,
  ChatSkeleton,
  FilePreviewModal,
  ArtifactViewerPanel,
  usePanelResize,
} from "@vonlabs/design-components";
import type { ConversationMode } from "@vonlabs/design-components";
import type { FileArtifact, MentionItem } from "@vonlabs/design-components";
import { MentionItemType } from "@vonlabs/design-components";

import type {
  Conversation,
  MessageWithStreaming,
} from "../../types/conversation";
import { useBaseChatConfig } from "../../hooks/useBaseChatConfig";
import { useChatMentions } from "../../hooks/useChatMentions";
import { useChatV2 } from "../../hooks/useChatV2";
import { useCreateAndSendMessage } from "../../hooks/useCreateAndSendMessage";
import { useMessages } from "../../hooks/useMessages";
import { useCurrentConversation } from "../../hooks/useCurrentConversation";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";

import { useDashboardPane } from "../../hooks/useDashboardPane";
import { useTeamMembers } from "../../hooks/useTeam";
import { useIntegrations } from "../../hooks/useIntegrations";
import { AuthenticationStatus } from "../../services/integrationsService";
import usePreferencesStore from "../../store/preferencesStore";
import useChatStore from "../../store/chatStore";
import { dashboardKeys } from "../../hooks/useDashboardQuery";
import {
  getFrontendIntegrationId,
  INTEGRATION_METADATA,
} from "../../constants/integrationMetadata";
import { MESSAGES_PAGE_LIMIT } from "../../config/constants";
import { config as appConfig } from "../../config";
import { DashboardPreviewPane } from "../DashboardPreviewPane";
import { SingleArtifactDrawerContainer } from "../SingleArtifactDrawerContainer";
import { LazyTransparencyDrawer } from "../LazyTransparencyDrawer";
import { WriteBlockedBanner } from "../WriteBlockedBanner";
import { GmailDraftCardContainer } from "../GmailDraftCardContainer";

// ─── Split-pane constants ───────────────────────────────────────────

const SPLIT_DEFAULT_RATIOS = [0.3, 0.7];
const SPLIT_CONSTRAINTS = [
  { min: 0.3, max: 0.6 },
  { min: 0.4, max: 0.7 },
];

// ─── Compound component context ─────────────────────────────────────

interface ChatSessionSlots {
  emptyState?: ReactNode;
}

const SlotsContext = createContext<ChatSessionSlots>({});

function EmptyState({ children }: { children: ReactNode }) {
  // Marker component — slots are collected via Children iteration
  return <>{children}</>;
}

function collectSlots(children: ReactNode): ChatSessionSlots {
  const slots: ChatSessionSlots = {};
  const childArray = Array.isArray(children) ? children : [children];
  for (const child of childArray) {
    if (child && typeof child === "object" && "type" in child) {
      if (child.type === EmptyState) {
        slots.emptyState = child.props.children;
      }
    }
  }
  return slots;
}

// ─── Props ──────────────────────────────────────────────────────────

export interface ChatSessionProps {
  /** Conversation ID — omit/null for new conversation (create on first message) */
  conversationId?: string | null;

  /** Compact mode for narrow sidepane layout */
  compact?: boolean;
  title?: string;
  placeholder?: string;

  // ── Existing conversation data (when conversationId is provided) ──
  /** Pre-fetched conversation — pass when the page already has it (e.g. for V1/V2 routing) */
  currentConversation?: Conversation;
  /** Pre-fetched messages — pass when the page already has them */
  conversationMessages?: MessageWithStreaming[];
  isLoadingMessages?: boolean;
  fetchNextMessagePage?: () => void;
  hasNextMessagePage?: boolean;
  isFetchingNextMessagePage?: boolean;
  refetchMessages?: () => Promise<unknown>;

  // ── Dashboard context (analytics sidebar) ───────
  dashboardId?: string;
  dashboardTitle?: string;
  dashboardVersion?: number;

  // ── New conversation callback ───────────────────
  onCreated?: (conversationId: string) => void;

  // ── Page-specific overrides ─────────────────────
  banner?: ReactNode;
  onDisabledInteraction?: () => void;
  onCollapseSidebar?: () => void;
  salesforceInstanceUrl?: string;

  // ── Google Drive ────────────────────────────────
  onGoogleDriveClick?: (fileId: string) => void;
  isDriveEnabled?: boolean;
  isDriveConnected?: boolean;
  driveTooltip?: string;
  driveLoadingFileId?: string | null;

  children?: ReactNode;
}

// ─── Main component ─────────────────────────────────────────────────

function ChatSessionRoot(props: ChatSessionProps) {
  const slots = collectSlots(props.children);

  if (props.conversationId) {
    return (
      <SlotsContext.Provider value={slots}>
        <ExistingChatInner {...props} conversationId={props.conversationId} />
      </SlotsContext.Provider>
    );
  }

  return (
    <SlotsContext.Provider value={slots}>
      <NewChatInner {...props} />
    </SlotsContext.Provider>
  );
}

// ─── Existing conversation inner ────────────────────────────────────

function ExistingChatInner(
  props: ChatSessionProps & { conversationId: string },
) {
  const { conversationId } = props;
  const base = useBaseChatConfig();
  const slots = useContext(SlotsContext);
  const navigate = useNavigate();

  // ── Conversation & messages ───────────────────────────────────────
  // Use page-provided data if available, otherwise fetch at the leaf
  const { data: fetchedConversation } = useCurrentConversation(
    props.currentConversation ? null : conversationId,
  );
  const currentConversation = props.currentConversation ?? fetchedConversation;

  const storeMessages = useChatStore((s) => s.messages);
  const fallbackMessages = useMemo(
    () => storeMessages[conversationId] || [],
    [conversationId, storeMessages],
  );
  const conversationMessages = props.conversationMessages ?? fallbackMessages;

  const selfFetchMessages = !props.fetchNextMessagePage;
  const msgQuery = useMessages(
    selfFetchMessages ? conversationId : null,
    MESSAGES_PAGE_LIMIT,
  );
  const fetchNextMessagePage =
    props.fetchNextMessagePage ?? msgQuery.fetchNextPage;
  const hasNextMessagePage = props.hasNextMessagePage ?? !!msgQuery.hasNextPage;
  const isFetchingNextMessagePage =
    props.isFetchingNextMessagePage ?? msgQuery.isFetchingNextPage;
  const isLoadingMessages = props.isLoadingMessages ?? msgQuery.isLoading;
  const refetchMessages = (props.refetchMessages ??
    msgQuery.refetch) as () => Promise<unknown>;

  const loadMoreRef = useInfiniteScroll({
    onLoadMore: fetchNextMessagePage,
    hasMore: hasNextMessagePage,
    isLoading: isFetchingNextMessagePage,
  });

  // ── Dashboard @ mention (replaces orange referenceContext tag) ─────
  const hasDashboard = !!(props.dashboardId && props.dashboardTitle);
  const dashboardMention = useMemo(
    () =>
      hasDashboard
        ? {
            id: props.dashboardId!,
            name: props.dashboardTitle!,
            type: MentionItemType.Dashboard,
            version: props.dashboardVersion ?? 0,
          }
        : null,
    [
      hasDashboard,
      props.dashboardId,
      props.dashboardTitle,
      props.dashboardVersion,
    ],
  );

  // ── Chat engine ───────────────────────────────────────────────────
  // Dashboard references are now driven solely by @ mentions (selectedMentions)
  // so the user controls which dashboards are sent as context.
  const chatV2 = useChatV2({
    conversationId,
    user: base.user,
    currentConversation: currentConversation ?? {
      conversationId,
      userId: base.user?.id ?? "",
      tenantId: base.user?.tenantId ?? "",
      title: props.title ?? props.dashboardTitle ?? "",
      agentVersion: "v2" as const,
      mode: "auto" as ConversationMode,
      createdAt: new Date().toISOString(),
      createdBy: null,
      updatedAt: null,
    },
    conversationMessages,
    refetchMessages,
    canSubmit: base.canSubmit,
    onDisabledInteraction: props.onDisabledInteraction ?? (() => {}),
    salesforceInstanceUrl: props.salesforceInstanceUrl,
    isSlashCommandsEnabled: base.features.isSlashCommandsEnabled,
    isActionsEnabled: base.features.isActionsEnabled,
    isDeepLinksEnabled: base.features.isDeepLinksEnabled,
    isSourcesEnabled: base.features.isSourcesEnabled,
    isFileUploadEnabled: base.features.isFileUploadEnabled,
    onCollapseSidebar: props.onCollapseSidebar ?? (() => {}),
  });

  // ── Dashboard version invalidation (sidebar context) ──────────────
  const queryClient = useQueryClient();
  useEffect(() => {
    if (
      props.dashboardId &&
      chatV2.dashboard &&
      chatV2.dashboard.dashboard_version !== props.dashboardVersion
    ) {
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(props.dashboardId),
      });
    }
  }, [
    chatV2.dashboard,
    props.dashboardId,
    props.dashboardVersion,
    queryClient,
  ]);

  // ── Integration metadata ──────────────────────────────────────────
  const { data: integrationsData } = useIntegrations();
  const connectedIntegrationTypes = useMemo(() => {
    const connected = new Set<string>();
    if (integrationsData?.integrations) {
      for (const integration of integrationsData.integrations) {
        if (
          integration.accessLevel === "user" &&
          integration.authenticationStatus ===
            AuthenticationStatus.AUTHENTICATED
        ) {
          connected.add(integration.type.toLowerCase());
        }
      }
    }
    return connected;
  }, [integrationsData]);

  const setConfiguringPersonalIntegration = usePreferencesStore(
    (s) => s.setConfiguringPersonalIntegration,
  );
  const handleIntegrate = useCallback(
    (integrationType: string) => {
      const frontendId = getFrontendIntegrationId(integrationType);
      setConfiguringPersonalIntegration(frontendId);
      navigate("/settings?tab=integrations");
    },
    [setConfiguringPersonalIntegration, navigate],
  );
  const handleGetIntegrationMetadata = useCallback(
    (integrationType: string) => {
      const frontendId = getFrontendIntegrationId(integrationType);
      const metadata = INTEGRATION_METADATA[frontendId];
      if (!metadata) return null;
      return {
        name: metadata.name,
        logoPath: metadata.logoPath,
        description: metadata.description,
      };
    },
    [],
  );

  // ── Mentions ──────────────────────────────────────────────────────
  const {
    enableMentions,
    mentionItems,
    isLoadingMentions,
    onMentionsActivated,
  } = useChatMentions();

  // ── Scheduled commands ────────────────────────────────────────────
  const { data: teamMembersData } = useTeamMembers(
    base.features.isScheduledCommandsEnabled ? base.user?.tenantId : undefined,
  );
  const teamMembersForSchedule = base.features.isScheduledCommandsEnabled
    ? (teamMembersData ?? []).map((m) => ({
        id: m.id,
        email: m.email,
        firstName: m.firstName,
        lastName: m.lastName,
      }))
    : undefined;
  const currentUserRecipient =
    base.features.isScheduledCommandsEnabled && base.user
      ? {
          id: base.user.id,
          email: base.user.email,
          firstName: base.user.firstName ?? base.user.name?.split(" ")[0] ?? "",
          lastName:
            base.user.lastName ??
            base.user.name?.split(" ").slice(1).join(" ") ??
            "",
        }
      : undefined;

  // ── Artifact card renderer ────────────────────────────────────────
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

  // ── Dashboard preview pane ────────────────────────────────────────
  const { dashboardPaneState, openDashboardPane, closeDashboardPane } =
    useDashboardPane();

  // Invalidate preview pane dashboard when agent updates it (version changes)
  const prevDashboardVersionRef = useRef<number | null>(null);
  useEffect(() => {
    if (
      chatV2.dashboard &&
      dashboardPaneState.isOpen &&
      dashboardPaneState.dashboardId === chatV2.dashboard.dashboard_id &&
      prevDashboardVersionRef.current !== null &&
      chatV2.dashboard.dashboard_version !== prevDashboardVersionRef.current
    ) {
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(chatV2.dashboard.dashboard_id),
      });
    }
    if (chatV2.dashboard) {
      prevDashboardVersionRef.current = chatV2.dashboard.dashboard_version;
    }
  }, [
    chatV2.dashboard,
    dashboardPaneState.isOpen,
    dashboardPaneState.dashboardId,
    queryClient,
  ]);

  const isCompact = !!props.compact || dashboardPaneState.isOpen;
  const {
    containerRef: splitContainerRef,
    ratios: splitRatios,
    getHandleProps: getSplitHandleProps,
  } = usePanelResize({
    defaultRatios: SPLIT_DEFAULT_RATIOS,
    constraints: SPLIT_CONSTRAINTS,
  });

  const { onCollapseSidebar } = props;
  const handleDashboardPreview = useCallback(
    (dashboardId: string) => {
      if (props.compact) {
        navigate(`/dashboard/${dashboardId}?conversationId=${conversationId}`);
        return;
      }
      openDashboardPane(dashboardId);
      onCollapseSidebar?.();
    },
    [
      props.compact,
      navigate,
      conversationId,
      openDashboardPane,
      onCollapseSidebar,
    ],
  );

  const handleMentionClick = useCallback(
    (mention: MentionItem) => {
      navigate(`/dashboard/${mention.id}?conversationId=${conversationId}`);
    },
    [navigate, conversationId],
  );

  const prevLiveDashboardKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (props.compact) return;
    const key = chatV2.liveDashboardKey;
    if (key && key !== prevLiveDashboardKeyRef.current) {
      prevLiveDashboardKeyRef.current = key;
      handleDashboardPreview(key.split(":")[0]);
    }
  }, [props.compact, chatV2.liveDashboardKey, handleDashboardPreview]);

  // ── Banner with write-blocked ─────────────────────────────────────
  const fullBanner = useMemo(
    () =>
      props.banner || chatV2.writeBlocked ? (
        <>
          {props.banner}
          {chatV2.writeBlocked && (
            <WriteBlockedBanner
              writeBlocked={chatV2.writeBlocked}
              onDismiss={chatV2.dismissWriteBlocked}
            />
          )}
        </>
      ) : undefined,
    [props.banner, chatV2.writeBlocked, chatV2.dismissWriteBlocked],
  );

  // ── Loading ───────────────────────────────────────────────────────
  if (!base.user || (isLoadingMessages && conversationMessages.length === 0)) {
    return <ChatSkeleton messageCount={4} />;
  }

  // ── Chat ───────────────────────────────────────────────────────────
  const chatElement = (
    <Chat
      title={props.title ?? props.dashboardTitle ?? "von AI"}
      userId={base.user?.id}
      userName={base.user?.firstName || base.user?.name?.split(" ")[0]}
      userEmail={base.user?.email}
      apiBaseUrl={appConfig.apiBaseUrl}
      conversationId={conversationId}
      messages={chatV2.transformedMessages}
      onSendMessage={chatV2.handleSendMessage}
      onStopStreaming={chatV2.handleStopStreaming}
      inputValue={chatV2.autoPopulatedInput}
      onInputValueChange={chatV2.setAutoPopulatedInput}
      isLoading={false}
      compact={isCompact}
      height="100%"
      width="100%"
      showMessagesFromIndex={chatV2.showMessagesFromIndex}
      thinkingProcessVersion="v2"
      useStandardInput
      placeholder={props.placeholder ?? "Reply.."}
      disableSubmit={!chatV2.canSubmitFinal}
      // Banner
      banner={fullBanner}
      examplePromptsDisabled={!chatV2.canSubmitFinal}
      onExamplePromptDisabledClick={props.onDisabledInteraction}
      onInputWhileDisabled={props.onDisabledInteraction}
      // File upload
      enableFileUpload={base.features.isFileUploadEnabled}
      controlledAttachments={chatV2.fileAttachmentState}
      onFilesSelected={chatV2.handleFilesSelected}
      onRemoveAttachment={chatV2.handleRemoveAttachment}
      onFileClick={chatV2.handleFileClick}
      onFileError={(_error: string, message: string) =>
        chatV2.setFileErrorMessage(message)
      }
      fileErrorMessage={chatV2.fileErrorMessage}
      onDismissFileError={() => chatV2.setFileErrorMessage(null)}
      // Commands
      enableCommands={base.features.isSlashCommandsEnabled}
      commands={base.commands.commands}
      isLoadingCommands={base.commands.isLoadingCommands}
      onSaveCommand={base.commands.handleSaveCommand}
      onDeleteCommand={base.commands.handleDeleteCommand}
      isSavingCommand={base.commands.isSavingCommand}
      onToggleFavorite={base.commands.handleToggleFavorite}
      onRequestFilePreviewUrl={base.commands.handleRequestFilePreviewUrl}
      onUploadFile={base.commands.handleUploadFile}
      isAdmin={base.user?.roles?.some((r) => r.toLowerCase() === "admin")}
      teamMembers={teamMembersForSchedule}
      currentUser={currentUserRecipient}
      onSendTest={
        base.features.isScheduledCommandsEnabled
          ? base.commands.handleSendTest
          : undefined
      }
      // Data tables (deep research approval flow)
      dataTablesInfo={chatV2.dataTablesInfo ?? undefined}
      isDataTablesLoading={chatV2.isDataTablesLoading}
      onDataTablesClick={chatV2.handleDataTablesClick}
      // Transparency
      showTransparency={base.features.isSourcesEnabled}
      onTransparencyClick={chatV2.handleTransparencyClick}
      // Actions
      enableActions={base.features.isActionsEnabled}
      onApprove={chatV2.handleApproval}
      onReject={chatV2.handleRejection}
      onApprovePlan={chatV2.handlePlanApproval}
      onRejectPlan={chatV2.handlePlanRejection}
      onDashboardPreview={props.compact ? undefined : handleDashboardPreview}
      onMentionClick={handleMentionClick}
      // Artifacts
      onArtifactClick={chatV2.handleArtifactClick}
      showArtifacts={base.features.isArtifactsEnabled}
      renderArtifactCard={renderArtifactCard}
      onFileArtifactClick={chatV2.handleFileArtifactClick}
      onArtifactDownload={chatV2.handleArtifactDownload}
      // Integrations
      isIntegrationConnected={(type) => connectedIntegrationTypes.has(type)}
      onIntegrate={handleIntegrate}
      getIntegrationMetadata={handleGetIntegrationMetadata}
      // Salesforce / deep links
      salesforceInstanceUrl={props.salesforceInstanceUrl}
      enableDeepLinks={base.features.isDeepLinksEnabled}
      // Mentions
      enableMentions={enableMentions}
      mentionItems={mentionItems}
      isLoadingMentions={isLoadingMentions}
      onMentionsActivated={onMentionsActivated}
      dashboardMention={dashboardMention}
      // Google Drive
      onGoogleDriveClick={props.onGoogleDriveClick}
      isDriveEnabled={props.isDriveEnabled}
      isDriveConnected={props.isDriveConnected}
      driveTooltip={props.driveTooltip}
      driveLoadingFileId={props.driveLoadingFileId}
      // Infinite scroll
      loadMoreRef={loadMoreRef}
      isFetchingMore={isFetchingNextMessagePage}
    >
      {slots.emptyState && (
        <Chat.EmptyState>{slots.emptyState}</Chat.EmptyState>
      )}
    </Chat>
  );

  return (
    <>
      <div ref={splitContainerRef} className="flex h-full w-full gap-1">
        <div
          className="flex-1 min-w-0"
          style={
            dashboardPaneState.isOpen
              ? {
                  flex: `0 0 calc(${splitRatios[0] * 100}% - ${6 * splitRatios[0]}px)`,
                }
              : undefined
          }
        >
          {chatElement}
        </div>
        {dashboardPaneState.isOpen && dashboardPaneState.dashboardId && (
          <>
            <div
              {...getSplitHandleProps(0)}
              className="flex-shrink-0 w-1.5 cursor-ew-resize group flex items-center justify-center hover:bg-blue-100 active:bg-blue-200 rounded transition-colors"
            >
              <div className="w-0.5 h-8 rounded-full bg-gray-300 group-hover:bg-blue-400 group-active:bg-blue-500 transition-colors" />
            </div>
            <div
              className="h-full min-w-0"
              style={{
                flex: `0 0 calc(${splitRatios[1] * 100}% - ${6 * splitRatios[1]}px)`,
              }}
            >
              <DashboardPreviewPane
                dashboardId={dashboardPaneState.dashboardId}
                conversationId={conversationId}
                onClose={closeDashboardPane}
              />
            </div>
          </>
        )}
        {!props.compact &&
          base.features.isArtifactsEnabled &&
          chatV2.fileArtifactPanel.isOpen &&
          chatV2.fileArtifactPanel.fileName && (
            <ArtifactViewerPanel
              fileName={chatV2.fileArtifactPanel.fileName}
              artifactType={chatV2.fileArtifactPanel.artifactType ?? "document"}
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
                props.onGoogleDriveClick && chatV2.fileArtifactPanel.fileId
                  ? () =>
                      props.onGoogleDriveClick!(
                        chatV2.fileArtifactPanel.fileId!,
                      )
                  : undefined
              }
              isDriveEnabled={props.isDriveEnabled}
              isDriveConnected={props.isDriveConnected}
              driveTooltip={props.driveTooltip}
              isDriveLoading={
                props.driveLoadingFileId === chatV2.fileArtifactPanel.fileId
              }
            />
          )}
      </div>
      <Overlays conversationId={conversationId} chatV2={chatV2} />
    </>
  );
}

// ─── New conversation inner ─────────────────────────────────────────

function NewChatInner(props: ChatSessionProps) {
  const base = useBaseChatConfig();
  const slots = useContext(SlotsContext);

  // ── Mentions ──────────────────────────────────────────────────────
  const {
    enableMentions,
    mentionItems,
    isLoadingMentions,
    onMentionsActivated,
  } = useChatMentions();

  // ── Dashboard @ mention ────────────────────────────────────────────
  const hasDashboard = !!(props.dashboardId && props.dashboardTitle);
  const dashboardMention = useMemo(
    () =>
      hasDashboard
        ? {
            id: props.dashboardId!,
            name: props.dashboardTitle!,
            type: MentionItemType.Dashboard,
            version: props.dashboardVersion ?? 0,
          }
        : null,
    [
      hasDashboard,
      props.dashboardId,
      props.dashboardTitle,
      props.dashboardVersion,
    ],
  );

  // Dashboard references are now driven solely by @ mentions (selectedMentions)
  const createFlow = useCreateAndSendMessage({
    agentVersion: "v2",
    isAgentV2: true,
    title: props.dashboardTitle ?? props.title ?? "",
    onCreated: props.onCreated,
  });

  return (
    <Chat
      title={props.title ?? props.dashboardTitle ?? "von AI"}
      userId={base.user?.id}
      userName={base.user?.firstName || base.user?.name?.split(" ")[0]}
      userEmail={base.user?.email}
      apiBaseUrl={appConfig.apiBaseUrl}
      conversationId=""
      messages={createFlow.transformedMessages}
      onSendMessage={createFlow.handleSendMessage}
      isLoading={false}
      compact={props.compact}
      height="100%"
      width="100%"
      thinkingProcessVersion="v2"
      useStandardInput
      placeholder={props.placeholder ?? "Ask questions or make changes..."}
      disableSubmit={!base.canSubmit || createFlow.isCreating}
      // File upload
      enableFileUpload={base.features.isFileUploadEnabled}
      controlledAttachments={createFlow.fileAttachments}
      onFilesSelected={createFlow.addFiles}
      onRemoveAttachment={createFlow.removeFile}
      fileErrorMessage={createFlow.fileErrorMessage}
      onDismissFileError={createFlow.dismissFileError}
      // Commands
      enableCommands={base.features.isSlashCommandsEnabled}
      commands={base.commands.commands}
      isLoadingCommands={base.commands.isLoadingCommands}
      onSaveCommand={base.commands.handleSaveCommand}
      onDeleteCommand={base.commands.handleDeleteCommand}
      isSavingCommand={base.commands.isSavingCommand}
      onToggleFavorite={base.commands.handleToggleFavorite}
      onRequestFilePreviewUrl={base.commands.handleRequestFilePreviewUrl}
      onUploadFile={base.commands.handleUploadFile}
      isAdmin={base.user?.roles?.some((r) => r.toLowerCase() === "admin")}
      // Mentions
      enableMentions={enableMentions}
      mentionItems={mentionItems}
      isLoadingMentions={isLoadingMentions}
      onMentionsActivated={onMentionsActivated}
      dashboardMention={dashboardMention}
    >
      {slots.emptyState && (
        <Chat.EmptyState>{slots.emptyState}</Chat.EmptyState>
      )}
    </Chat>
  );
}

// ─── Shared overlays (modals/drawers — render via portals) ──────────

type ChatV2Return = ReturnType<typeof useChatV2>;

function Overlays({
  conversationId,
  chatV2,
}: {
  conversationId: string;
  chatV2: ChatV2Return;
}) {
  return (
    <>
      <LazyTransparencyDrawer
        isOpen={chatV2.isTransparencyOpen}
        onClose={chatV2.handleCloseTransparency}
        conversationId={conversationId}
        runId={chatV2.transparencyRunId}
        artifactSummaries={chatV2.transparencyArtifactSummaries}
        isListLoading={chatV2.isTransparencyLoading}
        title="Data Sources"
      />
      <SingleArtifactDrawerContainer
        conversationId={conversationId}
        drawerState={chatV2.artifactState}
        onClose={chatV2.closeArtifact}
      />
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
    </>
  );
}

// ─── Compound component ─────────────────────────────────────────────

export const ChatSession = Object.assign(ChatSessionRoot, {
  EmptyState,
});
