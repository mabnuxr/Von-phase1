import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatTextIcon,
  SidebarSimpleIcon,
  PlusCircleIcon,
  FolderSimpleIcon,
} from '@phosphor-icons/react';
import { TertiaryIconButton } from '../../forms/buttons';
import { ProfilePopover } from '../../popups';
import { FolderList } from './FolderList';
import type { SidebarItem, Folder, FolderItemsMap, FolderLoadingMap } from '../ChatSidebarV2';
import type { PopoverPosition } from '../hooks';

export interface CollapsedSidebarProps {
  items: SidebarItem[];
  folders?: Folder[];
  folderItems?: FolderItemsMap;
  folderLoadingMap?: FolderLoadingMap;
  selectedItemId?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNewChatClick?: () => void;
  onItemClick?: (id: string) => void;
  onFolderToggle?: (folderId: string, isExpanded: boolean) => void;

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
  onSettingsClick?: () => void;

  onSignOutClick?: () => void;
  /** Whether the "New Chat" button should appear in active/selected state */
  isNewChatActive?: boolean;

  // Folder data (derived, for the FolderList)
  sortedFolders: Folder[];
  itemsByFolder: Record<string, SidebarItem[]>;
}

/**
 * CollapsedSidebar - The collapsed state of the sidebar
 *
 * Features:
 * - Expand button
 * - New chat button (PlusCircleIcon)
 * - Chats icon with hover dropdown showing recent items
 * - Folders icon with hover dropdown showing folders (minimal / read-only)
 * - User profile avatar with popover
 */
export const CollapsedSidebar: React.FC<CollapsedSidebarProps> = ({
  items,
  folderLoadingMap = {},
  selectedItemId,
  isCollapsed,
  onToggleCollapse,
  onNewChatClick,
  onItemClick,
  onFolderToggle,
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
  onSettingsClick,
  onSignOutClick,
  isNewChatActive = false,
  sortedFolders,
  itemsByFolder,
}) => {
  return (
    <div className="px-2 py-3 h-full w-full bg-white rounded-xl border border-gray-100 shadow-xs flex text-sm flex-col antialiased font-sf">
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
            className={`flex items-center justify-center w-8 h-8 rounded-lg border cursor-pointer transition-all duration-150 ${
              isNewChatActive
                ? 'bg-gray-50 border-gray-200 shadow-xs'
                : 'border-transparent hover:bg-gray-50 hover:border-gray-200 hover:shadow-xs'
            }`}
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

            {/* Folders Hover Dropdown — minimal / read-only */}
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
                    <FolderList
                      minimal
                      showEmptyState
                      sortedFolders={sortedFolders}
                      itemsByFolder={itemsByFolder}
                      folderLoadingMap={folderLoadingMap}
                      selectedItemId={selectedItemId}
                      onFolderToggle={onFolderToggle}
                      onItemClick={onItemClick}
                    />
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

      {/* Profile Popover — only render when collapsed to avoid duplicate with ProfileSection's popover */}
      {isCollapsed && (
        <ProfilePopover
          isOpen={isProfileOpen}
          onClose={onCloseProfile}
          userEmail={userEmail}
          position={popoverPosition}
          onSettingsClick={onSettingsClick}
          onSignOutClick={onSignOutClick}
        />
      )}
    </div>
  );
};

export default CollapsedSidebar;
