import React from 'react';
import { colors, spacing } from '../../theme';

export interface TabSwitcherTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabSwitcherProps {
  /**
   * List of tabs
   */
  tabs: TabSwitcherTab[];

  /**
   * Active tab ID
   */
  activeTabId?: string;

  /**
   * Tab click handler
   */
  onTabClick?: (id: string) => void;

  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * TabSwitcher - Horizontal tab switcher with underline indicator
 *
 * Used in chat messages to switch between Output/Sources/Thought views.
 * Shows active tab with underline indicator.
 *
 * @example
 * ```tsx
 * <TabSwitcher
 *   tabs={[
 *     { id: 'output', label: 'Output', icon: <Icon /> },
 *     { id: 'sources', label: 'Sources' },
 *     { id: 'thought', label: 'Thought' }
 *   ]}
 *   activeTabId="output"
 *   onTabClick={(id) => console.log(id)}
 * />
 * ```
 */
export const TabSwitcher: React.FC<TabSwitcherProps> = ({
  tabs,
  activeTabId,
  onTabClick,
  className,
}) => {
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing[4],
    borderBottom: `1px solid ${colors.neutral[200]}`,
    marginBottom: spacing[4],
  };

  const tabStyles = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    padding: `${spacing[2]} 0`,
    fontSize: '14px',
    fontWeight: isActive ? 500 : 400,
    color: isActive ? colors.neutral[900] : colors.neutral[600],
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: isActive ? `2px solid ${colors.neutral[900]}` : '2px solid transparent',
    marginBottom: '-1px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
  });

  const iconStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '16px',
    height: '16px',
  };

  return (
    <div className={className} style={containerStyles}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            style={tabStyles(isActive)}
            onClick={() => onTabClick?.(tab.id)}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = colors.neutral[700];
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = colors.neutral[600];
              }
            }}
          >
            {tab.icon && <span style={iconStyles}>{tab.icon}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default TabSwitcher;
