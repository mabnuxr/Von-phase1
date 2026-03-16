import { useEffect, useState, useMemo, useCallback } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { TopBar, Banner } from "@vonlabs/design-components";

import { useAuthCheck } from "../hooks/useAuthCheck";
import { useUser } from "../hooks/useUser";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { useSidebarState } from "../hooks/useSidebarState";
import { useNewChat } from "../hooks/useNewChat";
import { useLogout } from "../hooks/useLogout";
import { ChatSidebarV1Container } from "./ChatSidebarV1Container";
import { ChatSidebarV2Container } from "./ChatSidebarV2Container";
import { AppShellContext } from "../contexts/AppShellContext";
import type { AppShellContextValue } from "../contexts/AppShellContext";

/**
 * AppShell — shared layout for pages that need the sidebar shell.
 *
 * Used as a route-level layout component (renders <Outlet />).
 * Owns: auth check, user, feature flags, sidebar, new chat, logout.
 * Child pages access shared state via useAppShell() hook.
 */
export function AppShell() {
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams<{
    conversationId?: string;
  }>();

  // --- Auth & User ---
  useAuthCheck();
  const { user, isConnectionError, refetch } = useUser();

  // --- Feature Flags ---
  const featureFlags = useFeatureFlag();
  const { isSidebarV2, isAgentV2: isAgentV2Flag } = featureFlags;

  // --- Sidebar ---
  const {
    isCollapsed: isSidebarCollapsed,
    toggleCollapse: toggleSidebar,
    collapseSidebar,
  } = useSidebarState();

  // --- New Chat ---
  const currentConversationId = urlConversationId ?? null;
  const { handleNewChatClick, isCreatingChat } = useNewChat({
    currentConversationId,
    isSidebarV2,
    isAgentV2Flag,
  });

  // --- Logout ---
  const { handleLogout } = useLogout();

  // --- Navigation Handlers ---
  const handleSettingsClick = useCallback(() => {
    navigate("/settings");
  }, [navigate]);

  // --- Connection Error Banner ---
  const [showConnectionBanner, setShowConnectionBanner] = useState(false);

  useEffect(() => {
    if (isConnectionError) {
      setShowConnectionBanner(true);
    }
  }, [isConnectionError]);

  const handleRetry = useCallback(async () => {
    if (import.meta.env.DEV) {
      console.log("[AppShell] Retrying connection...");
    }
    await refetch();
  }, [refetch]);

  // --- Context Value ---
  const contextValue = useMemo<AppShellContextValue>(
    () => ({
      user,
      isCreatingChat,
      collapseSidebar,
      handleLogout,
      handleNewChatClick,
    }),
    [user, isCreatingChat, collapseSidebar, handleLogout, handleNewChatClick],
  );

  return (
    <AppShellContext.Provider value={contextValue}>
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
            className={`flex flex-1 px-1.5 pb-1.5 gap-1 overflow-hidden min-h-0 ${isSidebarV2 ? "pt-1.5" : ""}`}
          >
            {/* Left Pane - Sidebar */}
            <div
              className={`chat-sidebar-wrapper h-full flex flex-col min-h-0 transition-all duration-300 ${
                isSidebarV2
                  ? ""
                  : "rounded-lg overflow-hidden bg-white shadow-xs border border-gray-200"
              }`}
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
                  onLogoutClick={handleLogout}
                />
              ) : (
                <ChatSidebarV1Container
                  currentConversationId={currentConversationId}
                  user={user}
                  isCollapsed={isSidebarCollapsed}
                  onToggleCollapse={toggleSidebar}
                  onSettingsClick={handleSettingsClick}
                  onLogoutClick={handleLogout}
                />
              )}
            </div>

            {/* Right Pane - Page Content */}
            <div className="flex flex-1 min-w-0">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </AppShellContext.Provider>
  );
}
