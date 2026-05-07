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
  forwardRef,
  useContext,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useSearchParams } from "react-router-dom";
import { useGuardedNavigate } from "../../providers/NavigationGuard";
import {
  Chat,
  ChatSkeleton,
  FilePreviewModal,
  ArtifactViewerPanel,
  usePanelResize,
} from "@vonlabs/design-components";
import type { ConversationMode } from "@vonlabs/design-components";
import type {
  ChatRef,
  FileArtifact,
  MentionItem,
} from "@vonlabs/design-components";
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

import useChatStore from "../../store/chatStore";
import { useConversationWidgetMentions } from "../../hooks/useConversationWidgetMentions";
import { useDashboardVersionInvalidation } from "../../hooks/useDashboardVersionInvalidation";
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
import {
  GmailDraftCardContainer,
  EmailComposerContainer,
} from "../GmailDraftCardContainer";
import { AIFieldArtifactCard } from "../ai-fields/AIFieldArtifactCard";
import { AIFieldSidePanel } from "../ai-fields/AIFieldSidePanel";
import useAiFieldsStore from "../../store/vonAiFieldsStore";
import { useAiField } from "../../hooks/useVonAiFields";

// ─── Split-pane constants ───────────────────────────────────────────

const SPLIT_DEFAULT_RATIOS = [0.3, 0.7];
const SPLIT_CONSTRAINTS = [
  { min: 0.3, max: 0.6 },
  { min: 0.4, max: 0.7 },
];

const AI_FIELD_SPLIT_RATIOS = [0.4, 0.6];
const AI_FIELD_SPLIT_CONSTRAINTS = [
  { min: 0.25, max: 0.6 },
  { min: 0.4, max: 0.75 },
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

/**
 * Imperative handle for `ChatSession`. Forwards `focus()` to the underlying
 * `Chat` input. Used by parents that need to programmatically move focus
 * into the chat (e.g. after `Add to Chat` routes a widget mention).
 */
export interface ChatSessionRef {
  focus: () => void;
}

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

  /**
   * Widget chips to show in the input before a conversation exists (new-chat path).
   * Rendered as chips in NewChatInner; flushed into the message payload on first send.
   * Ignored in ExistingChatInner — that path reads from the widget mentions store.
   */
  pendingWidgetMentions?: MentionItem[];
  onPendingWidgetMentionRemoved?: (args: { id: string }) => void;

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

  // ── Box ────────────────────────────────────────
  onBoxClick?: (fileId: string) => void;
  isBoxEnabled?: boolean;
  isBoxConnected?: boolean;
  boxTooltip?: string;
  boxLoadingFileId?: string | null;

  /**
   * Read-only mode for shared-chat recipients.
   * Hides the input bar and disables actions that would mutate the
   * conversation (approvals, scheduling, commands, file uploads).
   * Viewing behaviour — opening files, artifacts, transparency, dashboards —
   * stays enabled so the recipient can inspect the full session.
   */
  readOnly?: boolean;

  /**
   * When true, file attachment chips and command data source chips are
   * visible but grayed out and non-clickable. Set when the share owner
   * disabled file attachments.
   */
  disableFileAttachments?: boolean;

  /** Action element rendered in the chat pane header area (e.g. Share button) — scoped to chat only, won't cover artifact/dashboard panels. Receives `compact` when a side panel is open. */
  headerAction?: ReactNode | ((compact: boolean) => ReactNode);

  children?: ReactNode;
}

// ─── Main component ─────────────────────────────────────────────────

const ChatSessionRoot = forwardRef<ChatSessionRef, ChatSessionProps>(
  function ChatSessionRoot(props, ref) {
    const slots = collectSlots(props.children);
    const chatRef = useRef<ChatRef | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          chatRef.current?.focus();
        },
      }),
      [],
    );

    if (props.conversationId) {
      return (
        <SlotsContext.Provider value={slots}>
          <ExistingChatInner
            {...props}
            conversationId={props.conversationId}
            chatRef={chatRef}
          />
        </SlotsContext.Provider>
      );
    }

    return (
      <SlotsContext.Provider value={slots}>
        <NewChatInner {...props} chatRef={chatRef} />
      </SlotsContext.Provider>
    );
  },
);

// ─── Existing conversation inner ────────────────────────────────────

function ExistingChatInner(
  props: ChatSessionProps & {
    conversationId: string;
    chatRef: RefObject<ChatRef | null>;
  },
) {
  const { conversationId, chatRef } = props;
  const base = useBaseChatConfig();
  const slots = useContext(SlotsContext);
  const navigate = useGuardedNavigate();

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

  // ── Admin check ───────────────────────────────────────────────────
  const handleIntegrate = useCallback((integrationType: string) => {
    const frontendId = getFrontendIntegrationId(integrationType);
    const params = new URLSearchParams({
      tab: "integrations",
      configure: frontendId,
    });
    window.open(`/settings?${params.toString()}`, "_blank");
  }, []);
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

  // ── AI Field state ──
  const { chatPanelFieldId, closeChatPanel } = useAiFieldsStore();

  // ── Artifact card renderers ──────────────────────────────────────
  // Single email fallback (used when renderGroupedEmailArtifacts is not available)
  const renderArtifactCard = useCallback(
    (artifact: FileArtifact) => {
      // AI Field artifact — injected by useChatV2 from AI_FIELD_READY event
      if (artifact.artifactType === "ai_field") {
        return (
          <AIFieldArtifactCard
            fieldId={artifact.fileId}
            name={artifact.fileName}
          />
        );
      }
      // Email draft artifact
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

  // Group all email_draft artifacts into a single EmailComposer with tabs
  const renderGroupedEmailArtifacts = useCallback(
    (artifacts: FileArtifact[]) => {
      if (artifacts.length === 0) return null;
      return (
        <EmailComposerContainer
          conversationId={conversationId}
          artifacts={artifacts}
        />
      );
    },
    [conversationId],
  );

  // ── Dashboard preview pane ────────────────────────────────────────
  const { dashboardPaneState, openDashboardPane, closeDashboardPane } =
    useDashboardPane();

  // Invalidate dashboard cache when agent updates it (version changes).
  // activeDashboardId covers both contexts:
  //   - Chat page with preview pane open → dashboardPaneState.dashboardId
  //   - Dashboard page with chat sidebar → props.dashboardId
  const activeDashboardId = dashboardPaneState.isOpen
    ? dashboardPaneState.dashboardId
    : props.dashboardId;
  useDashboardVersionInvalidation({
    dashboards: chatV2.dashboards,
    activeDashboardId,
  });

  // ── Dashboard @ mention (replaces orange referenceContext tag) ─────
  // Scenario 1: dashboard sidebar — props carry the dashboard info directly.
  // Scenario 2: preview pane — look up the dashboard from mentionItems.
  const hasDashboard = !!(props.dashboardId && props.dashboardTitle);
  const dashboardMention = useMemo(() => {
    if (hasDashboard) {
      return {
        id: props.dashboardId!,
        name: props.dashboardTitle!,
        type: MentionItemType.Dashboard,
        version: props.dashboardVersion ?? 0,
      };
    }
    if (dashboardPaneState.isOpen && dashboardPaneState.dashboardId) {
      const match = mentionItems.find(
        (item) => item.id === dashboardPaneState.dashboardId,
      );
      if (match) return match;
    }
    return null;
  }, [
    hasDashboard,
    props.dashboardId,
    props.dashboardTitle,
    props.dashboardVersion,
    dashboardPaneState.isOpen,
    dashboardPaneState.dashboardId,
    mentionItems,
  ]);

  // AI field reference from URL param only (from "Edit in chat")
  const [searchParamsExisting, setSearchParamsExisting] = useSearchParams();
  const aiFieldIdFromUrlExisting = searchParamsExisting.get("aiFieldId");
  const { data: aiFieldForMention } = useAiField(aiFieldIdFromUrlExisting);
  const [capturedAiFieldMention, setCapturedAiFieldMention] =
    useState<MentionItem | null>(null);

  // Capture the mention into state then clean the URL param
  useEffect(() => {
    if (aiFieldForMention && aiFieldIdFromUrlExisting) {
      setCapturedAiFieldMention({
        id: aiFieldForMention.fieldId,
        name: aiFieldForMention.displayName ?? aiFieldForMention.name,
        type: MentionItemType.AiField,
        version: 0,
        aiFieldContext: { aiFieldId: aiFieldForMention.fieldId },
      });
      setSearchParamsExisting(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("aiFieldId");
          return next;
        },
        { replace: true },
      );
    }
  }, [aiFieldForMention, aiFieldIdFromUrlExisting, setSearchParamsExisting]);

  const aiFieldMention = capturedAiFieldMention;

  const isCompact = !!props.compact || dashboardPaneState.isOpen;
  const {
    containerRef: splitContainerRef,
    ratios: splitRatios,
    getHandleProps: getSplitHandleProps,
  } = usePanelResize({
    defaultRatios: SPLIT_DEFAULT_RATIOS,
    constraints: SPLIT_CONSTRAINTS,
  });

  const {
    containerRef: aiFieldContainerRef,
    ratios: aiFieldRatios,
    getHandleProps: getAiFieldHandleProps,
  } = usePanelResize({
    defaultRatios: AI_FIELD_SPLIT_RATIOS,
    constraints: AI_FIELD_SPLIT_CONSTRAINTS,
  });

  const { onCollapseSidebar } = props;
  const handleDashboardPreview = useCallback(
    (dashboardId: string) => {
      if (activeDashboardId && dashboardId === activeDashboardId) return;

      if (props.compact) {
        navigate(`/dashboard/${dashboardId}?conversationId=${conversationId}`);
        return;
      }
      openDashboardPane(dashboardId);
      onCollapseSidebar?.();
    },
    [
      activeDashboardId,
      props.compact,
      navigate,
      conversationId,
      openDashboardPane,
      onCollapseSidebar,
    ],
  );

  const handleMentionClick = useCallback(
    (mention: MentionItem) => {
      if (
        mention.type === MentionItemType.AiField ||
        mention.aiFieldContext?.aiFieldId
      ) {
        navigate(
          `/settings?tab=custom-iq&fieldId=${mention.aiFieldContext?.aiFieldId ?? mention.id}`,
        );
        return;
      }
      navigate(`/dashboard/${mention.id}?conversationId=${conversationId}`);
    },
    [conversationId, navigate],
  );

  const {
    widgetMentions,
    onWidgetMentionRemoved: handleWidgetMentionRemoved,
    wrappedHandleSendMessage: handleSendMessage,
  } = useConversationWidgetMentions(conversationId, chatV2.handleSendMessage);

  const combinedWidgetMentions = useMemo(
    () =>
      aiFieldMention ? [...widgetMentions, aiFieldMention] : widgetMentions,
    [widgetMentions, aiFieldMention],
  );

  const handleCombinedWidgetMentionRemoved = useCallback(
    (args: { id: string }) => {
      if (aiFieldMention && args.id === aiFieldMention.id) {
        setCapturedAiFieldMention(null);
        return;
      }
      handleWidgetMentionRemoved(args);
    },
    [aiFieldMention, handleWidgetMentionRemoved],
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

  // ── Banner: write-blocked ─────────────────────────────────────────
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

  // ── Storage service tracking (syncs card ↔ panel selection) ────────
  const [lastUsedServiceId, setLastUsedServiceId] = useState<string | null>(
    null,
  );

  const wrappedDriveClick = useMemo(() => {
    if (!props.onGoogleDriveClick) return undefined;
    return (fileId: string) => {
      setLastUsedServiceId("drive");
      props.onGoogleDriveClick!(fileId);
    };
  }, [props.onGoogleDriveClick]);

  const wrappedBoxClick = useMemo(() => {
    if (!props.onBoxClick) return undefined;
    return (fileId: string) => {
      setLastUsedServiceId("box");
      props.onBoxClick!(fileId);
    };
  }, [props.onBoxClick]);

  // ── Loading ───────────────────────────────────────────────────────
  if (!base.user || (isLoadingMessages && conversationMessages.length === 0)) {
    return <ChatSkeleton messageCount={4} />;
  }

  // ── Chat ───────────────────────────────────────────────────────────
  const chatElement = (
    <Chat
      ref={chatRef}
      title={props.title ?? props.dashboardTitle ?? "von AI"}
      userId={base.user?.id}
      userName={base.user?.firstName || base.user?.name?.split(" ")[0]}
      userEmail={base.user?.email}
      apiBaseUrl={appConfig.apiBaseUrl}
      conversationId={conversationId}
      messages={chatV2.transformedMessages}
      onSendMessage={handleSendMessage}
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
      hideInput={props.readOnly}
      hideScrollToBottom={props.readOnly}
      disableFileAttachments={props.disableFileAttachments}
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
      availableDashboards={base.commands.availableDashboards}
      teamMembers={teamMembersForSchedule}
      currentUser={currentUserRecipient}
      onSendTest={
        base.features.isScheduledCommandsEnabled
          ? base.commands.handleSendTest
          : undefined
      }
      // Transparency
      showTransparency={base.features.isSourcesEnabled}
      onTransparencyClick={chatV2.handleTransparencyClick}
      // Actions
      enableActions={base.features.isActionsEnabled}
      onApprove={chatV2.handleApproval}
      onReject={chatV2.handleRejection}
      onExpire={chatV2.handleExpire}
      onApprovePlan={chatV2.handlePlanApproval}
      onRejectPlan={chatV2.handlePlanRejection}
      onDashboardPreview={handleDashboardPreview}
      onMentionClick={handleMentionClick}
      // Artifacts
      onArtifactClick={chatV2.handleArtifactClick}
      showArtifacts={base.features.isArtifactsEnabled}
      renderArtifactCard={renderArtifactCard}
      renderGroupedEmailArtifacts={renderGroupedEmailArtifacts}
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
      widgetMentions={combinedWidgetMentions}
      onWidgetMentionRemoved={handleCombinedWidgetMentionRemoved}
      // Google Drive
      onGoogleDriveClick={wrappedDriveClick}
      isDriveEnabled={props.isDriveEnabled}
      isDriveConnected={props.isDriveConnected}
      driveTooltip={props.driveTooltip}
      driveLoadingFileId={props.driveLoadingFileId}
      // Box
      onBoxClick={wrappedBoxClick}
      isBoxEnabled={props.isBoxEnabled}
      isBoxConnected={props.isBoxConnected}
      boxTooltip={props.boxTooltip}
      boxLoadingFileId={props.boxLoadingFileId}
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
      <div
        ref={(el) => {
          // Both resize hooks need the container ref
          (
            splitContainerRef as React.MutableRefObject<HTMLDivElement | null>
          ).current = el;
          (
            aiFieldContainerRef as React.MutableRefObject<HTMLDivElement | null>
          ).current = el;
        }}
        className="flex h-full w-full gap-1"
      >
        <div
          className="relative flex-1 min-w-0"
          style={
            dashboardPaneState.isOpen
              ? {
                  flex: `0 0 calc(${splitRatios[0] * 100}% - ${6 * splitRatios[0]}px)`,
                }
              : chatPanelFieldId
                ? {
                    flex: `0 0 calc(${aiFieldRatios[0] * 100}% - ${6 * aiFieldRatios[0]}px)`,
                  }
                : undefined
          }
        >
          {typeof props.headerAction === "function"
            ? props.headerAction(isCompact || chatV2.fileArtifactPanel.isOpen)
            : props.headerAction}
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
                wrappedDriveClick && chatV2.fileArtifactPanel.fileId
                  ? () => wrappedDriveClick(chatV2.fileArtifactPanel.fileId!)
                  : undefined
              }
              isDriveEnabled={props.isDriveEnabled}
              isDriveConnected={props.isDriveConnected}
              driveTooltip={props.driveTooltip}
              isDriveLoading={
                props.driveLoadingFileId === chatV2.fileArtifactPanel.fileId
              }
              onBoxClick={
                wrappedBoxClick && chatV2.fileArtifactPanel.fileId
                  ? () => wrappedBoxClick(chatV2.fileArtifactPanel.fileId!)
                  : undefined
              }
              isBoxEnabled={props.isBoxEnabled}
              isBoxConnected={props.isBoxConnected}
              boxTooltip={props.boxTooltip}
              isBoxLoading={
                props.boxLoadingFileId === chatV2.fileArtifactPanel.fileId
              }
              activeServiceId={lastUsedServiceId}
            />
          )}
        {chatPanelFieldId && !dashboardPaneState.isOpen && (
          <>
            <div
              {...getAiFieldHandleProps(0)}
              className="flex-shrink-0 w-1.5 cursor-ew-resize group flex items-center justify-center hover:bg-blue-100 active:bg-blue-200 rounded transition-colors"
            >
              <div className="w-0.5 h-8 rounded-full bg-gray-300 group-hover:bg-blue-400 group-active:bg-blue-500 transition-colors" />
            </div>
            <div
              className="h-full min-w-0"
              style={{
                flex: `0 0 calc(${aiFieldRatios[1] * 100}% - ${6 * aiFieldRatios[1]}px)`,
              }}
            >
              <AIFieldSidePanel
                fieldId={chatPanelFieldId}
                onClose={closeChatPanel}
                onNavigateToSettings={(realFieldId) => {
                  closeChatPanel();
                  navigate(`/settings?tab=custom-iq&fieldId=${realFieldId}`);
                }}
              />
            </div>
          </>
        )}
      </div>
      <Overlays conversationId={conversationId} chatV2={chatV2} />
    </>
  );
}

// ─── New conversation inner ─────────────────────────────────────────

function NewChatInner(
  props: ChatSessionProps & { chatRef: RefObject<ChatRef | null> },
) {
  const base = useBaseChatConfig();
  const slots = useContext(SlotsContext);
  const { chatRef } = props;

  // ── Mentions ──────────────────────────────────────────────────────
  const {
    enableMentions,
    mentionItems,
    isLoadingMentions,
    onMentionsActivated,
  } = useChatMentions();

  // ── AI Field from URL (new chat about a field) ─────────────────────
  const [searchParams] = useSearchParams();
  const aiFieldIdFromUrl = searchParams.get("aiFieldId");
  const { data: aiFieldForNewChat } = useAiField(aiFieldIdFromUrl);
  const newChatAiFieldMention = useMemo(() => {
    if (!aiFieldForNewChat) return null;
    return {
      id: aiFieldForNewChat.fieldId,
      name: aiFieldForNewChat.displayName ?? aiFieldForNewChat.name,
      type: MentionItemType.AiField,
      version: 0,
      aiFieldContext: { aiFieldId: aiFieldForNewChat.fieldId },
    };
  }, [aiFieldForNewChat]);

  const newChatWidgetMentions = useMemo(
    () =>
      newChatAiFieldMention
        ? [...(props.pendingWidgetMentions ?? []), newChatAiFieldMention]
        : props.pendingWidgetMentions,
    [props.pendingWidgetMentions, newChatAiFieldMention],
  );

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
      ref={chatRef}
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
      availableDashboards={base.commands.availableDashboards}
      // Mentions
      enableMentions={enableMentions}
      mentionItems={mentionItems}
      isLoadingMentions={isLoadingMentions}
      onMentionsActivated={onMentionsActivated}
      dashboardMention={dashboardMention}
      widgetMentions={newChatWidgetMentions}
      onWidgetMentionRemoved={props.onPendingWidgetMentionRemoved}
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
