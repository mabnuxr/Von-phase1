import React from 'react';
import { spacing } from '../../theme';

export interface HeaderProps {
  /**
   * Logo source URL
   * @default '/logo.gif'
   */
  logoSrc?: string;

  /**
   * Logo click handler
   */
  onLogoClick?: () => void;

  /**
   * Show hamburger menu icon
   * @default false
   */
  showMenu?: boolean;

  /**
   * Hamburger menu click handler
   */
  onMenuClick?: () => void;

  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * Header - Simple page header with logo
 *
 * Minimal header component with logo and optional hamburger menu.
 * Designed to match the Apple-style crisp aesthetic from the Chat page.
 *
 * @example
 * ```tsx
 * <Header
 *   logoSrc="/logo.gif"
 *   onLogoClick={() => console.log('Logo clicked')}
 * />
 * ```
 */
export const Header: React.FC<HeaderProps> = ({
  logoSrc = '/logo.gif',
  onLogoClick,
  showMenu = false,
  onMenuClick,
  className,
}) => {
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing[2]} ${spacing[4]}`,
    gap: spacing[4],
    height: '56px',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  const leftSectionStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
  };

  const iconButtonStyles: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: spacing[2],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    transition: 'background-color 0.2s ease',
  };

  const logoStyles: React.CSSProperties = {
    height: '40px',
    width: 'auto',
    cursor: onLogoClick ? 'pointer' : 'default',
  };

  return (
    <div className={className} style={containerStyles}>
      {/* Left Section - Logo and Menu */}
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
    </div>
  );
};

export default Header;
