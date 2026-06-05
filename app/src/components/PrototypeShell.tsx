/**
 * PrototypeShell — AppShell variant for prototype routes.
 *
 * Identical to AppShell except the sidebar column gets a "PROTOTYPE FLOWS"
 * section injected below ChatSidebarContainer. No existing components are
 * modified.
 *
 * Route layout: /prototype  (and future /prototype/* routes)
 */

import { useState, useMemo, useCallback } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import { FlaskIcon, CaretRightIcon } from "@phosphor-icons/react";

import { useAuthCheck } from "../hooks/useAuthCheck";
import { useUser } from "../hooks/useUser";
import { useSidebarState } from "../hooks/useSidebarState";
import { useNewChat, useNewChatKeyboardShortcut } from "../hooks/useNewChat";
import { useLogout } from "../hooks/useLogout";
import { ChatSidebarContainer } from "./ChatSidebarContainer";
import { AppShellContext } from "../contexts/AppShellContext";
import type { AppShellContextValue } from "../contexts/AppShellContext";
import { useGuardedNavigate } from "../providers/NavigationGuard";
import { SCENARIOS, SCENARIO_GROUPS } from "../components/prototype/scenarios";

// ─── PROTOTYPE FLOWS sidebar section ─────────────────────────────────────────

interface PrototypeFlowsSectionProps {
  activeScenarioId: string | null;
  onSelect: (id: string) => void;
}

function PrototypeFlowsSection({ activeScenarioId, onSelect }: PrototypeFlowsSectionProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border-t border-gray-100 bg-white flex-shrink-0">
      {/* Section header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer group"
      >
        <FlaskIcon size={14} className="text-gray-400 flex-shrink-0" weight="regular" />
        <span className="flex-1 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
          Prototype Flows
        </span>
        <CaretRightIcon
          size={11}
          className={`text-gray-300 flex-shrink-0 transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
        />
      </button>

      {/* Scenario list */}
      {expanded && (
        <div className="pb-2">
          {SCENARIO_GROUPS.map((group) => {
            const groupScenarios = SCENARIOS.filter((s) => s.group === group.id);
            return (
              <div key={group.id} className="mb-1">
                {/* Group label */}
                <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold text-gray-300 uppercase tracking-widest">
                  {group.label}
                </p>
                {/* Scenario rows */}
                {groupScenarios.map((scenario) => {
                  const isActive = scenario.id === activeScenarioId;
                  return (
                    <button
                      key={scenario.id}
                      onClick={() => onSelect(scenario.id)}
                      className={`w-full text-left px-3 py-1.5 text-[13px] rounded-md mx-1 transition-colors cursor-pointer ${
                        isActive
                          ? "bg-gray-100 text-gray-900 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                      }`}
                      style={{ width: "calc(100% - 8px)" }}
                    >
                      {scenario.label}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function PrototypeShell() {
  const navigate = useGuardedNavigate();
  const [searchParams] = useSearchParams();
  const activeScenarioId = searchParams.get("scenario");

  // --- Auth & User ---
  useAuthCheck();
  const { user } = useUser();

  // --- Sidebar ---
  const {
    isCollapsed: isSidebarCollapsed,
    toggleCollapse: toggleSidebar,
    collapseSidebar,
  } = useSidebarState();

  // --- New Chat ---
  const { handleNewChatClick: handleNewChatClickBase } = useNewChat();
  const handleNewChatClick = useCallback(() => {
    handleNewChatClickBase();
  }, [handleNewChatClickBase]);
  useNewChatKeyboardShortcut(handleNewChatClick);

  // --- Logout ---
  const { handleLogout: handleLogoutBase } = useLogout();
  const handleLogout = useCallback(async () => {
    await handleLogoutBase();
  }, [handleLogoutBase]);

  const handleSettingsClick = useCallback(() => {
    navigate("/settings", { state: { fromApp: true } });
  }, [navigate]);


  // --- Context ---
  const contextValue = useMemo<AppShellContextValue>(
    () => ({
      user,
      collapseSidebar,
      handleLogout,
      handleNewChatClick,
      openShareModal: () => {},
    }),
    [user, collapseSidebar, handleLogout, handleNewChatClick],
  );

  const handleScenarioSelect = useCallback(
    (id: string) => {
      navigate(`/prototype?scenario=${id}`);
    },
    [navigate],
  );

  return (
    <AppShellContext.Provider value={contextValue}>
      <div className="h-screen bg-gray-50 flex flex-col items-center overflow-hidden">
        <div className="w-full h-full flex flex-col overflow-hidden">
          <div className="flex flex-1 px-1.5 pb-1.5 pt-1.5 gap-1 overflow-hidden min-h-0">
            {/* Left Pane — sidebar + PROTOTYPE FLOWS */}
            <div
              className="chat-sidebar-wrapper h-full flex flex-col min-h-0 transition-all duration-300"
              style={{ width: isSidebarCollapsed ? "50px" : "240px" }}
            >
              {/* Real Von sidebar — takes remaining height */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <ChatSidebarContainer
                  currentConversationId={null}
                  user={user}
                  onNewChatClick={handleNewChatClick}
                  isCollapsed={isSidebarCollapsed}
                  onToggleCollapse={toggleSidebar}
                  onSettingsClick={handleSettingsClick}
                  onLogoutClick={handleLogout}
                />
              </div>

              {/* PROTOTYPE FLOWS section — only visible when expanded */}
              {!isSidebarCollapsed && (
                <PrototypeFlowsSection
                  activeScenarioId={activeScenarioId}
                  onSelect={handleScenarioSelect}
                />
              )}
            </div>

            {/* Right Pane — page content */}
            <div className="flex flex-1 min-w-0">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </AppShellContext.Provider>
  );
}
