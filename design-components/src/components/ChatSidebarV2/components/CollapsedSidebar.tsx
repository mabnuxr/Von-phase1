import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatTextIcon, SidebarSimpleIcon, PlusIcon } from '@phosphor-icons/react';
import { PrimaryIconButton, TertiaryIconButton } from '../../forms/buttons';
import { ProfilePopover } from '../../popups';
import type { SidebarItem } from '../ChatSidebarV2';
import type { PopoverPosition } from '../hooks';

export interface CollapsedSidebarProps {
  items: SidebarItem[];
  selectedItemId?: string;
  onToggleCollapse?: () => void;
  onNewChatClick?: () => void;
  onItemClick?: (id: string) => void;

  // Hover dropdown state
  isChatsHovered: boolean;
  dropdownPosition: { top: number; left: number };
  chatButtonRef: React.RefObject<HTMLButtonElement | null>;
  onChatsHover: (isHovering: boolean) => void;

  // Profile
  userName?: string;
  userEmail?: string;
  avatarSrc?: string;
  avatarLabel?: string;
  isProfileOpen: boolean;
  popoverPosition: PopoverPosition;
  avatarButtonRef: React.RefObject<HTMLButtonElement | null>;
  onAvatarClick: () => void;
  onCloseProfile: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onHelpClick?: () => void;
  onSignOutClick?: () => void;
}

/**
 * CollapsedSidebar - The collapsed state of the sidebar
 *
 * Features:
 * - Expand button
 * - New chat button
 * - Chats icon with hover dropdown showing recent items
 * - User profile avatar with popover
 */
export const CollapsedSidebar: React.FC<CollapsedSidebarProps> = ({
  items,
  selectedItemId,
  onToggleCollapse,
  onNewChatClick,
  onItemClick,
  isChatsHovered,
  dropdownPosition,
  chatButtonRef,
  onChatsHover,
  userName,
  userEmail,
  avatarSrc,
  avatarLabel,
  isProfileOpen,
  popoverPosition,
  avatarButtonRef,
  onAvatarClick,
  onCloseProfile,
  onProfileClick,
  onSettingsClick,
  onHelpClick,
  onSignOutClick,
}) => {
  return (
    <div className="px-2 py-3 h-full w-full bg-transparent flex text-[13px] flex-col antialiased font-sf">
      {/* Collapsed Header - Expand button */}
      <div className="flex flex-col items-center px-1 pt-1 pb-3 border-b border-gray-100 mb-2">
        <TertiaryIconButton
          icon={<SidebarSimpleIcon size={16} weight="regular" className="text-gray-800" />}
          onClick={onToggleCollapse}
          title="Expand sidebar"
        />
      </div>

      {/* Collapsed Menu */}
      <div className="flex-1 px-1">
        <div className="flex flex-col items-center gap-1">
          {/* New Button */}
          <PrimaryIconButton
            icon={<PlusIcon size={16} weight="bold" />}
            onClick={onNewChatClick}
            title="New Chat"
          />

          {/* Chats Icon with Hover Dropdown */}
          <div
            className="relative mt-2"
            onMouseEnter={() => onChatsHover(true)}
            onMouseLeave={() => onChatsHover(false)}
          >
            <button
              ref={chatButtonRef}
              className={`
                flex items-center justify-center w-8 h-8
                rounded-lg border-0 cursor-pointer
                transition-all duration-150
                ${isChatsHovered ? 'bg-gray-50 text-gray-900' : 'bg-transparent text-gray-800 hover:bg-gray-50 hover:text-gray-900'}
              `}
              title="Chats"
            >
              <ChatTextIcon size={18} weight="duotone" />
            </button>

            {/* Hover Dropdown */}
            <AnimatePresence>
              {isChatsHovered && items.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="fixed w-56 max-h-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-[9999]"
                  style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                >
                  <div className="px-3 py-2 border-b border-gray-100">
                    <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      Recent
                    </span>
                  </div>
                  <div className="overflow-y-auto max-h-64 py-1">
                    {items.slice(0, 10).map((item) => {
                      const isSelected = item.id === selectedItemId;

                      return (
                        <div
                          key={item.id}
                          className={`
                            flex items-center gap-2.5 px-3 py-1.5 text-[13px]
                            transition-all duration-150 cursor-pointer
                            ${isSelected ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-900 hover:bg-gray-50'}
                          `}
                          onClick={() => onItemClick?.(item.id)}
                          title={item.label}
                        >
                          <ChatTextIcon
                            size={16}
                            weight="regular"
                            className="text-gray-800 flex-shrink-0"
                          />
                          <span className="truncate font-medium">{item.label}</span>
                        </div>
                      );
                    })}
                    {items.length > 10 && (
                      <div className="px-3 py-2 text-[11px] text-gray-500 border-t border-gray-100">
                        +{items.length - 10} more
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* User Profile Section - Collapsed */}
      {(userName || userEmail || avatarLabel) && (
        <div className="mt-auto pt-2 px-1 border-t border-gray-100">
          <button
            ref={avatarButtonRef}
            onClick={onAvatarClick}
            className="w-full flex items-center justify-center py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            title={userName || userEmail}
          >
            <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={userName || 'User avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-[11px] font-semibold">
                  {avatarLabel || userName?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Profile Popover */}
      <ProfilePopover
        isOpen={isProfileOpen}
        onClose={onCloseProfile}
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

export default CollapsedSidebar;
