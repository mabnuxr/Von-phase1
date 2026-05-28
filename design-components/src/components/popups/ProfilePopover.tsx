import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GearIcon, SignOutIcon, ArrowUpRight, LockIcon } from '@phosphor-icons/react';

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
   * User's email address
   */
  userEmail?: string;

  /**
   * Callback when settings is clicked
   */
  onSettingsClick?: () => void;

  /**
   * Callback when sign out is clicked
   */
  onSignOutClick?: () => void;

  /**
   * Callback when help docs is clicked
   */
  onHelpDocsClick?: () => void;

  /**
   * When non-empty, the Settings item is rendered disabled with a lock icon
   * and this string as the tooltip. Use to gate settings access for read-only
   * roles (e.g. View Only).
   */
  settingsDisabledReason?: string;

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
  trailingIcon?: React.ReactNode;
  href?: string;
  disabled?: boolean;
  disabledTooltip?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  onClick,
  variant = 'default',
  trailingIcon,
  href,
  disabled = false,
  disabledTooltip,
}) => {
  const baseClasses = 'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-lg';
  const interactiveClasses = `transition-colors cursor-pointer ${
    variant === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
  }`;
  const disabledClasses = 'text-gray-400 cursor-not-allowed';
  const classes = `${baseClasses} ${disabled ? disabledClasses : interactiveClasses}`;

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        title={disabledTooltip}
        aria-disabled
        className={classes}
      >
        {icon}
        <span className="flex-1">{label}</span>
        <LockIcon size={14} weight="regular" className="text-gray-400" />
      </button>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        onClick={onClick}
      >
        {icon}
        <span className="flex-1">{label}</span>
        {trailingIcon}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={classes}>
      {icon}
      <span className="flex-1">{label}</span>
      {trailingIcon}
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
  userEmail,
  onSettingsClick,
  onSignOutClick,
  onHelpDocsClick,
  settingsDisabledReason,
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
            fixed w-60 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-[9999]
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
          {userEmail && (
            <div className="px-3 py-3 border-b border-gray-100">
              <p className="text-sm text-gray-500 truncate">{userEmail}</p>
            </div>
          )}

          {/* Menu Items */}
          <div className="p-1.5">
            <MenuItem
              icon={<GearIcon size={16} weight="regular" />}
              label="Settings"
              onClick={() => {
                onSettingsClick?.();
                onClose();
              }}
              disabled={Boolean(settingsDisabledReason)}
              disabledTooltip={settingsDisabledReason}
            />
            <MenuItem
              icon={<ArrowUpRight size={16} weight="regular" />}
              label="Help docs"
              href="https://docs.vonlabs.ai"
              onClick={onHelpDocsClick}
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
