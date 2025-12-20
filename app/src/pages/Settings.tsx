import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TopBar } from "@vonlabs/design-components";
import { useUser } from "../hooks/useUser";
import { useAuthCheck } from "../hooks/useAuthCheck";
import { getUserInitials, getDisplayName } from "../lib/userUtils";
import { AvatarMenu } from "../components/AvatarMenu";
import { SettingsSidebar } from "../components/SettingsSidebar";
import { IntegrationsPanel } from "../components/IntegrationsPanel";
import {
  GitCommitIcon,
  TreeStructureIcon,
  RowsIcon,
  EnvelopeIcon,
  UsersIcon,
  ArrowLeftIcon,
  BrainIcon,
} from "@phosphor-icons/react";
import { startProviderLogout } from "../lib/authFlow";
import { authService } from "../services";
import { FieldsTab } from "../components/tabs/FieldsTab";
import { EmailCategorizationTab } from "../components/tabs/EmailCategorizationTab";
import { ManageUsersTab } from "../components/tabs/ManageUsersTab";
import { OrgContextTab } from "../components/tabs/OrgContextTab";
import { FieldDetailPane } from "../components/FieldDetailPane";
import { AddTeamMemberPane } from "../components/AddTeamMemberPane";
import { usePreferences } from "../hooks/usePreferences";
import usePreferencesStore from "../store/preferencesStore";
import { ProcessConfigurationTab } from "../components/tabs/ProcessConfigurationTab";
import { useFeatureFlag } from "../hooks/useFeatureFlag";

const Settings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  useAuthCheck();
  const { user } = useUser();
  const { isEmailCategorizationEnabled } = useFeatureFlag();

  // Get initial tab from URL query parameter or default to integrations
  const tabFromUrl = searchParams.get("tab");
  const initialTab = tabFromUrl || "integrations";
  const [selectedSettingId, setSelectedSettingId] = useState(initialTab);

  // Set default tab in URL if not present
  useEffect(() => {
    if (!tabFromUrl) {
      navigate(`/settings?tab=integrations`, { replace: true });
    }
  }, [tabFromUrl, navigate]);

  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    setSelectedSettingId(tabId);
    navigate(`/settings?tab=${tabId}`, { replace: true });
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

  // Handle Logout click
  const handleLogoutClick = async () => {
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
      const { clearAllAuth } = await import("../lib/auth");
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
        startProviderLogout();
      }
    } catch (error) {
      // Log error but continue with logout flow
      if (import.meta.env.DEV) {
        console.error("[Settings] Backend logout failed:", error);
      }
      // Still clear local tokens and redirect, even if backend call fails
      startProviderLogout();
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
        icon: <GitCommitIcon size={20} weight="duotone" />,
      },
    ],
    configurations: [
      {
        id: "process",
        label: "Process",
        icon: <TreeStructureIcon size={20} weight="duotone" />,
      },
      {
        id: "fields",
        label: "Fields",
        icon: <RowsIcon size={20} weight="duotone" />,
      },
      {
        id: "org-memory",
        label: "Memory",
        icon: <BrainIcon size={20} weight="duotone" />,
      },
      // Conditionally include Email tab based on feature flag
      ...(isEmailCategorizationEnabled
        ? [
            {
              id: "email",
              label: "Email",
              icon: <EnvelopeIcon size={20} weight="duotone" />,
            },
          ]
        : []),
    ],
    team: [
      {
        id: "team",
        label: "Manage Team",
        icon: <UsersIcon size={20} weight="duotone" />,
      },
    ],
  };

  const renderContent = () => {
    switch (selectedSettingId) {
      case "integrations":
        return <IntegrationsPanel />;
      case "fields":
        return <FieldsTab />;
      case "process":
        return <ProcessConfigurationTab />;
      case "email":
        return <EmailCategorizationTab />;
      case "team":
        return <ManageUsersTab />;
      case "org-memory":
        return <OrgContextTab />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col items-center overflow-hidden">
      {/* Field Detail Pane - Global */}
      <FieldDetailPane />

      {/* Add Team Member Pane - Global */}
      <AddTeamMemberPane />

      {/* Full-width container */}
      <div className="w-full h-full flex flex-col overflow-hidden">
        {/* TopBar with transparent background */}
        <div className="bg-transparent">
          <TopBar
            onLogoClick={() => navigate("/chat")}
            showMenu={false}
            leftElement={
              <button
                onClick={() => navigate("/chat")}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                title="Back to chat"
              >
                <ArrowLeftIcon
                  size={20}
                  weight="regular"
                  className="text-gray-600"
                />
              </button>
            }
            rightElement={<></>}
          />
        </div>

        {/* Avatar Menu Dropdown */}
        <AvatarMenu
          userName={displayName}
          userEmail={user?.email}
          isOpen={isAvatarMenuOpen}
          onClose={() => setIsAvatarMenuOpen(false)}
          onSettingsClick={handleSettingsClick}
          onLogoutClick={handleLogoutClick}
          triggerRect={avatarRect}
        />

        {/* Two-Pane Layout with Rounded Corners */}
        <div className="flex flex-1 px-3 pb-3 gap-2 overflow-hidden min-h-0">
          {/* Left Pane - SettingsSidebar with rounded corners */}
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
            />
          </div>

          {/* Right Pane - Content Area with rounded corners */}
          <div className="flex-1 rounded-lg bg-white shadow-xs border border-gray-200 min-w-0">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
