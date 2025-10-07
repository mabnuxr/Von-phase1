import React, { useState } from "react";

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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const sidebarStyles: React.CSSProperties = {
    width,
    height: "100%",
    backgroundColor: "#FFFFFF",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
  };

  const headerStyles: React.CSSProperties = {
    padding: "20px 16px 16px",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
  };

  const titleStyles: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 600,
    color: "#1d1d1f",
    margin: 0,
  };

  const menuListStyles: React.CSSProperties = {
    padding: "12px 8px",
    flex: 1,
    overflowY: "auto",
  };

  const menuItemStyles = (
    isSelected: boolean,
    isHovered: boolean
  ): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 12px",
    fontSize: "14px",
    color: isSelected ? "#1d1d1f" : "#6e6e73",
    backgroundColor: isSelected
      ? "#f5f5f7"
      : isHovered
        ? "#fafafa"
        : "transparent",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.15s ease",
    width: "100%",
    textAlign: "left",
    fontWeight: isSelected ? 600 : 400,
    margin: "2px 0",
  });

  const iconStyles: React.CSSProperties = {
    width: "18px",
    height: "18px",
    color: "#6e6e73",
  };

  return (
    <div style={sidebarStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <h2 style={titleStyles}>Settings</h2>
      </div>

      {/* Menu Items */}
      <div style={menuListStyles}>
        {settingsItems.map((item) => {
          const isSelected = item.id === selectedSettingId;
          const isHovered = item.id === hoveredItem;

          return (
            <button
              key={item.id}
              style={menuItemStyles(isSelected, isHovered)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => onSettingClick?.(item.id)}
            >
              {item.icon && <span style={iconStyles}>{item.icon}</span>}
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SettingsSidebar;
