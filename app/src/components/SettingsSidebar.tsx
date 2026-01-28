import React from "react";
import { GearSixIcon, SidebarSimpleIcon } from "@phosphor-icons/react";

export interface SettingsItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SettingsGroupItem {
  integrations: SettingsItem[];
  configurations: SettingsItem[];
  team: SettingsItem[];
}

export interface SettingsSidebarProps {
  /**
   * List of settings items to display
   */
  settingsItems?: SettingsGroupItem;

  /**
   * Selected settings ID
   */
  selectedSettingId?: string;

  /**
   * Settings item click handler
   */
  onSettingClick?: (id: string) => void;

  /**
   * Width of the sidebar
   * @default '280px'
   */
  width?: string;

  /**
   * Whether the sidebar is collapsed
   * @default false
   */
  isCollapsed?: boolean;

  /**
   * Callback when collapse toggle is clicked
   */
  onToggleCollapse?: () => void;

  /**
   * Avatar image URL
   */
  avatarSrc?: string;

  /**
   * Avatar initials/label (shown when no image)
   */
  avatarLabel?: string;

  /**
   * User's display name
   */
  userName?: string;

  /**
   * User's email
   */
  userEmail?: string;

  /**
   * Callback when avatar is clicked
   * Receives the DOMRect of the clicked button for positioning menus
   */
  onAvatarClick?: (rect: DOMRect) => void;
}

/**
 * SettingsSidebar - Left sidebar for settings navigation
 *
 * Displays a list of settings sections with clean, minimal design.
 *
 * @example
 * ```tsx
 * <SettingsSidebar
 *   settingsItems={[
 *     { id: 'integrations', label: 'Integrations' },
 *     { id: 'fields', label: 'Fields' }
 *   ]}
 *   selectedSettingId="integrations"
 *   onSettingClick={(id) => console.log(id)}
 * />
 * ```
 */
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
}) => {
  // Get all items flattened for collapsed view
  const allItems = [
    ...(settingsItems?.integrations || []),
    ...(settingsItems?.configurations || []),
    ...(settingsItems?.team || []),
  ];

  // Collapsed state - show minimal sidebar with icons only
  if (isCollapsed) {
    return (
      <div className="px-2 py-3 h-full w-full bg-white flex text-sm flex-col overflow-hidden antialiased">
        {/* Collapsed Header - Just icon and expand button */}
        <div className="flex flex-col items-center px-1 pt-1 pb-3 border-b border-gray-200 mb-2">
          <button
            onClick={onToggleCollapse}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            title="Expand sidebar"
          >
            <SidebarSimpleIcon
              size={18}
              weight="regular"
              className="text-gray-500"
            />
          </button>
        </div>

        {/* Collapsed Menu Items - Icons only */}
        <div className="flex-1 overflow-y-auto px-1 settings-scrollbar">
          <div className="flex flex-col items-center gap-1">
            {allItems.map((item: SettingsItem) => {
              const isSelected = item.id === selectedSettingId;

              return (
                <button
                  key={item.id}
                  className={`
                    flex items-center justify-center w-8 h-8
                    rounded-lg border-0 cursor-pointer
                    transition-all duration-200
                    ${
                      isSelected
                        ? "bg-gray-100 text-gray-900"
                        : "bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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

        {/* Collapsed Avatar Section - Just avatar */}
        {(userName || userEmail || avatarLabel) && (
          <div className="pt-3 mt-auto border-t border-gray-200">
            <button
              className="w-full flex items-center justify-center p-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={(e) =>
                onAvatarClick?.(e.currentTarget.getBoundingClientRect())
              }
              title={userName || userEmail}
            >
              <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={userName || "User avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
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

  // Expanded state - show full sidebar
  return (
    <div
      className="px-2 py-3 h-full w-full bg-white flex text-sm flex-col overflow-hidden antialiased"
      style={{ width }}
    >
      {/* Section Header - Matching ChatSidebar style */}
      <div className="flex items-center justify-between px-2 pt-1 pb-3 border-b border-gray-200 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
          <GearSixIcon size={16} weight="regular" />
          Settings
        </div>
        <button
          onClick={onToggleCollapse}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          title="Collapse sidebar"
        >
          <SidebarSimpleIcon
            size={16}
            weight="regular"
            className="text-gray-500"
          />
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto px-1 settings-scrollbar">
        {/* Integrations Section */}
        {settingsItems?.integrations &&
          settingsItems.integrations.length > 0 && (
            <div className="mb-4">
              {settingsItems.integrations.map((item: SettingsItem) => {
                const isSelected = item.id === selectedSettingId;

                return (
                  <button
                    key={item.id}
                    className={`
                      flex items-center gap-2 px-2 py-1.5 mx-0 mb-0.5
                      text-sm rounded-lg cursor-pointer
                      w-full text-left transition-all duration-200
                      ${
                        isSelected
                          ? "bg-gray-100 border border-gray-200 text-gray-900 font-medium"
                          : "bg-transparent border border-transparent text-gray-700 font-normal hover:bg-gray-50"
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
              })}
            </div>
          )}

        {/* Configurations Section */}
        {settingsItems?.configurations &&
          settingsItems.configurations.length > 0 && (
            <div className="mb-4">
              <h3 className="px-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Configurations
              </h3>
              {settingsItems.configurations.map((item: SettingsItem) => {
                const isSelected = item.id === selectedSettingId;

                return (
                  <button
                    key={item.id}
                    className={`
                      flex items-center gap-2 px-2 py-1.5 mx-0 mb-0.5
                      text-sm rounded-lg cursor-pointer
                      w-full text-left transition-all duration-200
                      ${
                        isSelected
                          ? "bg-gray-100 border border-gray-200 text-gray-900 font-medium"
                          : "bg-transparent border border-transparent text-gray-700 font-normal hover:bg-gray-50"
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
              })}
            </div>
          )}

        {/* Team Section */}
        {settingsItems?.team && settingsItems.team.length > 0 && (
          <div>
            <h3 className="px-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Team
            </h3>
            {settingsItems.team.map((item: SettingsItem) => {
              const isSelected = item.id === selectedSettingId;

              return (
                <button
                  key={item.id}
                  className={`
                    flex items-center gap-2 px-2 py-1.5 mx-0 mb-0.5
                    text-sm rounded-lg cursor-pointer
                    w-full text-left transition-all duration-200
                    ${
                      isSelected
                        ? "bg-gray-100 border border-gray-200 text-gray-900 font-medium"
                        : "bg-transparent border border-transparent text-gray-700 font-normal hover:bg-gray-50"
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
            })}
          </div>
        )}
      </div>

      {/* Avatar Section at Bottom */}
      {(userName || userEmail || avatarLabel) && (
        <div className="pt-3 mt-auto border-t border-gray-200">
          <button
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={(e) =>
              onAvatarClick?.(e.currentTarget.getBoundingClientRect())
            }
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={userName || "User avatar"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
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
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              )}
            </div>
            {/* Chevron */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-400 flex-shrink-0"
            >
              <path
                d="M9 18l6-6-6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default SettingsSidebar;
