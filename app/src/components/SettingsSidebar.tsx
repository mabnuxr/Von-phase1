import React from "react";

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
}) => {
  return (
    <div
      className="h-full bg-white flex flex-col overflow-hidden antialiased font-sf"
      style={{ width }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-5 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 m-0">Settings</h2>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 settings-scrollbar">
        {/* Integrations Section */}
        {settingsItems?.integrations &&
          settingsItems.integrations.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-col gap-1">
                {settingsItems.integrations.map((item: SettingsItem) => {
                  const isSelected = item.id === selectedSettingId;

                  return (
                    <button
                      key={item.id}
                      className={`
                      flex items-center gap-3 px-3 py-2.5
                      text-sm rounded-lg border-0 cursor-pointer
                      w-full text-left transition-all duration-200
                      ${
                        isSelected
                          ? "bg-gray-100 text-gray-900 font-medium"
                          : "bg-transparent text-gray-700 font-normal hover:bg-gray-50"
                      }
                    `}
                      onClick={() => onSettingClick?.(item.id)}
                    >
                      {item.icon && (
                        <span
                          className={`w-5 h-5 flex-shrink-0 ${isSelected ? "text-gray-900" : "text-gray-600"}`}
                        >
                          {item.icon}
                        </span>
                      )}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        {/* Configurations Section */}
        {settingsItems?.configurations &&
          settingsItems.configurations.length > 0 && (
            <div className="mb-6">
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Configurations
              </h3>
              <div className="flex flex-col gap-1">
                {settingsItems.configurations.map((item: SettingsItem) => {
                  const isSelected = item.id === selectedSettingId;

                  return (
                    <button
                      key={item.id}
                      className={`
                      flex items-center gap-3 px-3 py-2.5
                      text-sm rounded-lg border-0 cursor-pointer
                      w-full text-left transition-all duration-200
                      ${
                        isSelected
                          ? "bg-gray-100 text-gray-900 font-medium"
                          : "bg-transparent text-gray-700 font-normal hover:bg-gray-50"
                      }
                    `}
                      onClick={() => onSettingClick?.(item.id)}
                    >
                      {item.icon && (
                        <span
                          className={`w-5 h-5 flex-shrink-0 ${isSelected ? "text-gray-900" : "text-gray-600"}`}
                        >
                          {item.icon}
                        </span>
                      )}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        {/* Team Section */}
        {/* {settingsItems?.team && settingsItems.team.length > 0 && (
          <div>
            <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Team
            </h3>
            <div className="flex flex-col gap-1">
              {settingsItems.team.map((item: SettingsItem) => {
                const isSelected = item.id === selectedSettingId;

                return (
                  <button
                    key={item.id}
                    className={`
                      flex items-center gap-3 px-3 py-2.5
                      text-sm rounded-lg border-0 cursor-pointer
                      w-full text-left transition-all duration-200
                      ${
                        isSelected
                          ? "bg-gray-100 text-gray-900 font-medium"
                          : "bg-transparent text-gray-700 font-normal hover:bg-gray-50"
                      }
                    `}
                    onClick={() => onSettingClick?.(item.id)}
                  >
                    {item.icon && (
                      <span
                        className={`w-5 h-5 flex-shrink-0 ${isSelected ? "text-gray-900" : "text-gray-600"}`}
                      >
                        {item.icon}
                      </span>
                    )}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default SettingsSidebar;
