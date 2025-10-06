import React from 'react';
import { TabPill } from '../TabPill';
import { Avatar } from '../Avatar';
import { spacing } from '../../theme';

export interface Tab {
  id: string;
  label: string;
  active?: boolean;
}

export interface TopBarProps {
  /**
   * List of tabs to display
   */
  tabs?: Tab[];

  /**
   * Tab click handler
   */
  onTabClick?: (id: string) => void;

  /**
   * Search placeholder text
   * @default 'Ask von anything'
   */
  searchPlaceholder?: string;

  /**
   * Search input change handler
   */
  onSearchChange?: (value: string) => void;

  /**
   * Avatar label/initials
   */
  avatarLabel?: string;

  /**
   * Avatar image source
   */
  avatarSrc?: string;

  /**
   * Avatar click handler
   */
  onAvatarClick?: () => void;

  /**
   * Show hamburger menu icon
   * @default true
   */
  showMenu?: boolean;

  /**
   * Hamburger menu click handler
   */
  onMenuClick?: () => void;

  /**
   * Logo source URL
   */
  logoSrc?: string;

  /**
   * Logo click handler
   */
  onLogoClick?: () => void;
}

/**
 * TopBar - Minimal top navigation bar
 *
 * Simple navigation bar with logo, hamburger menu, scrollable tabs, search, and avatar.
 * Background is transparent to show page background color.
 *
 * @example
 * ```tsx
 * <TopBar
 *   tabs={[
 *     { id: '1', label: 'Forecast Q3', active: true },
 *     { id: '2', label: 'Sales Performance' }
 *   ]}
 *   onTabClick={(id) => console.log(id)}
 *   avatarLabel="CB"
 *   onSearchChange={(value) => console.log(value)}
 * />
 * ```
 */
export const TopBar: React.FC<TopBarProps> = ({
  tabs = [],
  onTabClick,
  searchPlaceholder = 'Ask von anything',
  onSearchChange,
  avatarLabel,
  avatarSrc,
  onAvatarClick,
  showMenu = true,
  onMenuClick,
  logoSrc = '/logo.gif',
  onLogoClick,
}) => {
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    gap: '12px',
    height: '52px',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  const leftSectionStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const iconButtonStyles: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    transition: 'background-color 0.2s ease',
  };

  const logoStyles: React.CSSProperties = {
    height: '36px',
    width: 'auto',
    cursor: onLogoClick ? 'pointer' : 'default',
  };

  const centerSectionStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
    overflow: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  };

  const rightSectionStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
  };

  const searchInputStyles: React.CSSProperties = {
    padding: `${spacing[2]} ${spacing[4]}`,
    borderRadius: '20px',
    border: '1px solid #E5E5E7',
    backgroundColor: '#FFFFFF',
    fontSize: '14px',
    outline: 'none',
    width: '200px',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
  };

  const moreButtonStyles: React.CSSProperties = {
    ...iconButtonStyles,
    fontSize: '18px',
    color: '#6E6E73',
  };

  return (
    <div style={containerStyles}>
      {/* Left Section */}
      <div style={leftSectionStyles}>
        {logoSrc && <img src={logoSrc} alt="Logo" style={logoStyles} onClick={onLogoClick} />}
        {showMenu && (
          <button
            style={iconButtonStyles}
            onClick={onMenuClick}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 12h18M3 6h18M3 18h18" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Center Section - Tabs */}
      {tabs.length > 0 && (
        <div style={centerSectionStyles}>
          {tabs.map((tab) => (
            <TabPill
              key={tab.id}
              label={tab.label}
              active={tab.active}
              onClick={() => onTabClick?.(tab.id)}
            />
          ))}
          <button
            style={moreButtonStyles}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="More options"
          >
            •••
          </button>
        </div>
      )}

      {/* Right Section */}
      <div style={rightSectionStyles}>
        <input
          type="search"
          placeholder={searchPlaceholder}
          style={searchInputStyles}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
        <Avatar src={avatarSrc} fallback={avatarLabel} size="medium" onClick={onAvatarClick} />
      </div>
    </div>
  );
};

export default TopBar;
