import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatTextIcon,
  SidebarSimpleIcon,
  PlusCircleIcon,
  FolderSimpleIcon,
  CaretRightIcon,
} from '@phosphor-icons/react';
import { TertiaryIconButton } from '../../forms/buttons';
import { ProfilePopover } from '../../popups';
import type { SidebarItem, Folder, FolderItemsMap } from '../ChatSidebarV2';
import type { PopoverPosition } from '../hooks';

export interface CollapsedSidebarProps {
  items: SidebarItem[];
  folders?: Folder[];
  folderItems?: FolderItemsMap;
  selectedItemId?: string;
  onToggleCollapse?: () => void;
  onNewChatClick?: () => void;
  onItemClick?: (id: string) => void;

  // Hover dropdown state - Chats
  isChatsHovered: boolean;
  dropdownPosition: { top: number; left: number };
  chatButtonRef: React.RefObject<HTMLButtonElement | null>;
  onChatsHover: (isHovering: boolean) => void;

  // Hover dropdown state - Folders
  isFoldersHovered: boolean;
  foldersDropdownPosition: { top: number; left: number };
  foldersButtonRef: React.RefObject<HTMLButtonElement | null>;
  onFoldersHover: (isHovering: boolean) => void;

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
 * - New chat button (PlusCircleIcon)
 * - Chats icon with hover dropdown showing recent items
 * - Folders icon with hover dropdown showing folders and their items
 * - User profile avatar with popover
 */
export const CollapsedSidebar: React.FC<CollapsedSidebarProps> = ({
  items,
  folders = [],
  folderItems = {},
  selectedItemId,
  onToggleCollapse,
  onNewChatClick,
  onItemClick,
  isChatsHovered,
  dropdownPosition,
  chatButtonRef,
  onChatsHover,
  isFoldersHovered,
  foldersDropdownPosition,
  foldersButtonRef,
  onFoldersHover,
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
  // Local state for folder expansion in dropdown (doesn't affect main sidebar)
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());

  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  return (
    <div className="px-2 py-3 h-full w-full bg-transparent flex text-sm flex-col antialiased font-sf">
      {/* Collapsed Header - Expand button */}
      <div className="flex flex-col items-start pb-2 border-b border-gray-100 mb-2">
        <TertiaryIconButton
          size="large"
          icon={<SidebarSimpleIcon size={16} weight="regular" className="text-gray-800" />}
          onClick={onToggleCollapse}
          title="Expand sidebar"
        />
      </div>

      {/* Collapsed Menu */}
      <div className="flex-1">
        <div className="flex flex-col items-start gap-2">
          {/* New Chat Button */}
          <button
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-transparent cursor-pointer transition-all duration-150 hover:bg-gray-50 hover:border-gray-200 hover:shadow-xs"
            onClick={onNewChatClick}
            title="New Chat"
          >
            <PlusCircleIcon size={20} weight="fill" className="text-gray-600" />
          </button>

          {/* Folders Icon with Hover Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => onFoldersHover(true)}
            onMouseLeave={() => onFoldersHover(false)}
          >
            <button
              ref={foldersButtonRef}
              className={`
                flex items-center justify-center w-8 h-8
                rounded-lg border cursor-pointer
                transition-all duration-150
                ${isFoldersHovered ? 'bg-gray-50 border-gray-200 shadow-xs text-gray-900' : 'bg-transparent border-transparent text-gray-800 hover:bg-gray-50 hover:border-gray-200 hover:shadow-xs hover:text-gray-900'}
              `}
              title="Folders"
            >
              <FolderSimpleIcon size={18} weight="regular" />
            </button>

            {/* Folders Hover Dropdown */}
            <AnimatePresence>
              {isFoldersHovered && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="fixed w-56 max-h-80 bg-white rounded-2xl shadow-lg border border-gray-100 p-1 z-[9999]"
                  style={{
                    top: foldersDropdownPosition.top,
                    left: foldersDropdownPosition.left,
                  }}
                >
                  <div className="px-3 py-2 border-b border-gray-100">
                    <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      Folders
                    </span>
                  </div>
                  <div className="overflow-y-auto max-h-64 py-0.5">
                    {folders.length === 0 && (
                      <div className="px-3 py-3 text-xs text-gray-400 text-center">No folders</div>
                    )}
                    {folders.map((folder) => {
                      const isExpanded = expandedFolderIds.has(folder.id);
                      const folderItemsList =
                        folderItems[folder.id] ??
                        items.filter((item) => item.folderId === folder.id);

                      return (
                        <div key={folder.id}>
                          {/* Folder row */}
                          <div
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors duration-150 cursor-pointer text-gray-900 hover:bg-gray-50"
                            onClick={() => toggleFolderExpansion(folder.id)}
                          >
                            <CaretRightIcon
                              size={12}
                              weight="bold"
                              className={`text-gray-400 flex-shrink-0 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
                            />
                            <FolderSimpleIcon
                              size={14}
                              weight="regular"
                              className="text-gray-800 flex-shrink-0"
                            />
                            <span className="truncate">{folder.label}</span>
                          </div>

                          {/* Folder items (expanded) */}
                          {isExpanded && (
                            <div className="pl-7">
                              {folderItemsList.length === 0 ? (
                                <div className="px-3 py-2 text-xs text-gray-400">No items</div>
                              ) : (
                                folderItemsList.map((item) => (
                                  <div
                                    key={item.id}
                                    className={`
                                      px-3 py-2 rounded-xl text-sm transition-colors duration-150 cursor-pointer
                                      ${item.id === selectedItemId ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-900 hover:bg-gray-50'}
                                    `}
                                    onClick={() => onItemClick?.(item.id)}
                                    title={item.label}
                                  >
                                    <span className="truncate block">{item.label}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chats Icon with Hover Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => onChatsHover(true)}
            onMouseLeave={() => onChatsHover(false)}
          >
            <button
              ref={chatButtonRef}
              className={`
                flex items-center justify-center w-8 h-8
                rounded-lg border cursor-pointer
                transition-all duration-150
                ${isChatsHovered ? 'bg-gray-50 border-gray-200 shadow-xs text-gray-900' : 'bg-transparent border-transparent text-gray-800 hover:bg-gray-50 hover:border-gray-200 hover:shadow-xs hover:text-gray-900'}
              `}
              title="Chats"
            >
              <ChatTextIcon size={18} weight="regular" />
            </button>

            {/* Chats Hover Dropdown */}
            <AnimatePresence>
              {isChatsHovered && items.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="fixed w-56 max-h-80 bg-white rounded-2xl shadow-lg border border-gray-100 p-1 z-[9999]"
                  style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                >
                  <div className="px-3 py-2 border-b border-gray-100">
                    <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      Recent
                    </span>
                  </div>
                  <div className="overflow-y-auto max-h-64 py-0.5">
                    {items.slice(0, 10).map((item) => {
                      const isSelected = item.id === selectedItemId;

                      return (
                        <div
                          key={item.id}
                          className={`
                            px-3 py-2 rounded-xl text-sm
                            transition-colors duration-150 cursor-pointer
                            ${isSelected ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-900 hover:bg-gray-50'}
                          `}
                          onClick={() => onItemClick?.(item.id)}
                          title={item.label}
                        >
                          <span className="truncate block">{item.label}</span>
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
        <div className="mt-auto pt-2 pb-1 border-t border-gray-100">
          <button
            ref={avatarButtonRef}
            onClick={onAvatarClick}
            className="flex items-center justify-center w-8 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
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
