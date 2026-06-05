/**
 * Shared chrome for standalone settings pages (People, Teams, Permissions, etc.)
 * that live outside the main /settings tab switcher but need the same sidebar.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GitCommitIcon,
  BrainIcon,
  UsersIcon,
  LockSimpleIcon,
  UsersFourIcon,
} from "@phosphor-icons/react";
import { SettingsSidebar } from "./SettingsSidebar";
import { AvatarMenu } from "./AvatarMenu";
import { useUser } from "../hooks/useUser";
import { getUserInitials, getDisplayName } from "../lib/userUtils";

interface SettingsLayoutProps {
  /** Which nav item is currently active */
  activeId: string;
  children: React.ReactNode;
}

export function SettingsLayout({ activeId, children }: SettingsLayoutProps) {
  const navigate = useNavigate();
  const { user } = useUser();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [avatarRect, setAvatarRect] = useState<DOMRect | undefined>();

  const avatarLabel = user ? getUserInitials(user.name, user.email) : undefined;
  const avatarSrc =
    typeof user?.avatarUrl === "string" ? user.avatarUrl : undefined;
  const displayName = user
    ? getDisplayName(user.name, user.firstName, user.lastName, user.email)
    : undefined;

  const settingsItems = {
    integrations: [],
    configurations: [
      {
        id: "integrations",
        label: "Integrations",
        icon: <GitCommitIcon size={20} weight="regular" />,
      },
      {
        id: "memory",
        label: "Memory",
        icon: <BrainIcon size={20} weight="regular" />,
        children: [
          { id: "memory-org", label: "Org Memory" },
          { id: "memory-team", label: "Team Memory" },
          { id: "memory-user", label: "User Memory" },
        ],
      },
    ],
    team: [
      {
        id: "people",
        label: "People",
        icon: <UsersIcon size={20} weight="regular" />,
      },
      {
        id: "teams",
        label: "Teams",
        icon: <UsersFourIcon size={20} weight="regular" />,
      },
      {
        id: "permissions",
        label: "Permissions",
        icon: <LockSimpleIcon size={20} weight="regular" />,
      },
    ],
  };

  const handleNavClick = (id: string) => {
    switch (id) {
      case "integrations":
        navigate("/settings?tab=integrations");
        break;
      case "memory-org":
        navigate("/settings?tab=memory-org");
        break;
      case "memory-user":
        navigate("/settings?tab=memory-user");
        break;
      case "memory-team":
        navigate("/settings/memory/team");
        break;
      case "memory":
        navigate("/settings?tab=memory-org");
        break;
      case "people":
        navigate("/settings/people");
        break;
      case "teams":
        navigate("/settings/teams");
        break;
      case "permissions":
        navigate("/settings/permissions");
        break;
      default:
        navigate("/settings");
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col items-center overflow-hidden">
      <AvatarMenu
        userEmail={user?.email}
        isOpen={isAvatarMenuOpen}
        onClose={() => setIsAvatarMenuOpen(false)}
        hideSettings
        onSettingsClick={() => navigate("/settings")}
        onLogoutClick={() => {}}
        onHelpDocsClick={() => {}}
        triggerRect={avatarRect}
      />

      <div className="flex w-full h-full p-3 gap-2 overflow-hidden min-h-0">
        {/* Sidebar */}
        <div
          className="h-full flex flex-col min-h-0 rounded-lg overflow-hidden bg-white shadow-xs border border-gray-200 transition-all duration-300"
          style={{ width: isSidebarCollapsed ? "56px" : "240px" }}
        >
          <SettingsSidebar
            settingsItems={settingsItems}
            selectedSettingId={activeId}
            onSettingClick={handleNavClick}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((c) => !c)}
            width="240px"
            avatarLabel={avatarLabel}
            avatarSrc={avatarSrc}
            userName={displayName}
            userEmail={user?.email}
            onAvatarClick={(rect) => {
              setAvatarRect(rect);
              setIsAvatarMenuOpen(true);
            }}
            onBackToHome={() => navigate("/chat/new")}
          />
        </div>

        {/* Page content */}
        <div className="flex-1 h-full min-w-0 rounded-lg bg-white border border-gray-200 shadow-xs overflow-hidden flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
