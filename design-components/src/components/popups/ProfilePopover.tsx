import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GearIcon, SignOutIcon, UserIcon } from '@phosphor-icons/react';

export interface ProfilePopoverProps {
  /**
   * Whether the popover is open
   */
  isOpen: boolean;

  /**
   * Callback when popover should close
   */
  onClose: () => void;

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
   * Callback when profile is clicked
   */
  onProfileClick?: () => void;

  /**
   * Callback when settings is clicked
   */
  onSettingsClick?: () => void;

  /**
   * Callback when help is clicked
   */
  onHelpClick?: () => void;

  /**
   * Callback when sign out is clicked
   */
  onSignOutClick?: () => void;

  /**
   * Position of the popover
   * @default { top: 0, right: 0 }
   */
  position?: { top?: number; right?: number; left?: number; bottom?: number };

  /**
   * Additional CSS class name
   */
  className?: string;
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'danger';
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick, variant = 'default' }) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors cursor-pointer text-left rounded-lg
        ${variant === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'}
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

/**
 * ProfilePopover - User profile dropdown menu
 *
 * Shows user info and navigation options like profile, settings, help, and sign out.
 */
export const ProfilePopover: React.FC<ProfilePopoverProps> = ({
  isOpen,
  onClose,
  userName,
  userEmail,
  avatarSrc,
  avatarLabel,
  onProfileClick,
  onSettingsClick,
  onHelpClick,
  onSignOutClick,
  position = { top: 0, right: 0 },
  className = '',
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.15 }}
          className={`
            fixed w-64 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-[9999]
            ${className}
          `}
          style={{
            top: position.top,
            right: position.right,
            left: position.left,
            bottom: position.bottom,
          }}
        >
          {/* User Info Header */}
          {(userName || userEmail) && (
            <div className="px-3 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={userName || 'User avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                      {avatarLabel || userName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {userName && (
                    <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                  )}
                  {userEmail && <p className="text-[11px] text-gray-500 truncate">{userEmail}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="p-1.5">
            <MenuItem
              icon={<UserIcon size={16} weight="regular" />}
              label="Profile"
              onClick={() => {
                onProfileClick?.();
                onClose();
              }}
            />
            <MenuItem
              icon={<GearIcon size={16} weight="regular" />}
              label="Settings"
              onClick={() => {
                onSettingsClick?.();
                onClose();
              }}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Sign Out */}
          <div className="p-1.5">
            <MenuItem
              icon={<SignOutIcon size={16} weight="regular" />}
              label="Sign out"
              onClick={() => {
                onSignOutClick?.();
                onClose();
              }}
              variant="danger"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfilePopover;
