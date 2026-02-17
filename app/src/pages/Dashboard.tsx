/**
 * Dashboard - Thin router that determines V1/V2 agent version
 * and renders the appropriate container component.
 *
 * Responsibilities:
 * - URL routing and auth
 * - Conversation init, lookup, switching
 * - Feature flags, Salesforce connection
 * - Sidebar rendering
 * - Delegates all chat logic to ChatV1Container or ChatV2Container
 *
 * Key fix: `key={currentConversationId}` on containers forces clean
 * remount on conversation switch — all hooks cleanup, all refs reset,
 * all timers clear. No stale state, no race conditions.
 */

import { useEffect, useState, useMemo, useCallback, Profiler } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { TopBar, ChatSkeleton, Banner } from "@vonlabs/design-components";
import type { AgentMode } from "@vonlabs/design-components";

import { authService, conversationsService } from "../services";
import useChatStore from "../store/chatStore";
import { useUser } from "../hooks/useUser";
import { useAuthCheck } from "../hooks/useAuthCheck";
import { useMessages } from "../hooks/useMessages";
import { useConversationInit } from "../hooks/useConversationInit";
import { useSalesforceConnection } from "../hooks/useSalesforceConnection";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { useSidebarState } from "../hooks/useSidebarState";
import { useNewChat } from "../hooks/useNewChat";
import { conversationKeys } from "../hooks/useConversations";
import { chatSidebarKeys } from "../hooks/useChatSidebar";
import { ChatSidebarV1Container } from "../components/ChatSidebarV1Container";
import { ChatSidebarV2Container } from "../components/ChatSidebarV2Container";
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
import { startProviderLogout } from "../lib/authFlow";
import { MESSAGES_PAGE_LIMIT } from "../config/constants";
import { reportRenderTiming } from "../lib/datadog";

const Dashboard = () => {
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams<{
    conversationId?: string;
  }>();
  useAuthCheck();
  const { user, isConnectionError, refetch } = useUser();

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

  // --- Feature Flags ---
  const {
    isSlashCommandsEnabled,
    isActionsEnabled,
    isDeepLinksEnabled,
    isSidebarV2,
    isAgentV2: isAgentV2Flag,
    isSourcesEnabled,
    isTenantDisabled,
    isFileUploadEnabled,
  } = useFeatureFlag();

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

  // --- Sidebar ---
  const { isCollapsed: isSidebarCollapsed, toggleCollapse: toggleSidebar } =
    useSidebarState();
  const { handleNewChatClick, isCreatingChat } = useNewChat({
    currentConversationId,
    isSidebarV2,
    isAgentV2Flag,
  });

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
          if (import.meta.env.DEV) {
            console.log(
              "[Dashboard] Synced agent mode to backend:",
              backendMode,
            );
          }
        } catch (error) {
          console.error("[Dashboard] Failed to sync agent mode:", error);
        }
      }
    },
    [currentConversationId, queryClient],
  );

  // --- UI State ---
  const [showConnectionBanner, setShowConnectionBanner] = useState(false);
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

  // --- Connection Error ---
  useEffect(() => {
    if (isConnectionError) {
      setShowConnectionBanner(true);
    }
  }, [isConnectionError]);

  // --- Handlers ---
  const handleRetry = async () => {
    if (import.meta.env.DEV) {
      console.log("[Dashboard] Retrying connection...");
    }
    await refetch();
  };

  const handleSettingsClick = () => {
    navigate("/settings");
  };

  const handleLogoutClick = async () => {
    if (import.meta.env.DEV) {
      console.log("[Dashboard] Logout clicked");
    }

    try {
      const response = await authService.logout();
      if (import.meta.env.DEV) {
        console.log(
          "[Dashboard] Backend logout successful, redirect URL:",
          response.redirectUrl,
        );
      }

      const { clearAllAuth } = await import("../lib/auth");
      clearAllAuth();

      if (response.redirectUrl) {
        window.location.href = response.redirectUrl;
      } else {
        if (import.meta.env.DEV) {
          console.warn(
            "[Dashboard] No redirect URL provided, using default logout flow",
          );
        }
        startProviderLogout();
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("[Dashboard] Backend logout failed:", error);
      }
      startProviderLogout();
    }
  };

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
    syncAgentModeToBackend,
    banner: chatBanner,
  };

  return (
    <Profiler id="dashboard" onRender={reportRenderTiming}>
      <div className="h-screen bg-gray-100 flex flex-col items-center overflow-hidden">
        {/* Connection Error Banner */}
        {showConnectionBanner && (
          <Banner
            variant="error"
            message="Issue Connecting to Backend Services"
            onClose={() => setShowConnectionBanner(false)}
            action={{ label: "Retry", onClick: handleRetry }}
            dismissible={true}
          />
        )}

        {/* Initialization Error Banner */}
        {initError && (
          <Banner
            variant="error"
            message="Failed to load conversations"
            onClose={() => {}}
            dismissible={false}
          />
        )}

        {/* Full-width container */}
        <div className="w-full h-full flex flex-col overflow-hidden">
          {/* TopBar (V1 sidebar only — V2 has its own header) */}
          {!isSidebarV2 && (
            <div className="bg-transparent">
              <TopBar
                onLogoClick={() => navigate("/chat")}
                showMenu={false}
                onNewChatClick={handleNewChatClick}
              />
            </div>
          )}

          {/* Two-Pane Layout */}
          <div
            className={`flex flex-1 px-3 pb-3 gap-2 overflow-hidden min-h-0 ${isSidebarV2 ? "pt-3" : ""}`}
          >
            {/* Left Pane - Sidebar */}
            <div
              className="chat-sidebar-wrapper h-full flex flex-col min-h-0 rounded-lg overflow-hidden bg-white shadow-xs border border-gray-200 transition-all duration-300"
              style={{ width: isSidebarCollapsed ? "50px" : "240px" }}
            >
              {isSidebarV2 ? (
                <ChatSidebarV2Container
                  currentConversationId={currentConversationId}
                  user={user}
                  onNewChatClick={handleNewChatClick}
                  isCollapsed={isSidebarCollapsed}
                  onToggleCollapse={toggleSidebar}
                  onSettingsClick={handleSettingsClick}
                  onLogoutClick={handleLogoutClick}
                />
              ) : (
                <ChatSidebarV1Container
                  currentConversationId={currentConversationId}
                  user={user}
                  isCollapsed={isSidebarCollapsed}
                  onToggleCollapse={toggleSidebar}
                  onSettingsClick={handleSettingsClick}
                  onLogoutClick={handleLogoutClick}
                />
              )}
            </div>

            {/* Right Pane - Chat Container (keyed by conversationId for clean remount) */}
            <div className="flex flex-1 min-w-0">
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
            </div>
          </div>
        </div>
      </div>
    </Profiler>
  );
};

export default Dashboard;
