import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar, ChatSidebar, Chat, Banner } from "@vonlabs/design-components";
import { useUser } from "../hooks/useUser";
import { useAuthCheck } from "../hooks/useAuthCheck";
import { getUserInitials, getDisplayName } from "../lib/userUtils";
import { AvatarMenu } from "../components/AvatarMenu";
import { startProviderLogout } from "../lib/authFlow";
import { authService } from "../services";

const Dashboard = () => {
  const navigate = useNavigate();
  useAuthCheck(); // Check authentication and redirect if not authenticated
  const { user, isConnectionError, refetch } = useUser();
  const [selectedChatId, setSelectedChatId] = useState("1");
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [avatarRect, setAvatarRect] = useState<DOMRect | undefined>();
  const [showConnectionBanner, setShowConnectionBanner] = useState(false);
  const avatarButtonRef = useRef<HTMLDivElement>(null);

  // Generate conversation ID with format: vonlabs-chat-{tenant_id}-{user_id}-{uuid}
  const conversationId = useMemo(() => {
    if (!user?.tenantId || !user?.id) return null;
    return `vonlabs-chat-${user.tenantId}-${user.id}-${crypto.randomUUID()}`;
  }, [user?.tenantId, user?.id]);

  // Show/hide connection banner based on connection error state
  useEffect(() => {
    if (isConnectionError) {
      setShowConnectionBanner(true);
    }
  }, [isConnectionError]);

  // Handle retry connection
  const handleRetry = async () => {
    if (import.meta.env.DEV) {
      console.log("[Dashboard] Retrying connection...");
    }
    await refetch();
  };

  // Handle avatar click
  const handleAvatarClick = () => {
    if (avatarButtonRef.current) {
      setAvatarRect(avatarButtonRef.current.getBoundingClientRect());
    }
    setIsAvatarMenuOpen(true);
  };

  // Handle Settings click
  const handleSettingsClick = () => {
    navigate("/settings");
  };

  // Handle Logout click
  const handleLogoutClick = async () => {
    if (import.meta.env.DEV) {
      console.log("[Dashboard] Logout clicked");
    }

    try {
      // Call backend logout to invalidate token and get redirect URL
      const response = await authService.logout();
      if (import.meta.env.DEV) {
        console.log(
          "[Dashboard] Backend logout successful, redirect URL:",
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
            "[Dashboard] No redirect URL provided, using default logout flow",
          );
        }
        startProviderLogout();
      }
    } catch (error) {
      // Log error but continue with logout flow
      if (import.meta.env.DEV) {
        console.error("[Dashboard] Backend logout failed:", error);
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

  const chatItems = [
    { id: "1", label: "Team Review", timestamp: "Yesterday" },
    { id: "2", label: "Forecast Q3", timestamp: "2 hours ago" },
    { id: "3", label: "Sales Performance Analysis", timestamp: "Last week" },
    { id: "4", label: "Revenue Projections", timestamp: "3 days ago" },
    { id: "5", label: "Market Analysis", timestamp: "Last month" },
  ];

  // Handle chat errors
  const handleChatError = (error: Error) => {
    if (import.meta.env.DEV) {
      console.error("[Dashboard] Chat error:", error);
    }
    // You can show an error banner or notification here
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
          {/* Left Pane - ChatSidebar with rounded corners */}
          <div
            style={{
              width: "280px",
              borderRadius: "12px",
              overflow: "hidden",
              backgroundColor: "#FFFFFF",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <ChatSidebar
              chatItems={chatItems}
              selectedChatId={selectedChatId}
              onChatClick={(id: string) => setSelectedChatId(id)}
              onNewChatClick={() => {
                console.log("New chat created");
              }}
              onSearchChange={(value: string) =>
                console.log("Search chats:", value)
              }
              searchPlaceholder="Search conversations..."
              width="100%"
            />
          </div>

          {/* Right Pane - Chat with rounded corners */}
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
            <Chat
              title="von AI"
              userId={user?.id}
              apiBaseUrl={import.meta.env.VITE_API_BASE_URL}
              pusherConfig={{
                key: import.meta.env.VITE_PUSHER_KEY || "",
                cluster: import.meta.env.VITE_PUSHER_CLUSTER || "",
                authEndpoint: import.meta.env.VITE_PUSHER_AUTH_ENDPOINT,
              }}
              conversationId={conversationId || undefined}
              enableRealtime={
                !!conversationId &&
                !!import.meta.env.VITE_PUSHER_KEY &&
                !!import.meta.env.VITE_PUSHER_CLUSTER
              }
              placeholder="Ask von anything"
              onError={handleChatError}
              variant="floating"
              height="100%"
              width="100%"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
