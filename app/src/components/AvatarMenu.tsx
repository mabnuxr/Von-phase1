import React, { useState, useRef, useEffect } from "react";

export interface AvatarMenuProps {
  /**
   * User's display name
   */
  userName?: string;

  /**
   * User's email
   */
  userEmail?: string;

  /**
   * Callback when Settings is clicked
   */
  onSettingsClick?: () => void;

  /**
   * Callback when Logout is clicked
   */
  onLogoutClick?: () => void;

  /**
   * Whether the menu is open
   */
  isOpen: boolean;

  /**
   * Callback when menu should close
   */
  onClose: () => void;

  /**
   * Position of the menu trigger (for positioning dropdown)
   */
  triggerRect?: DOMRect;
}

/**
 * AvatarMenu - Dropdown menu for user avatar with Settings and Logout
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <AvatarMenu
 *   userName="John Doe"
 *   userEmail="john@example.com"
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSettingsClick={() => navigate('/settings')}
 *   onLogoutClick={() => handleLogout()}
 * />
 * ```
 */
export const AvatarMenu: React.FC<AvatarMenuProps> = ({
  userName,
  userEmail,
  onSettingsClick,
  onLogoutClick,
  isOpen,
  onClose,
  triggerRect,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuStyles: React.CSSProperties = {
    position: "fixed",
    top: triggerRect ? `${triggerRect.bottom + 8}px` : "60px",
    right: triggerRect ? `${window.innerWidth - triggerRect.right}px` : "16px",
    backgroundColor: "#FFFFFF",
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    minWidth: "240px",
    zIndex: 1000,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
  };

  const userInfoStyles: React.CSSProperties = {
    padding: "16px",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
  };

  const userNameStyles: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 600,
    color: "#1d1d1f",
    marginBottom: "4px",
  };

  const userEmailStyles: React.CSSProperties = {
    fontSize: "12px",
    color: "#6e6e73",
  };

  const menuListStyles: React.CSSProperties = {
    padding: "8px",
  };

  const menuItemStyles = (isHovered: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 12px",
    fontSize: "14px",
    color: "#1d1d1f",
    backgroundColor: isHovered ? "#f5f5f7" : "transparent",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
    width: "100%",
    textAlign: "left",
  });

  const iconStyles: React.CSSProperties = {
    width: "18px",
    height: "18px",
    color: "#6e6e73",
  };

  const handleItemClick = (callback?: () => void) => {
    callback?.();
    onClose();
  };

  return (
    <div ref={menuRef} style={menuStyles}>
      {/* User Info Section */}
      {(userName || userEmail) && (
        <div style={userInfoStyles}>
          {userName && <div style={userNameStyles}>{userName}</div>}
          {userEmail && <div style={userEmailStyles}>{userEmail}</div>}
        </div>
      )}

      {/* Menu Items */}
      <div style={menuListStyles}>
        <button
          style={menuItemStyles(hoveredItem === "settings")}
          onMouseEnter={() => setHoveredItem("settings")}
          onMouseLeave={() => setHoveredItem(null)}
          onClick={() => handleItemClick(onSettingsClick)}
        >
          <svg
            style={iconStyles}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M12 15a3 3 0 100-6 3 3 0 000 6z"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Settings
        </button>

        <button
          style={menuItemStyles(hoveredItem === "logout")}
          onMouseEnter={() => setHoveredItem("logout")}
          onMouseLeave={() => setHoveredItem(null)}
          onClick={() => handleItemClick(onLogoutClick)}
        >
          <svg
            style={iconStyles}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 17l5-5-5-5M21 12H9"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};
