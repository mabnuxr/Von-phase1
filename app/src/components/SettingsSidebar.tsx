import React from "react";
import {
  SidebarSimpleIcon,
  ArrowLeftIcon,
  CaretUpDownIcon,
} from "@phosphor-icons/react";

const VON_COMBINATION_MARK_URL =
  "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/von_combination_mark.svg";

export interface SettingsItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SettingsGroupItem {
  integrations: SettingsItem[];
  configurations: SettingsItem[];
  team: SettingsItem[];
  usage?: SettingsItem[];
}

export interface SettingsSidebarProps {
  settingsItems?: SettingsGroupItem;
  selectedSettingId?: string;
  onSettingClick?: (id: string) => void;
  width?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  avatarSrc?: string;
  avatarLabel?: string;
  userName?: string;
  userEmail?: string;
  onAvatarClick?: (rect: DOMRect) => void;
  onBackToHome?: () => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  settingsItems = {},
  selectedSettingId,
  onSettingClick,
  width = "280px",
  isCollapsed = false,
  onToggleCollapse,
  avatarSrc,
  avatarLabel,
  userName,
  userEmail,
  onAvatarClick,
  onBackToHome,
}) => {
  // Get all items flattened for collapsed view
  const allItems = [
    ...(settingsItems?.integrations || []),
    ...(settingsItems?.configurations || []),
    ...(settingsItems?.team || []),
    ...(settingsItems?.usage || []),
  ];

  // Reusable menu item renderer
  const renderMenuItem = (item: SettingsItem) => {
    const isSelected = item.id === selectedSettingId;

    return (
      <button
        key={item.id}
        className={`
          flex items-center gap-2.5 px-2 h-8 mb-0.5
          text-sm rounded-xl cursor-pointer
          w-full text-left transition-colors duration-150
          ${
            isSelected
              ? "shadow-xs bg-gray-50 border border-gray-200 text-gray-900 font-medium"
              : "border border-transparent text-gray-900 hover:bg-gray-50 hover:border-gray-200 hover:shadow-xs"
          }
        `}
        onClick={() => onSettingClick?.(item.id)}
      >
        {item.icon && (
          <span
            className={`flex-shrink-0 ${isSelected ? "text-gray-900" : "text-gray-600"}`}
          >
            {item.icon}
          </span>
        )}
        <span>{item.label}</span>
      </button>
    );
  };

  // Collapsed state
  if (isCollapsed) {
    return (
      <div className="px-2 py-3 h-full w-full bg-white flex text-sm flex-col overflow-hidden antialiased">
        {/* Collapse toggle */}
        <div className="flex flex-col items-start pb-2 border-b border-gray-100 mb-2">
          <button
            onClick={onToggleCollapse}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            title="Expand sidebar"
          >
            <SidebarSimpleIcon
              size={16}
              weight="regular"
              className="text-gray-800"
            />
          </button>
        </div>

        {/* Back to Home - collapsed */}
        {onBackToHome && (
          <div className="mb-2">
            <button
              onClick={onBackToHome}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent hover:bg-gray-50 hover:border-gray-200 hover:shadow-xs transition-colors cursor-pointer"
              title="Back to Home"
            >
              <ArrowLeftIcon
                size={18}
                weight="regular"
                className="text-gray-600"
              />
            </button>
          </div>
        )}

        {/* Collapsed Menu Items - Icons only */}
        <div className="flex-1 overflow-y-auto settings-scrollbar">
          <div className="flex flex-col items-start gap-1">
            {allItems.map((item: SettingsItem) => {
              const isSelected = item.id === selectedSettingId;

              return (
                <button
                  key={item.id}
                  className={`
                    flex items-center justify-center w-8 h-8
                    rounded-lg cursor-pointer
                    transition-colors duration-150
                    ${
                      isSelected
                        ? "bg-gray-50 border border-gray-200 shadow-xs text-gray-900"
                        : "border border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-200 hover:shadow-xs hover:text-gray-900"
                    }
                  `}
                  onClick={() => onSettingClick?.(item.id)}
                  title={item.label}
                >
                  {item.icon && (
                    <span className="flex-shrink-0">{item.icon}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsed Avatar */}
        {(userName || userEmail || avatarLabel) && (
          <div className="pt-2 mt-auto border-t border-gray-100">
            <button
              className="w-full flex items-center justify-center p-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={(e) =>
                onAvatarClick?.(e.currentTarget.getBoundingClientRect())
              }
              title={userName || userEmail}
            >
              <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={userName || "User avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-7 bg-indigo-600 flex items-center justify-center text-white text-[11px] font-semibold">
                    {avatarLabel || userName?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Expanded state
  return (
    <div
      className="pl-2 py-3 h-full w-full bg-white flex text-sm flex-col overflow-hidden antialiased"
      style={{ width }}
    >
      {/* Header - Logo and collapse toggle */}
      <div className="flex items-center justify-between mb-3 px-2 pr-4">
        <img
          src={VON_COMBINATION_MARK_URL}
          alt="Von logo"
          width={64}
          height={24}
          className="cursor-default"
        />
        <button
          onClick={onToggleCollapse}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          title="Collapse sidebar"
        >
          <SidebarSimpleIcon
            size={16}
            weight="regular"
            className="text-gray-800"
          />
        </button>
      </div>

      {/* Back to Home button */}
      {onBackToHome && (
        <div className="pr-2 my-1">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 px-2 h-8 w-full rounded-xl text-sm text-gray-900 border border-transparent hover:bg-gray-50 hover:border-gray-200 hover:shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeftIcon
              size={20}
              weight="regular"
              className="flex-shrink-0 text-gray-600"
            />
            <span className="whitespace-nowrap">Back to Home</span>
          </button>
        </div>
      )}

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pr-2 settings-scrollbar">
        {/* Integrations Section - no header, just the items */}
        {settingsItems?.integrations &&
          settingsItems.integrations.length > 0 && (
            <div className="mb-3">
              {settingsItems.integrations.map(renderMenuItem)}
            </div>
          )}

        {/* Configurations Section */}
        {settingsItems?.configurations &&
          settingsItems.configurations.length > 0 && (
            <div className="mb-3">
              <div className="px-2 py-1.5">
                <span className="text-xs font-medium text-gray-600">
                  Configurations
                </span>
              </div>
              {settingsItems.configurations.map(renderMenuItem)}
            </div>
          )}

        {/* Team Section */}
        {settingsItems?.team && settingsItems.team.length > 0 && (
          <div className="mb-3">
            <div className="px-2 py-1.5">
              <span className="text-xs font-medium text-gray-600">Team</span>
            </div>
            {settingsItems.team.map(renderMenuItem)}
          </div>
        )}

        {/* Usage Section */}
        {settingsItems?.usage && settingsItems.usage.length > 0 && (
          <div>
            <div className="px-2 py-1.5">
              <span className="text-xs font-medium text-gray-600">Usage</span>
            </div>
            {settingsItems.usage.map(renderMenuItem)}
          </div>
        )}
      </div>

      {/* Avatar Section at Bottom */}
      {(userName || userEmail || avatarLabel) && (
        <div className="mt-auto pt-2 border-t border-gray-100 pr-2">
          <button
            className="w-full flex items-center gap-2.5 pl-0.5 pr-2 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={(e) =>
              onAvatarClick?.(e.currentTarget.getBoundingClientRect())
            }
          >
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={userName || "User avatar"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-7 bg-indigo-600 flex items-center justify-center text-white text-[11px] font-semibold">
                  {avatarLabel || userName?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
            </div>
            {/* User Info */}
            <div className="flex-1 min-w-0 text-left">
              {userName && (
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userName}
                </p>
              )}
              {userEmail && (
                <p className="text-[11px] text-gray-500 truncate">
                  {userEmail}
                </p>
              )}
            </div>
            {/* Chevron */}
            <CaretUpDownIcon
              size={14}
              className="text-gray-400 flex-shrink-0"
            />
          </button>
        </div>
      )}
    </div>
  );
};

export default SettingsSidebar;
