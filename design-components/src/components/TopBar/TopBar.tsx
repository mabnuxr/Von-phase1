import React from 'react';
import { TabPill } from '../TabPill';
import { spacing } from '../../theme';
import { PlusIcon } from '@phosphor-icons/react';
import { MenuIcon } from '../Chat/icons';

const VON_COMBINATION_MARK_URL =
  'https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/von_combination_mark.svg';

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
   * Show hamburger menu icon
   * @default true
   */
  showMenu?: boolean;

  /**
   * Hamburger menu click handler
   */
  onMenuClick?: () => void;

  /**
   * Logo click handler
   */
  onLogoClick?: () => void;

  /**
   * New chat button click handler
   */
  onNewChatClick?: () => void;

  /**
   * Optional element to render before the logo (e.g., back button)
   */
  leftElement?: React.ReactNode;

  /**
   * Optional element to render on the right side (e.g., back button)
   * Replaces the default "New Chat" button when provided
   */
  rightElement?: React.ReactNode;
}

/**
 * TopBar - Minimal top navigation bar
 *
 * Simple navigation bar with logo, hamburger menu, scrollable tabs, and avatar.
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
 * />
 * ```
 */
export const TopBar: React.FC<TopBarProps> = ({
  tabs = [],
  onTabClick,
  showMenu = true,
  onMenuClick,
  onLogoClick,
  onNewChatClick,
  leftElement,
  rightElement,
}) => {
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px 8px 14px',
    gap: '12px',
    height: '52px',
    backgroundColor: 'transparent',
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

  const moreButtonStyles: React.CSSProperties = {
    ...iconButtonStyles,
    fontSize: '18px',
    color: '#6E6E73',
  };

  return (
    <div style={containerStyles}>
      {/* Left Section */}
      <div style={leftSectionStyles}>
        {leftElement}
        {/* Von Combination Mark Logo */}
        <img
          src={VON_COMBINATION_MARK_URL}
          alt="Von logo"
          width={72}
          height={28}
          style={{ cursor: onLogoClick ? 'pointer' : 'default' }}
          onClick={onLogoClick}
        />
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
            <MenuIcon size={20} />
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

      {/* Right Section - Custom element or New Chat Button */}
      <div style={rightSectionStyles}>
        {rightElement ?? (
          <button
            className="h-8 px-3 flex items-center justify-center gap-1 rounded-lg bg-gray-900 text-white text-sm font-semibold transition-all duration-200 cursor-pointer hover:opacity-90"
            onClick={onNewChatClick}
            title="Create a new chat"
          >
            New Chat
            <PlusIcon size={14} weight="bold" />
          </button>
        )}
      </div>
    </div>
  );
};

export default TopBar;
