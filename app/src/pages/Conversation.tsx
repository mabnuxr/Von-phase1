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
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ChatSkeleton, Banner } from "@vonlabs/design-components";
import type { AgentMode } from "@vonlabs/design-components";

import { conversationsService } from "../services";
import useChatStore from "../store/chatStore";
import { useMessages } from "../hooks/useMessages";
import { useConversationInit } from "../hooks/useConversationInit";
import { useSalesforceConnection } from "../hooks/useSalesforceConnection";
import { useAppShell } from "../hooks/useAppShell";
import { conversationKeys } from "../hooks/useConversations";
import { chatSidebarKeys } from "../hooks/useChatSidebar";
import { ChatV1Container } from "../components/ChatV1Container";
import { ChatV2Container } from "../components/ChatV2Container";
import { SalesforceConnectionBanner } from "../components/SalesforceConnectionBanner";
import { SubscriptionInactiveBanner } from "../components/SubscriptionInactiveBanner";
import { useCurrentConversation } from "../hooks/useCurrentConversation";
import {
  agentModeToConversationMode,
  conversationModeToAgentMode,
  DEFAULT_AGENT_MODE,
} from "../lib/conversationModeUtils";
import { MESSAGES_PAGE_LIMIT } from "../config/constants";
import { reportRenderTiming } from "../lib/datadog";

const Conversation = () => {
  const { conversationId: urlConversationId } = useParams<{
    conversationId?: string;
  }>();

  // --- AppShell context (auth, user, sidebar, flags) ---
  const { user, isCreatingChat, collapseSidebar, featureFlags } = useAppShell();
  const {
    isSlashCommandsEnabled,
    isActionsEnabled,
    isDeepLinksEnabled,
    isSidebarV2,
    isSourcesEnabled,
    isTenantDisabled,
    isFileUploadEnabled,
    isArtifactsEnabled,
  } = featureFlags;

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

  // --- Agent Version & Mode ---
  const isAgentV2 = currentConversation?.agentVersion === "v2";

  const lockedAgentMode = useMemo(() => {
    if (currentConversation?.mode) {
      return conversationModeToAgentMode(currentConversation.mode);
    }
    return DEFAULT_AGENT_MODE;
  }, [currentConversation]);

  const isAgentLocked = conversationMessages.length > 0;

  // --- Sync Agent Mode to Backend ---
  const queryClient = useQueryClient();
  const syncAgentModeToBackend = useCallback(
    async (agentMode: AgentMode) => {
      if (!currentConversationId) return;

      if (agentMode !== DEFAULT_AGENT_MODE) {
        try {
          const backendMode = agentModeToConversationMode(agentMode);
          await conversationsService.updateConversationMode(
            currentConversationId,
            backendMode,
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
              "[Conversation] Synced agent mode to backend:",
              backendMode,
            );
          }
        } catch (error) {
          console.error("[Conversation] Failed to sync agent mode:", error);
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
    isCreatingChat ||
    isInitializing ||
    (isLoadingMessages && conversationMessages.length === 0);

  // --- Reset message filter on conversation switch ---
  const resetShowMessagesFromIndex = useChatStore(
    (state) => state.resetShowMessagesFromIndex,
  );

  useEffect(() => {
    if (urlConversationId) {
      resetShowMessagesFromIndex(urlConversationId);
    }
  }, [urlConversationId, resetShowMessagesFromIndex]);

  // --- Handlers ---
  const handleDisabledInteraction = useCallback(() => {
    if (isTenantDisabled) {
      setShouldShakeSubscriptionBanner(true);
    } else {
      setShouldShakeBanner(true);
    }
  }, [isTenantDisabled]);

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
    lockedAgentMode,
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
    syncAgentModeToBackend,
    banner: chatBanner,
    onCollapseSidebar: collapseSidebar,
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
