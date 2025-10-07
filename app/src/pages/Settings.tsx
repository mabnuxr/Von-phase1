import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../lib/auth";
import { TopBar } from "@vonlabs/design-components";
import { useUser } from "../hooks/useUser";
import { getUserInitials, getDisplayName } from "../lib/userUtils";
import { AvatarMenu } from "../components/AvatarMenu";
import { SettingsSidebar } from "../components/SettingsSidebar";
import { IntegrationsPanel } from "../components/IntegrationsPanel";
import { startProviderLogout } from "../lib/authFlow";
import { authService } from "../services";

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [selectedSettingId, setSelectedSettingId] = useState("integrations");
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [avatarRect, setAvatarRect] = useState<DOMRect | undefined>();
  const avatarButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is authenticated
    const token = getAccessToken();
    if (!token) {
      if (import.meta.env.DEV) {
        console.log("[Settings] No token found, redirecting to login");
      }
      navigate("/", { replace: true });
      return;
    }
    if (import.meta.env.DEV) {
      console.log("[Settings] Token found, user authenticated");
    }
  }, [navigate]);

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
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  const handleIntegrationToggle = (id: string, enabled: boolean) => {
    if (import.meta.env.DEV) {
      console.log(`[Settings] Integration ${id} toggled to ${enabled}`);
    }
    // TODO: Implement actual integration toggle logic
  };

  const renderContent = () => {
    switch (selectedSettingId) {
      case "integrations":
        return (
          <IntegrationsPanel onIntegrationToggle={handleIntegrationToggle} />
        );
      case "fields":
      case "defaults":
      case "sales-process":
      case "manager-agent":
        return (
          <div
            style={{
              padding: "24px",
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
            }}
          >
            <h1 style={{ fontSize: "24px", fontWeight: 600, color: "#1d1d1f" }}>
              {
                settingsItems.find((item) => item.id === selectedSettingId)
                  ?.label
              }
            </h1>
            <p style={{ fontSize: "14px", color: "#6e6e73", marginTop: "8px" }}>
              This section is coming soon.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f7",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Max-width container for large screens */}
      <div
        style={{
          width: "100%",
          maxWidth: "1440px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {/* TopBar in White Rounded Container */}
        <div
          style={{
            margin: "16px 16px 8px 16px",
            borderRadius: "12px",
            overflow: "hidden",
            backgroundColor: "#FFFFFF",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          <div ref={avatarButtonRef}>
            <TopBar
              logoSrc="/logo.gif"
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

        {/* Two-Pane Layout with Rounded Corners */}
        <div
          style={{
            display: "flex",
            flex: 1,
            padding: "0 16px 16px 16px",
            gap: "8px",
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          {/* Left Pane - SettingsSidebar with rounded corners */}
          <div
            style={{
              width: "280px",
              borderRadius: "12px",
              overflow: "hidden",
              backgroundColor: "#FFFFFF",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <SettingsSidebar
              settingsItems={settingsItems}
              selectedSettingId={selectedSettingId}
              onSettingClick={(id: string) => setSelectedSettingId(id)}
              width="100%"
            />
          </div>

          {/* Right Pane - Content Area with rounded corners */}
          <div
            style={{
              flex: 1,
              borderRadius: "12px",
              overflow: "hidden",
              backgroundColor: "#FFFFFF",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              minWidth: 0,
            }}
          >
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
