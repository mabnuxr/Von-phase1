import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "@vonlabs/design-components";
import { useUser } from "../hooks/useUser";
import { useAuthCheck } from "../hooks/useAuthCheck";
import { getUserInitials, getDisplayName } from "../lib/userUtils";
import { AvatarMenu } from "../components/AvatarMenu";
import { SettingsSidebar } from "../components/SettingsSidebar";
import { IntegrationsPanel } from "../components/IntegrationsPanel";
import {
  DefaultsIcon,
  FieldsIcon,
  IntegrationsIcon,
} from "../components/icons";
import { startProviderLogout } from "../lib/authFlow";
import { authService } from "../services";
import DefaultsPanel from "../components/DefaultsPanel";
import FieldsPanel from "../components/FieldsPanel";
import { FieldDetailPane } from "../components/FieldDetailPane";
import { usePreferences, useUpdatePreferences } from "../hooks/usePreferences";
import usePreferencesStore from "../store/preferencesStore";

const Settings = () => {
  const navigate = useNavigate();
  useAuthCheck();
  const { user } = useUser();
  const [selectedSettingId, setSelectedSettingId] = useState("integrations");
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [avatarRect, setAvatarRect] = useState<DOMRect | undefined>();
  const avatarButtonRef = useRef<HTMLDivElement>(null);

  // Get current user context for preferences
  const tenantId = user?.tenantId;
  const userId = user?.id;

  // Track if initial data has been loaded
  const hasInitialLoadRef = useRef(false);

  // Fetch preferences with scoped query key
  const { data: preferencesData } = usePreferences(tenantId, userId);
  const { queueUpdate } = useUpdatePreferences(tenantId, userId);
  const {
    syncFromServer,
    salesforceFields,
    emailCategorization,
    processConfiguration,
  } = usePreferencesStore();

  // Sync server data to Zustand store on load (only once)
  useEffect(() => {
    if (preferencesData && !hasInitialLoadRef.current) {
      syncFromServer(preferencesData);
      hasInitialLoadRef.current = true;
    }
  }, [preferencesData, syncFromServer]);

  // Auto-save whenever store changes (debounced)
  // Only save after initial load to prevent saving default values
  useEffect(() => {
    // Only queue update after initial data has been loaded from server
    if (hasInitialLoadRef.current) {
      queueUpdate({
        salesforceFields,
        emailCategorization,
        processConfiguration,
      });
    }
  }, [
    salesforceFields,
    emailCategorization,
    processConfiguration,
    queueUpdate,
  ]);

  // Handle avatar click
  const handleAvatarClick = () => {
    if (avatarButtonRef.current) {
      setAvatarRect(avatarButtonRef.current.getBoundingClientRect());
    }
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

  const settingsItems = [
    {
      id: "integrations",
      label: "Integrations",
      icon: <IntegrationsIcon />,
    },
    {
      id: "fields",
      label: "Salesforce Fields",
      icon: <FieldsIcon />,
    },
    {
      id: "defaults",
      label: "Process Configuration",
      icon: <DefaultsIcon />,
    },
  ];

  const renderContent = () => {
    switch (selectedSettingId) {
      case "integrations":
        return <IntegrationsPanel />;
      case "fields":
        return <FieldsPanel />;
      case "defaults":
        return <DefaultsPanel />;
      case "sales-process":
      case "manager-agent":
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-[#f5f5f7] flex flex-col">
      {/* Field Detail Pane - Global */}
      <FieldDetailPane />

      {/* TopBar in White Rounded Container - Full Width */}
      <div className="m-4 mb-2 rounded-xl overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div ref={avatarButtonRef}>
          <TopBar
            logoSrc="/logo.gif"
            logoText="Von"
            onLogoClick={() => navigate("/dashboard")}
            showMenu={false}
            avatarLabel={avatarLabel}
            avatarSrc={avatarSrc}
            onAvatarClick={handleAvatarClick}
          />
        </div>
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

      {/* Full-width content container */}
      <div className="flex flex-1 px-4 pb-4 gap-2 overflow-hidden min-h-0">
        {/* Left Pane - SettingsSidebar with rounded corners */}
        <div className="w-[280px] rounded-xl overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <SettingsSidebar
            settingsItems={settingsItems}
            selectedSettingId={selectedSettingId}
            onSettingClick={(id: string) => setSelectedSettingId(id)}
            width="100%"
          />
        </div>

        {/* Right Pane - Content Area with rounded corners */}
        <div className="flex-1 rounded-xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] min-w-0 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
