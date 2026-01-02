import React, { useState, useRef } from 'react';
import { TabPill } from '../TabPill';
import { spacing } from '../../theme';
import { MenuIcon } from '../Chat/icons';
import { ProfilePopover } from '../popups';

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
   * Optional element to render on the right side
   * Replaces the default user avatar when provided
   */
  rightElement?: React.ReactNode;

  /**
   * User's display name
   */
  userName?: string;

  /**
   * User's email address
   */
  userEmail?: string;

  /**
   * Avatar image URL
   */
  avatarSrc?: string;

  /**
   * Avatar initials/label (shown when no image)
   */
  avatarLabel?: string;

  /**
   * Callback when profile is clicked in popover
   */
  onProfileClick?: () => void;

  /**
   * Callback when settings is clicked in popover
   */
  onSettingsClick?: () => void;

  /**
   * Callback when help is clicked in popover
   */
  onHelpClick?: () => void;

  /**
   * Callback when sign out is clicked in popover
   */
  onSignOutClick?: () => void;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onNewChatClick: _onNewChatClick,
  leftElement,
  rightElement,
  userName,
  userEmail,
  avatarSrc,
  avatarLabel,
  onProfileClick,
  onSettingsClick,
  onHelpClick,
  onSignOutClick,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, right: 0 });

  const handleAvatarClick = () => {
    if (avatarButtonRef.current) {
      const rect = avatarButtonRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setIsProfileOpen(!isProfileOpen);
  };
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 20px 8px 20px',
    gap: '12px',
    height: '42px',
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
          width={64}
          height={24}
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

      {/* Right Section - Custom element or User Avatar */}
      <div style={rightSectionStyles}>
        {rightElement ??
          ((userName || userEmail || avatarLabel) && (
            <button
              ref={avatarButtonRef}
              onClick={handleAvatarClick}
              className="w-7 h-7 rounded-xl flex-shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-gray-200 transition-all"
              title={userName || userEmail}
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={userName || 'User avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-[12px] font-semibold">
                  {avatarLabel || userName?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </button>
          ))}
      </div>

      {/* Profile Popover */}
      <ProfilePopover
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userName={userName}
        userEmail={userEmail}
        avatarSrc={avatarSrc}
        avatarLabel={avatarLabel}
        position={popoverPosition}
        onProfileClick={onProfileClick}
        onSettingsClick={onSettingsClick}
        onHelpClick={onHelpClick}
        onSignOutClick={onSignOutClick}
      />
    </div>
  );
};

export default TopBar;
