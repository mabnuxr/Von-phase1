import React from 'react';
import { TabPill } from '../TabPill';
import { spacing } from '../../theme';
import { PlusIcon } from '@phosphor-icons/react';

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
    padding: '8px 20px 8px 20px',
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
        <svg
          width="72"
          height="28"
          viewBox="0 0 80 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ cursor: onLogoClick ? 'pointer' : 'default' }}
          onClick={onLogoClick}
        >
          <path d="M0 8C0 3.58172 3.58172 0 8 0H20C24.4183 0 28 3.58172 28 8V20C28 24.4183 24.4183 28 20 28H8C3.58172 28 0 24.4183 0 20V8Z" fill="url(#paint0_radial_topbar)"/>
          <path d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z" stroke="white" strokeWidth="1.33"/>
          <circle cx="13.9922" cy="14" r="7.835" stroke="white" strokeWidth="1.33"/>
          <path d="M32.0962 6.78408C31.8987 6.26257 32.0053 6.00182 32.4162 6.00182H33.6252C34.0519 6.00182 34.3363 6.19541 34.4786 6.58259L38.3306 17.1906C38.4966 17.6568 38.702 18.285 38.947 19.0751C39.1998 19.8574 39.3697 20.4816 39.4566 20.9478H39.504C39.5909 20.4816 39.7569 19.8574 40.0018 19.0751C40.2547 18.285 40.4641 17.6568 40.63 17.1906L44.4821 6.58259C44.6243 6.19541 44.9088 6.00182 45.3355 6.00182H46.5444C46.9553 6.00182 47.062 6.26257 46.8644 6.78408L41.0923 22.2753C40.9105 22.7573 40.6498 22.9983 40.31 22.9983H38.6506C38.3109 22.9983 38.0501 22.7573 37.8684 22.2753L32.0962 6.78408Z" fill="#332D3E"/>
          <path d="M47.7038 14.5001C47.7038 11.7345 48.3833 9.56942 49.7424 8.00489C51.1094 6.43246 53.0769 5.64624 55.6449 5.64624C58.213 5.64624 60.1765 6.43246 61.5356 8.00489C62.9026 9.56942 63.5861 11.7345 63.5861 14.5001C63.5861 17.2656 62.9026 19.4347 61.5356 21.0071C60.1765 22.5716 58.213 23.3539 55.6449 23.3539C53.0769 23.3539 51.1094 22.5716 49.7424 21.0071C48.3833 19.4347 47.7038 17.2656 47.7038 14.5001ZM50.1335 14.5001C50.1335 16.7125 50.5879 18.4351 51.4966 19.6678C52.4052 20.8925 53.788 21.5049 55.6449 21.5049C57.5018 21.5049 58.8846 20.8925 59.7933 19.6678C60.702 18.4351 61.1563 16.7125 61.1563 14.5001C61.1563 12.2876 60.702 10.569 59.7933 9.34422C58.8846 8.11156 57.5018 7.49523 55.6449 7.49523C53.788 7.49523 52.4052 8.11156 51.4966 9.34422C50.5879 10.569 50.1335 12.2876 50.1335 14.5001Z" fill="#332D3E"/>
          <path d="M66.7841 22.9983C66.389 22.9983 66.1915 22.781 66.1915 22.3464V6.6537C66.1915 6.21911 66.389 6.00182 66.7841 6.00182H68.3012C68.8543 6.00182 69.2494 6.19936 69.4865 6.59444L76.9061 19.0277H76.9535C76.9377 18.7116 76.9298 18.3956 76.9298 18.0795V6.6537C76.9298 6.21911 77.1274 6.00182 77.5225 6.00182H78.6129C79.008 6.00182 79.2055 6.21911 79.2055 6.6537V22.3464C79.2055 22.781 79.008 22.9983 78.6129 22.9983H77.5699C77.0167 22.9983 76.6217 22.8008 76.3846 22.4057L68.4908 9.21384H68.4434C68.4592 9.52991 68.4671 9.84598 68.4671 10.162V22.3464C68.4671 22.781 68.2696 22.9983 67.8745 22.9983H66.7841Z" fill="#332D3E"/>
          <defs>
            <radialGradient id="paint0_radial_topbar" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(21.875 1.75) rotate(120.964) scale(30.6125)">
              <stop stopColor="#FFF3EB"/>
              <stop offset="0.26" stopColor="#FF9042"/>
              <stop offset="1" stopColor="#854FFF"/>
            </radialGradient>
          </defs>
        </svg>
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
