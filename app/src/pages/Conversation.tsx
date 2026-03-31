/**
 * Conversation - Thin router that determines V1/V2 agent version
 * and renders the appropriate container component.
 *
 * Responsibilities:
 * - Conversation init, lookup, switching
 * - Salesforce connection
 * - Delegates all chat logic to ChatV1Container or ChatSession
 *
 * Layout (sidebar, auth, feature flags) is handled by AppShell.
 *
 * Key fix: `key={currentConversationId}` on containers forces clean
 * remount on conversation switch — all hooks cleanup, all refs reset,
 * all timers clear. No stale state, no race conditions.
 */

import { useEffect, useState, useMemo, useCallback, Profiler } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ChatSkeleton, Banner } from "@vonlabs/design-components";

import { IntegrationType, AuthenticationStatus } from "../services";
import { useIntegrations } from "../hooks/useIntegrations";
import useChatStore from "../store/chatStore";
import { useMessages } from "../hooks/useMessages";
import { useConversationInit } from "../hooks/useConversationInit";
import { useSalesforceConnection } from "../hooks/useSalesforceConnection";
import { useAppShell } from "../hooks/useAppShell";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { useToast } from "../hooks/useToast";
import { ChatV1Container } from "../components/ChatV1Container";
import { ChatSession } from "../components/chat/ChatSession";
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
    isSourcesEnabled,
    isTenantDisabled,
    isFileUploadEnabled,
    isArtifactsEnabled,
    isGoogleDriveEnabled,
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

  // --- UI State ---
  const [shouldShakeBanner, setShouldShakeBanner] = useState(false);
  const [shouldShakeSubscriptionBanner, setShouldShakeSubscriptionBanner] =
    useState(false);

  // --- Loading ---
  // isNewlyCreated comes from history.state which survives page refresh, but
  // chatStore (in-memory) is wiped on refresh. Guard the optimisation by also
  // requiring that optimistic messages are actually present in chatStore;
  // otherwise fall back to the normal skeleton path.
  const skipSkeleton = isNewlyCreated && conversationMessages.length > 0;
  const isLoading =
    (!skipSkeleton && isInitializing) ||
    (!skipSkeleton && isLoadingMessages && conversationMessages.length === 0);

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

  // --- Shared container props ---
  const sharedContainerProps = {
    user,
    conversationMessages,
    isLoadingMessages,
    fetchNextMessagePage,
    hasNextMessagePage: !!hasNextMessagePage,
    isFetchingNextMessagePage,
    refetchMessages: refetchMessages as () => Promise<unknown>,
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
        <ChatSession
          key={currentConversationId}
          conversationId={currentConversationId}
          currentConversation={currentConversation}
          conversationMessages={conversationMessages}
          isLoadingMessages={isLoadingMessages}
          fetchNextMessagePage={fetchNextMessagePage}
          hasNextMessagePage={!!hasNextMessagePage}
          isFetchingNextMessagePage={isFetchingNextMessagePage}
          refetchMessages={refetchMessages as () => Promise<unknown>}
          banner={chatBanner}
          onDisabledInteraction={handleDisabledInteraction}
          onCollapseSidebar={collapseSidebar}
          salesforceInstanceUrl={salesforceInstanceUrl}
          onGoogleDriveClick={handleGoogleDriveClick}
          isDriveEnabled={isDriveEnabled}
          isDriveConnected={isDriveConnected}
          driveTooltip={driveTooltip}
          driveLoadingFileId={driveLoadingFileId}
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
