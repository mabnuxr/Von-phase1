import { useState, useRef, useEffect, useCallback, Profiler } from "react";
import { usePostHog } from "@posthog/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import { useAuthCheck } from "../hooks/useAuthCheck";
import { getUserInitials, getDisplayName } from "../lib/userUtils";
import { AvatarMenu } from "../components/AvatarMenu";
import { SettingsSidebar } from "../components/SettingsSidebar";
import { IntegrationsPanel } from "../components/IntegrationsPanel";
import {
  GitCommitIcon,
  RowsIcon,
  EnvelopeIcon,
  UsersIcon,
  BrainIcon,
  ChartBarIcon,
  LightbulbIcon,
} from "@phosphor-icons/react";
import { authService } from "../services";
import { FieldsTab } from "../components/tabs/FieldsTab";
import { EmailCategorizationTab } from "../components/tabs/EmailCategorizationTab";
import { ManageUsersTab } from "../components/tabs/ManageUsersTab";
import { OrgContextTab } from "../components/tabs/OrgContextTab";
import { OrgContextTabV2 } from "../components/tabs/OrgContextTabV2";
import { UsageTab } from "../components/tabs/UsageTab";
import { FieldDetailPane } from "../components/FieldDetailPane";
import { VonAiFieldsTab } from "../components/tabs/VonAiFieldsTab";
import { VonAiFieldDetailPane } from "../components/VonAiFieldDetailPane";
import { AIFieldRunHistory } from "../components/ai-fields/AIFieldRunHistory";
import { AddTeamMembersPane } from "../components/AddTeamMembersPane";
import { EditTeamMemberPane } from "../components/EditTeamMemberPane";
import { usePreferences } from "../hooks/usePreferences";
import usePreferencesStore from "../store/preferencesStore";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { reportRenderTiming } from "../lib/datadog";

const Settings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  useAuthCheck();
  const { user } = useUser();
  const posthog = usePostHog();
  const {
    isEmailCategorizationEnabled,
    isUsageMetricsEnabled,
    isUserMemoryEnabled,
    isVonAiFieldsEnabled,
    isMemoryV2Enabled,
  } = useFeatureFlag();

  const userRole = !user?.roles?.length
    ? null
    : user.roles.some((r) => r.toLowerCase() === "admin")
      ? "Admin"
      : "Member";

  const basePostHogProps = {
    company: user?.tenant ?? null,
    company_id: user?.tenantId ?? null,
    user_id: user?.id ?? null,
    user_email: user?.email ?? null,
    user_role: userRole,
  };

  const isAdmin =
    user?.roles?.some((r) => r.toLowerCase() === "admin") ?? false;
  const showVonAiFields = isVonAiFieldsEnabled && isAdmin;

  // Get initial tab from URL query parameter or default to integrations.
  // Under V2 the legacy `memory` deep-link lands on the Org Memory sub-page
  // (V2 splits the tab into memory-org/memory-user children); under V1 the
  // single `memory` tab is the only one so we leave the URL alone.
  const tabFromUrl = searchParams.get("tab");
  const normalizedTab =
    isMemoryV2Enabled && tabFromUrl === "memory" ? "memory-org" : tabFromUrl;
  const initialTab = normalizedTab || "integrations";
  const [selectedSettingId, setSelectedSettingId] = useState(initialTab);
  const [detailFieldId, setDetailFieldId] = useState<string | null>(
    searchParams.get("fieldId"),
  );

  // Set default tab in URL if not present, and rewrite the legacy "memory" tab
  // when V2 is on.
  useEffect(() => {
    if (!tabFromUrl) {
      navigate(`/settings?tab=integrations`, { replace: true });
    } else if (isMemoryV2Enabled && tabFromUrl === "memory") {
      navigate(`/settings?tab=memory-org`, { replace: true });
    }
  }, [tabFromUrl, navigate, isMemoryV2Enabled]);

  // Sync fieldId from URL (e.g., navigating from chat "View in Settings")
  useEffect(() => {
    const fieldIdFromUrl = searchParams.get("fieldId");
    const tabFromParams = searchParams.get("tab");
    if (fieldIdFromUrl && tabFromParams === "custom-iq") {
      setSelectedSettingId("custom-iq");
      setDetailFieldId(fieldIdFromUrl);
    }
  }, [searchParams]);

  const getTabLabel = (tabId: string) => {
    const allItems = Object.values(settingsItems).flat();
    return allItems.find((item) => item.id === tabId)?.label ?? tabId;
  };

  const pageViewCaptured = useRef(false);
  useEffect(() => {
    if (!user || !posthog || pageViewCaptured.current) return;
    posthog.capture("Settings - Page Viewed", {
      ...basePostHogProps,
      entry_point: "Settings option in chat bottom-left menu",
    });
    pageViewCaptured.current = true;
  }, [user, posthog]);

  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    setSelectedSettingId(tabId);
    setDetailFieldId(null);
    navigate(`/settings?tab=${tabId}`, { replace: true });
    posthog?.capture("Settings - Tab Clicked", {
      ...basePostHogProps,
      tab_name: getTabLabel(tabId),
    });
  };
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [avatarRect, setAvatarRect] = useState<DOMRect | undefined>();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Get current user context for preferences
  const tenantId = user?.tenantId;
  const userId = user?.id;

  // Track if initial data has been loaded
  const hasInitialLoadRef = useRef(false);

  // Fetch preferences with scoped query key
  const { data: preferencesData } = usePreferences(tenantId, userId);
  const { syncFromServer } = usePreferencesStore();

  // Sync server data to Zustand store on load (only once)
  useEffect(() => {
    if (preferencesData && !hasInitialLoadRef.current) {
      syncFromServer(preferencesData);
      hasInitialLoadRef.current = true;
    }
  }, [preferencesData, syncFromServer]);

  // Handle avatar click
  const handleAvatarClick = (rect: DOMRect) => {
    setAvatarRect(rect);
    setIsAvatarMenuOpen(true);
  };

  // Handle Settings click - navigate back to settings (refresh)
  const handleSettingsClick = () => {
    navigate("/settings");
  };

  const handleBackToHome = useCallback(() => {
    posthog?.capture("Settings - Back to Home Clicked", {
      ...basePostHogProps,
      current_tab: getTabLabel(selectedSettingId),
    });
    navigate("/chat");
  }, [posthog, user, selectedSettingId, navigate]);

  const handleHelpDocsClick = useCallback(() => {
    posthog?.capture("Settings - Help Docs Clicked", {
      ...basePostHogProps,
      current_tab: getTabLabel(selectedSettingId),
    });
  }, [posthog, user, selectedSettingId]);

  // Handle Logout click
  const handleLogoutClick = async () => {
    posthog?.capture("Settings - Logout Clicked", {
      ...basePostHogProps,
      current_tab: getTabLabel(selectedSettingId),
    });
    const { clearAllAuth } = await import("../lib/auth");

    if (import.meta.env.DEV) {
      console.log("[Settings] Logout clicked");
    }

    try {
      // Call backend logout to invalidate token and get redirect URL
      const response = await authService.logout();
      if (import.meta.env.DEV) {
        console.log(
          "[Settings] Backend logout successful, redirect URL:",
          response.redirectUrl,
        );
      }

      // Clear all local auth tokens
      clearAllAuth();

      // Redirect to the URL provided by backend
      if (response.redirectUrl) {
        window.location.href = response.redirectUrl;
      } else {
        // Fallback to default logout flow if no redirect URL provided
        if (import.meta.env.DEV) {
          console.warn(
            "[Settings] No redirect URL provided, using default logout flow",
          );
        }
        window.location.href = location.origin;
      }
    } catch (error) {
      // Log error but continue with logout flow
      if (import.meta.env.DEV) {
        console.error("[Settings] Backend logout failed:", error);
      }
      clearAllAuth();
      window.location.href = location.origin;
    }
  };

  // Compute avatar props from user data
  const avatarLabel = user ? getUserInitials(user.name, user.email) : undefined;
  const avatarSrc =
    typeof user?.avatarUrl === "string" ? user.avatarUrl : undefined;
  const displayName = user
    ? getDisplayName(user.name, user.firstName, user.lastName, user.email)
    : undefined;

  const settingsItems = {
    integrations: [
      {
        id: "integrations",
        label: "Integrations",
        icon: <GitCommitIcon size={20} weight="regular" />,
      },
    ],
    configurations: [
      {
        id: "fields",
        label: "Fields",
        icon: <RowsIcon size={20} weight="regular" />,
      },
      // Memory V2 splits into Org/User children; legacy V1 is a single tab.
      isMemoryV2Enabled
        ? {
            id: "memory",
            label: "Memory",
            icon: <BrainIcon size={20} weight="regular" />,
            children: [
              { id: "memory-org", label: "Org Memory" },
              ...(isUserMemoryEnabled
                ? [{ id: "memory-user", label: "User Memory" }]
                : []),
            ],
          }
        : {
            id: "memory",
            label: "Memory",
            icon: <BrainIcon size={20} weight="regular" />,
          },
      ...(showVonAiFields
        ? [
            {
              id: "custom-iq",
              label: "Von AI Fields",
              icon: <LightbulbIcon size={20} weight="regular" />,
            },
          ]
        : []),
      // Conditionally include Email tab based on feature flag
      ...(isEmailCategorizationEnabled
        ? [
            {
              id: "email",
              label: "Email",
              icon: <EnvelopeIcon size={20} weight="regular" />,
            },
          ]
        : []),
    ],
    team: [
      {
        id: "team",
        label: "Manage Team",
        icon: <UsersIcon size={20} weight="regular" />,
      },
    ],
    ...(isUsageMetricsEnabled
      ? {
          usage: [
            {
              id: "usage",
              label: "Usage",
              icon: <ChartBarIcon size={20} weight="regular" />,
            },
          ],
        }
      : {}),
  };

  const renderContent = () => {
    switch (selectedSettingId) {
      case "integrations":
        return <IntegrationsPanel />;
      case "fields":
        return <FieldsTab />;
      case "email":
        return <EmailCategorizationTab />;
      case "team":
        return <ManageUsersTab />;
      case "memory":
        // V1 only — V2 routes through the memory-org/memory-user children.
        return isMemoryV2Enabled ? null : <OrgContextTab />;
      case "memory-org":
        return isMemoryV2Enabled ? <OrgContextTabV2 view="org" /> : null;
      case "memory-user":
        return isMemoryV2Enabled && isUserMemoryEnabled ? (
          <OrgContextTabV2 view="user" />
        ) : null;
      case "custom-iq":
        if (!showVonAiFields) return null;
        if (detailFieldId) {
          return (
            <VonAiFieldDetailPane
              fieldId={detailFieldId}
              onBack={() => setDetailFieldId(null)}
            />
          );
        }
        return <VonAiFieldsTab onRowClick={(id) => setDetailFieldId(id)} />;
      case "usage":
        return isUsageMetricsEnabled ? <UsageTab /> : null;
      default:
        return null;
    }
  };

  return (
    <Profiler id="Settings" onRender={reportRenderTiming}>
      <div className="h-screen bg-gray-100 flex flex-col items-center overflow-hidden">
        {/* Field Detail Pane - Global */}
        <FieldDetailPane />

        {/* Add Team Members Pane - Global (Individual + Bulk import tabs) */}
        <AddTeamMembersPane />
        {/* Von AI Field Run History - Global */}
        {showVonAiFields && <AIFieldRunHistory />}

        {/* Edit Team Member Pane - Global */}
        <EditTeamMemberPane />

        {/* Avatar Menu Dropdown */}
        <AvatarMenu
          userEmail={user?.email}
          isOpen={isAvatarMenuOpen}
          onClose={() => setIsAvatarMenuOpen(false)}
          hideSettings
          onSettingsClick={handleSettingsClick}
          onLogoutClick={handleLogoutClick}
          onHelpDocsClick={handleHelpDocsClick}
          triggerRect={avatarRect}
        />

        {/* Two-Pane Layout */}
        <div className="flex w-full h-full p-3 gap-2 overflow-hidden min-h-0">
          {/* Left Pane - SettingsSidebar */}
          <div
            className="h-full flex flex-col min-h-0 rounded-lg overflow-hidden bg-white shadow-xs border border-gray-200 transition-all duration-300"
            style={{ width: isSidebarCollapsed ? "56px" : "240px" }}
          >
            <SettingsSidebar
              settingsItems={settingsItems}
              selectedSettingId={selectedSettingId}
              onSettingClick={handleTabChange}
              width="100%"
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() =>
                setIsSidebarCollapsed(!isSidebarCollapsed)
              }
              avatarSrc={avatarSrc}
              avatarLabel={avatarLabel}
              userName={displayName}
              userEmail={user?.email}
              onAvatarClick={handleAvatarClick}
              onBackToHome={handleBackToHome}
            />
          </div>

          {/* Right Pane - Content Area */}
          <div className="flex-1 rounded-lg bg-white shadow-xs border border-gray-200 min-w-0">
            {renderContent()}
          </div>
        </div>
      </div>
    </Profiler>
  );
};

export default Settings;
