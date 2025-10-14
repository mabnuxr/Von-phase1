import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SettingsIcon, LogoutIcon } from "./icons";

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

  const menuTop = triggerRect ? `${triggerRect.bottom + 8}px` : "60px";
  const menuRight = triggerRect
    ? `${window.innerWidth - triggerRect.right}px`
    : "16px";

  const handleItemClick = (callback?: () => void) => {
    callback?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          className="fixed bg-white border border-black/10 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] min-w-[240px] z-[1000]"
          style={{ top: menuTop, right: menuRight }}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{
            duration: 0.2,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
      {/* User Info Section */}
      {(userName || userEmail) && (
        <div className="p-4 border-b border-black/8">
          {userName && (
            <div className="text-sm font-semibold text-[#1d1d1f] mb-1">
              {userName}
            </div>
          )}
          {userEmail && (
            <div className="text-xs text-[#6e6e73]">{userEmail}</div>
          )}
        </div>
      )}

      {/* Menu Items */}
      <div className="p-2">
        <motion.button
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#1d1d1f] border-0 rounded-lg cursor-pointer w-full text-left bg-transparent hover:bg-[#f5f5f7] transition-colors duration-150"
          onClick={() => handleItemClick(onSettingsClick)}
          whileTap={{ scale: 0.98 }}
        >
          <SettingsIcon />
          Settings
        </motion.button>

        <motion.button
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#1d1d1f] border-0 rounded-lg cursor-pointer w-full text-left bg-transparent hover:bg-[#f5f5f7] transition-colors duration-150"
          onClick={() => handleItemClick(onLogoutClick)}
          whileTap={{ scale: 0.98 }}
        >
          <LogoutIcon />
          Logout
        </motion.button>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
