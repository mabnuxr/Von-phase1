import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GearIcon, SignOutIcon } from "@phosphor-icons/react";

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

  // Position menu above the trigger, aligned to the left edge
  const menuBottom = triggerRect
    ? `${window.innerHeight - triggerRect.top}px`
    : "60px";
  const menuLeft = triggerRect ? `${triggerRect.left}px` : "16px";

  const handleItemClick = (callback?: () => void) => {
    callback?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          className="fixed bg-white border border-black/10 rounded-xl shadow-elevated min-w-[240px] z-[1000]"
          style={{ bottom: menuBottom, left: menuLeft }}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{
            duration: 0.2,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {/* User Info Section */}
          {(userName || userEmail) && (
            <div className="p-4 border-b border-black/8">
              {userName && (
                <div className="text-sm font-semibold text-gray-900 mb-1">
                  {userName}
                </div>
              )}
              {userEmail && (
                <div className="text-xs text-gray-700">{userEmail}</div>
              )}
            </div>
          )}

          {/* Menu Items */}
          <div className="p-2">
            <motion.button
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-900 border-0 rounded-lg cursor-pointer w-full text-left bg-transparent hover:bg-gray-50 transition-colors duration-200"
              onClick={() => handleItemClick(onSettingsClick)}
              whileTap={{ scale: 0.98 }}
            >
              <GearIcon size={20} weight="regular" className="text-gray-700" />
              Settings
            </motion.button>

            <motion.button
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-900 border-0 rounded-lg cursor-pointer w-full text-left bg-transparent hover:bg-gray-50 transition-colors duration-200"
              onClick={() => handleItemClick(onLogoutClick)}
              whileTap={{ scale: 0.98 }}
            >
              <SignOutIcon
                size={20}
                weight="regular"
                className="text-gray-700"
              />
              Logout
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
