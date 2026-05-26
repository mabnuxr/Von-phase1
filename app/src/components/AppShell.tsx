import { useEffect, useState, useMemo, useCallback } from "react";
import { Outlet, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Banner, ShareChatPopup } from "@vonlabs/design-components";

import { useAuthCheck } from "../hooks/useAuthCheck";
import { useUser } from "../hooks/useUser";
import { useSidebarState } from "../hooks/useSidebarState";
import { useNewChat } from "../hooks/useNewChat";
import { useLogout } from "../hooks/useLogout";
import { useTenantMembers } from "../hooks/useTenantMembers";
import { getUserContext } from "../lib/auth";
import { ChatSidebarContainer } from "./ChatSidebarContainer";
import { AppShellContext } from "../contexts/AppShellContext";
import type { AppShellContextValue } from "../contexts/AppShellContext";
import { useGuardedNavigate } from "../providers/NavigationGuard";
import { conversationsService } from "../services";
import { useToast } from "../hooks/useToast";
import { report } from "../lib/analytics/tracker";

/**
 * AppShell — shared layout for pages that need the sidebar shell.
 *
 * Used as a route-level layout component (renders <Outlet />).
 * Owns: auth check, user, feature flags, sidebar, new chat, logout.
 * Child pages access shared state via useAppShell() hook.
 */
export function AppShell() {
  const navigate = useGuardedNavigate();
  const queryClient = useQueryClient();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const currentConversationId = conversationId ?? null;

  const { showToast } = useToast();

  // --- Auth & User ---
  useAuthCheck();
  const { user, isConnectionError, refetch } = useUser();

  // --- Sidebar ---
  const {
    isCollapsed: isSidebarCollapsed,
    toggleCollapse: toggleSidebar,
    collapseSidebar,
  } = useSidebarState();

  // --- New Chat ---
  const { handleNewChatClick: handleNewChatClickBase } = useNewChat();

  const handleNewChatClick = useCallback(() => {
    report.chatNewChatClicked();
    handleNewChatClickBase();
  }, [handleNewChatClickBase]);

  // --- Logout ---
  const { handleLogout: handleLogoutBase } = useLogout();

  const handleLogout = useCallback(async () => {
    report.chatLogoutClicked();
    await handleLogoutBase();
  }, [handleLogoutBase]);

  // --- Navigation Handlers ---
  const handleSettingsClick = useCallback(() => {
    report.chatSettingsClicked();
    navigate("/settings", { state: { fromApp: true } });
  }, [navigate]);

  // --- Share Modal ---
  const [shareConversationId, setShareConversationId] = useState<string | null>(
    null,
  );
  const openShareModal = useCallback((conversationId: string) => {
    setShareConversationId(conversationId);
  }, []);
  const closeShareModal = useCallback(() => {
    const closingId = shareConversationId;
    setShareConversationId(null);
    // Invalidate share-status cache so the header CTA updates
    if (closingId) {
      queryClient.invalidateQueries({ queryKey: ["share-status", closingId] });
    }
  }, [shareConversationId, queryClient]);

  // Prefetch team members as soon as we can — preferring the
  // synchronously-available tenant id from the stored auth context
  // (localStorage, set at token exchange) over the async `useUser`
  // result. The /me call can take 1-2s; without this shortcut the
  // team-members fetch only starts once that completes, which lags
  // every downstream surface (share dialog, version history) by the
  // same amount. Falls back to `user?.tenantId` if local storage was
  // cleared so behaviour stays correct in degraded conditions.
  const bootstrappedTenantId =
    getUserContext()?.tenant_id ?? user?.tenantId ?? undefined;
  const { data: tenantMembersData } = useTenantMembers(bootstrappedTenantId);

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
      collapseSidebar,
      handleLogout,
      handleNewChatClick,
      openShareModal,
    }),
    [user, collapseSidebar, handleLogout, handleNewChatClick, openShareModal],
  );

  return (
    <AppShellContext.Provider value={contextValue}>
      <div className="h-screen bg-gray-50 flex flex-col items-center overflow-hidden">
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
          {/* Two-Pane Layout */}
          <div className="flex flex-1 px-1.5 pb-1.5 pt-1.5 gap-1 overflow-hidden min-h-0">
            {/* Left Pane - Sidebar */}
            <div
              className="chat-sidebar-wrapper h-full flex flex-col min-h-0 transition-all duration-300"
              style={{ width: isSidebarCollapsed ? "50px" : "240px" }}
            >
              <ChatSidebarContainer
                currentConversationId={currentConversationId}
                user={user}
                onNewChatClick={handleNewChatClick}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={toggleSidebar}
                onSettingsClick={handleSettingsClick}
                onLogoutClick={handleLogout}
                onHelpDocsClick={report.chatHelpDocsClicked}
              />
            </div>

            {/* Right Pane - Page Content */}
            <div className="flex flex-1 min-w-0">
              <Outlet />
            </div>
          </div>
        </div>

        {/* Share Chat Modal */}
        {shareConversationId && (
          <ShareChatPopup
            isOpen={!!shareConversationId}
            conversationId={shareConversationId}
            onClose={closeShareModal}
            onGetShareStatus={(id) => conversationsService.getShareStatus(id)}
            onCreateShare={(
              id,
              accessType,
              allowedUserIds,
              allowFileAttachments,
            ) =>
              conversationsService.createShareLink(
                id,
                accessType,
                allowedUserIds,
                allowFileAttachments,
              )
            }
            onUpdateShare={(
              id,
              accessType,
              allowedUserIds,
              allowFileAttachments,
            ) =>
              conversationsService.updateShare(
                id,
                accessType,
                allowedUserIds,
                allowFileAttachments,
              )
            }
            onDeactivateShare={(id) =>
              conversationsService.deactivateShareLink(id)
            }
            onGetTenantMembers={async () => {
              const members = tenantMembersData ?? [];
              return members.map((m) => ({
                id: m.id,
                email: m.email,
                firstName: m.firstName,
                lastName: m.lastName,
              }));
            }}
            onToast={(message) =>
              showToast({ message, variant: "success", autoDismissMs: 4000 })
            }
          />
        )}
      </div>
    </AppShellContext.Provider>
  );
}
