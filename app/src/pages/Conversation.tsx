/**
 * Conversation - Thin router that determines V1/V2 agent version
 * and renders the appropriate container component.
 *
 * Responsibilities:
 * - Conversation init, lookup, switching
 * - Salesforce connection
 * - Delegates all chat logic to ChatV1Container or ChatV2Container
 *
 * Layout (sidebar, auth, feature flags) is handled by AppShell.
 *
 * Key fix: `key={currentConversationId}` on containers forces clean
 * remount on conversation switch — all hooks cleanup, all refs reset,
 * all timers clear. No stale state, no race conditions.
 */

import { useEffect, useState, useMemo, useCallback, Profiler } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ChatSkeleton, Banner } from "@vonlabs/design-components";
import { ConversationMode } from "@vonlabs/design-components";

import {
  conversationsService,
  IntegrationType,
  AuthenticationStatus,
} from "../services";
import { useIntegrations } from "../hooks/useIntegrations";
import useChatStore from "../store/chatStore";
import { useMessages } from "../hooks/useMessages";
import { useConversationInit } from "../hooks/useConversationInit";
import { useSalesforceConnection } from "../hooks/useSalesforceConnection";
import { useAppShell } from "../hooks/useAppShell";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { useToast } from "../hooks/useToast";
import { conversationKeys } from "../hooks/useConversations";
import { chatSidebarKeys } from "../hooks/useChatSidebar";
import { ChatV1Container } from "../components/ChatV1Container";
import { ChatV2Container } from "../components/ChatV2Container";
import { SalesforceConnectionBanner } from "../components/SalesforceConnectionBanner";
import { SubscriptionInactiveBanner } from "../components/SubscriptionInactiveBanner";
import { useCurrentConversation } from "../hooks/useCurrentConversation";
import { MESSAGES_PAGE_LIMIT } from "../config/constants";
import { reportRenderTiming } from "../lib/datadog";

const Conversation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { conversationId: urlConversationId } = useParams<{
    conversationId?: string;
  }>();

  // When navigating from /chat/new, chatStore already has optimistic messages
  // and the conversation metadata is pre-cached — skip the loading skeleton.
  const isNewlyCreated = !!(location.state as { newlyCreated?: boolean } | null)
    ?.newlyCreated;

  // --- AppShell context (auth, user, sidebar, flags) ---
  const { user, collapseSidebar } = useAppShell();
  const {
    isSlashCommandsEnabled,
    isActionsEnabled,
    isDeepLinksEnabled,
    isSidebarV2,
    isSourcesEnabled,
    isTenantDisabled,
    isFileUploadEnabled,
    isArtifactsEnabled,
    isGoogleDriveEnabled,
    isDeepResearchEnabled,
    isScheduledCommandsEnabled,
  } = useFeatureFlag();

  // --- Conversation ID (URL is the single source of truth) ---
  const currentConversationId = urlConversationId ?? null;

  // --- Chat Store ---
  const { messages } = useChatStore();
  const conversationMessages = useMemo(
    () => (currentConversationId ? messages[currentConversationId] || [] : []),
    [currentConversationId, messages],
  );

  // --- Conversation Init ---
  const { isInitializing, error: initError } =
    useConversationInit(urlConversationId);

  // Fetch current conversation metadata (agentVersion, mode, title)
  const { data: currentConversation } = useCurrentConversation(
    currentConversationId,
  );

  // --- Messages ---
  const {
    fetchNextPage: fetchNextMessagePage,
    hasNextPage: hasNextMessagePage,
    isFetchingNextPage: isFetchingNextMessagePage,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useMessages(currentConversationId, MESSAGES_PAGE_LIMIT);

  // --- Salesforce ---
  const {
    isConnected: isSalesforceConnected,
    isAuthenticated: isSalesforceAuthenticated,
    integration: salesforceIntegration,
  } = useSalesforceConnection();

  const salesforceInstanceUrl =
    isDeepLinksEnabled && salesforceIntegration?.config?.domain
      ? `https://${salesforceIntegration.config.domain}`
      : undefined;

  const isSalesforceReady = isSalesforceConnected && isSalesforceAuthenticated;
  const canSubmit = isSalesforceReady && !isTenantDisabled;

  const { showToast } = useToast();

  const { data: integrationsData } = useIntegrations();
  const isDriveConnected = useMemo(
    () =>
      integrationsData?.integrations.some(
        (i) =>
          i.type === IntegrationType.GOOGLE_DRIVE &&
          i.authenticationStatus === AuthenticationStatus.AUTHENTICATED,
      ) ?? false,
    [integrationsData],
  );

  const isDriveEnabled = isGoogleDriveEnabled;
  const driveTooltip = !isGoogleDriveEnabled
    ? "Open in Drive (Coming Soon)"
    : !isDriveConnected
      ? "Connect Google Drive"
      : "Open in Google Drive";

  const [driveLoadingFileId, setDriveLoadingFileId] = useState<string | null>(
    null,
  );

  // --- Agent Version & Mode ---
  const isAgentV2 = currentConversation?.agentVersion === "v2";

  const lockedConversationMode: ConversationMode = useMemo(() => {
    return currentConversation?.mode || ConversationMode.Auto;
  }, [currentConversation]);

  const isAgentLocked = conversationMessages.length > 0;

  // --- Sync Agent Mode to Backend ---
  const queryClient = useQueryClient();
  const syncConversationModeToBackend = useCallback(
    async (mode: ConversationMode) => {
      if (!currentConversationId) return;

      if (mode !== ConversationMode.Auto) {
        try {
          await conversationsService.updateConversationMode(
            currentConversationId,
            mode,
          );
          queryClient.invalidateQueries({
            queryKey: isSidebarV2
              ? chatSidebarKeys.sidebar()
              : conversationKeys.lists(),
          });

          // Refetch the specific conversation so currentConversation.mode updates
          await queryClient.refetchQueries({
            queryKey: ["conversation", currentConversationId],
          });
          if (import.meta.env.DEV) {
            console.log(
              "[Conversation] Synced conversation mode to backend:",
              mode,
            );
          }
        } catch (error) {
          console.error(
            "[Conversation] Failed to sync conversation mode:",
            error,
          );
        }
      }
    },
    [currentConversationId, queryClient, isSidebarV2],
  );

  // --- UI State ---
  const [shouldShakeBanner, setShouldShakeBanner] = useState(false);
  const [shouldShakeSubscriptionBanner, setShouldShakeSubscriptionBanner] =
    useState(false);

  // --- Loading ---
  const isLoading =
    (!isNewlyCreated && isInitializing) ||
    (!isNewlyCreated && isLoadingMessages && conversationMessages.length === 0);

  // --- Reset message filter on conversation switch ---
  const resetShowMessagesFromIndex = useChatStore(
    (state) => state.resetShowMessagesFromIndex,
  );

  useEffect(() => {
    if (urlConversationId) {
      resetShowMessagesFromIndex(urlConversationId);
    }
  }, [urlConversationId, resetShowMessagesFromIndex]);

  const handleDisabledInteraction = useCallback(() => {
    if (isTenantDisabled) {
      setShouldShakeSubscriptionBanner(true);
    } else {
      setShouldShakeBanner(true);
    }
  }, [isTenantDisabled]);

  // --- Google Drive Export ---
  const handleGoogleDriveClick = useCallback(
    async (fileId: string) => {
      if (!isDriveConnected) {
        navigate("/settings?tab=integrations");
        return;
      }
      if (!currentConversationId) return;
      try {
        setDriveLoadingFileId(fileId);
        const { exportToDrive } = await import("../services/gsuite");
        const result = await exportToDrive(fileId, currentConversationId);
        window.open(result.url, "_blank");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to export to Google Drive";
        showToast({ message, variant: "error" });
      } finally {
        setDriveLoadingFileId(null);
      }
    },
    [currentConversationId, isDriveConnected, navigate, showToast],
  );

  // --- Banner ---
  const chatBanner = isTenantDisabled ? (
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

  // --- Agent modes available in the plus menu ---
  const availableAgentModes = useMemo(() => {
    const modes: ConversationMode[] = [ConversationMode.Auto];
    if (isDeepResearchEnabled) modes.push(ConversationMode.DashboardBuilder);
    return modes;
  }, [isDeepResearchEnabled]);

  // --- Shared container props ---
  const sharedContainerProps = {
    user,
    conversationMessages,
    isLoadingMessages,
    fetchNextMessagePage,
    hasNextMessagePage: !!hasNextMessagePage,
    isFetchingNextMessagePage,
    refetchMessages: refetchMessages as () => Promise<unknown>,
    lockedConversationMode,
    isAgentLocked,
    canSubmit,
    onDisabledInteraction: handleDisabledInteraction,
    salesforceInstanceUrl,
    isSlashCommandsEnabled,
    isActionsEnabled,
    isDeepLinksEnabled,
    isSourcesEnabled,
    isFileUploadEnabled,
    isArtifactsEnabled,
    isScheduledCommandsEnabled,
    availableAgentModes,
    syncConversationModeToBackend,
    banner: chatBanner,
    onCollapseSidebar: collapseSidebar,
    onGoogleDriveClick: handleGoogleDriveClick,
    isDriveEnabled,
    isDriveConnected,
    driveTooltip,
    driveLoadingFileId,
  };

  return (
    <Profiler id="conversation" onRender={reportRenderTiming}>
      {/* Initialization Error Banner */}
      {initError && (
        <Banner
          variant="error"
          message="Failed to load conversations"
          onClose={() => {}}
          dismissible={false}
        />
      )}

      {isLoading ? (
        <ChatSkeleton messageCount={4} />
      ) : currentConversationId && isAgentV2 && currentConversation ? (
        <ChatV2Container
          key={currentConversationId}
          conversationId={currentConversationId}
          currentConversation={currentConversation}
          {...sharedContainerProps}
        />
      ) : currentConversationId ? (
        <ChatV1Container
          key={currentConversationId}
          conversationId={currentConversationId}
          {...sharedContainerProps}
        />
      ) : null}
    </Profiler>
  );
};

export default Conversation;
