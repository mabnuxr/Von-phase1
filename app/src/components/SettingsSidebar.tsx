import React from "react";

export interface SettingsItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SettingsSidebarProps {
  /**
   * List of settings items to display
   */
  settingsItems?: SettingsItem[];

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
  settingsItems = [],
  selectedSettingId,
  onSettingClick,
  width = "280px",
}) => {
  return (
    <div
      className="h-full bg-white flex flex-col overflow-hidden antialiased font-sans"
      style={{ width }}
    >
      {/* Header */}
      <div className="px-4 pt-5 pb-4 border-b border-black/8">
        <h2 className="text-xl font-semibold text-[#1d1d1f] m-0">Settings</h2>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto p-3">
        {settingsItems.map((item) => {
          const isSelected = item.id === selectedSettingId;

          return (
            <button
              key={item.id}
              className={`
                flex items-center gap-3 px-3 py-2.5 my-0.5
                text-sm rounded-lg border-0 cursor-pointer
                w-full text-left transition-all duration-150
                ${
                  isSelected
                    ? "bg-[#f5f5f7] text-[#1d1d1f] font-semibold"
                    : "bg-transparent text-[#6e6e73] font-normal hover:bg-[#fafafa]"
                }
              `}
              onClick={() => onSettingClick?.(item.id)}
            >
              {item.icon && (
                <span className="w-[18px] h-[18px] text-[#6e6e73]">
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SettingsSidebar;
