import React from 'react';
import { colors, spacing } from '../../theme';

export interface MenuItem {
  /**
   * Unique key for the item
   */
  key: string;

  /**
   * Display label
   */
  label: string;

  /**
   * Click handler
   */
  onClick?: () => void;

  /**
   * Whether the item is disabled
   */
  disabled?: boolean;

  /**
   * Optional icon (React node)
   */
  icon?: React.ReactNode;
}

export interface MenuProps {
  /**
   * Menu items
   */
  items: MenuItem[];

  /**
   * Whether the menu is open
   * @default false
   */
  isOpen?: boolean;

  /**
   * Callback when menu should close
   */
  onClose?: () => void;

  /**
   * Additional CSS class name
   */
  className?: string;

  /**
   * Inline styles
   */
  style?: React.CSSProperties;
}

/**
 * Menu component - displays a list of clickable items
 * Use this independently to create dropdown menus, context menus, etc.
 */
export const Menu: React.FC<MenuProps> = ({ items, isOpen = false, onClose, className, style }) => {
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);

  const handleItemClick = (item: MenuItem) => {
    if (!item.disabled && item.onClick) {
      item.onClick();
      if (onClose) {
        onClose();
      }
    }
  };

  const menuStyles: React.CSSProperties = {
    backgroundColor: colors.common.white,
    border: `1px solid ${colors.neutral[300]}`,
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
    minWidth: '200px',
    padding: `${spacing[1]} 0`,
    opacity: isOpen ? 1 : 0,
    visibility: isOpen ? 'visible' : 'hidden',
    transform: isOpen ? 'scale(1)' : 'scale(0.95)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    transformOrigin: 'top right',
    ...style,
  };

  const itemBaseStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    padding: `${spacing[2]} ${spacing[4]}`,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    fontSize: '0.9375rem', // 15px
    color: colors.neutral[800],
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    userSelect: 'none',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  const itemDisabledStyles: React.CSSProperties = {
    color: colors.neutral[400],
    cursor: 'not-allowed',
    opacity: 0.5,
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={className} style={menuStyles}>
      {items.map((item) => (
        <div
          key={item.key}
          onClick={() => handleItemClick(item)}
          onMouseEnter={() => setHoveredItem(item.key)}
          onMouseLeave={() => setHoveredItem(null)}
          style={{
            ...itemBaseStyles,
            ...(item.disabled ? itemDisabledStyles : {}),
            backgroundColor:
              hoveredItem === item.key && !item.disabled ? colors.neutral[100] : 'transparent',
          }}
        >
          {item.icon && <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default Menu;
