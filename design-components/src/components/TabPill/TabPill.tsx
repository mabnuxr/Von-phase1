import React from 'react';
import { colors, spacing } from '../../theme';

export interface TabPillProps {
  /**
   * Tab label text
   */
  label: string;

  /**
   * Whether this tab is active
   * @default false
   */
  active?: boolean;

  /**
   * Click handler
   */
  onClick?: () => void;

  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * TabPill - Rounded pill-shaped tab button
 *
 * Used in the top navigation bar for switching between different views.
 * Active tabs have white background with shadow, inactive tabs are transparent.
 *
 * @example
 * ```tsx
 * <TabPill label="Forecast Q3" active onClick={() => {}} />
 * <TabPill label="Sales Performance" onClick={() => {}} />
 * ```
 */
export const TabPill: React.FC<TabPillProps> = ({ label, active = false, onClick, className }) => {
  const pillStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${spacing[2]} ${spacing[4]}`,
    borderRadius: '20px',
    border: 'none',
    cursor: onClick ? 'pointer' : 'default',
    fontSize: '14px',
    fontWeight: active ? 500 : 400,
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
    backgroundColor: active ? colors.common.white : 'transparent',
    color: active ? colors.neutral[900] : colors.neutral[600],
    boxShadow: active ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
  };

  const hoverStyles: React.CSSProperties = !active
    ? {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
      }
    : {};

  return (
    <button
      className={className}
      style={pillStyles}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!active && onClick) {
          Object.assign(e.currentTarget.style, hoverStyles);
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {label}
    </button>
  );
};

export default TabPill;
