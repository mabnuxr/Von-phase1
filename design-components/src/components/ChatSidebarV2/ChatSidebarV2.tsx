import React from 'react';
import { motion } from 'framer-motion';
import {
  SidebarSimpleIcon,
  PlusCircleIcon,
  FolderPlusIcon,
  FolderSimpleIcon,
  CheckIcon,
  XIcon,
} from '@phosphor-icons/react';
import { TertiaryIconButton } from '../forms/buttons';
import { ContextMenu, DeleteConfirmationPopup, MoveToFolderModal } from '../popups';
import { ChatSidebarSkeleton } from './ChatSidebarSkeleton';
import {
  ConversationItem,
  FolderRow,
  FolderContents,
  SectionHeader,
  CollapsedSidebar,
  ProfileSection,
} from './components';
import { useChatSidebarState } from './hooks';
import { getContextMenuItems, getFolderContextMenuItems } from './utils';

const VON_COMBINATION_MARK_URL =
  'https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/von_combination_mark.svg';

// ============================================================================
// Types
// ============================================================================

export type ItemType = 'chat';
export type ItemStatus = 'idle' | 'running' | 'complete';

export interface SidebarItem {
  id: string;
  label: string;
  type: ItemType;
  href?: string;
  /** Folder ID this item belongs to (null for root level) */
  folderId?: string | null;
  /** Status indicator for the item */
  status?: ItemStatus;
}

export interface Folder {
  id: string;
  label: string;
  /** Whether folder is expanded */
  isExpanded?: boolean;
  /** Whether folder is pinned */
  isPinned?: boolean;
  /** Display order for sorting (0 = pinned, 100 = default) */
  displayOrder?: number;
}

/**
 * Map of folder ID to items within that folder
 */
export type FolderItemsMap = Record<string, SidebarItem[]>;

/**
 * Map of folder ID to loading state
 */
export type FolderLoadingMap = Record<string, boolean>;

export interface ChatSidebarProps {
  items?: SidebarItem[];
  folders?: Folder[];
  folderItems?: FolderItemsMap;
  folderLoadingMap?: FolderLoadingMap;
  isLoading?: boolean;
  selectedItemId?: string;
  onItemClick?: (id: string) => void;
  onNewChatClick?: () => void;
  onNewChatFolderClick?: (folderName: string) => void;
  onRenameItem?: (id: string, newName: string) => void;
  onDeleteItem?: (id: string) => void;
  onMoveItemToFolder?: (itemId: string, folderId: string) => void;
  onCreateFolderAndMoveItem?: (itemId: string, newFolderName: string) => void;
  onRemoveItemFromFolder?: (itemId: string) => void;
  onFolderToggle?: (folderId: string, isExpanded: boolean) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onPinFolder?: (folderId: string, isPinned: boolean) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  loadMoreRef?: React.RefObject<HTMLDivElement | null>;
  isFetchingMore?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  onLogoClick?: () => void;
  userName?: string;
  userEmail?: string;
  avatarSrc?: string;
  avatarLabel?: string;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onHelpClick?: () => void;
  onSignOutClick?: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ChatSidebar - Left sidebar for chats
 *
 * Displays a hierarchical list of chats organized in folders.
 * Supports rename, delete, move, pin operations via context menu.
 * Folders section with inline creation, "See more" pagination.
 */
export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  items = [],
  folders = [],
  folderItems = {},
  folderLoadingMap = {},
  isLoading = false,
  selectedItemId,
  onItemClick,
  onNewChatClick,
  onNewChatFolderClick,
  onRenameItem,
  onDeleteItem,
  onMoveItemToFolder,
  onCreateFolderAndMoveItem,
  onRemoveItemFromFolder,
  onFolderToggle,
  onRenameFolder,
  onDeleteFolder,
  onPinFolder,
  isCollapsed = false,
  onToggleCollapse,
  loadMoreRef,
  isFetchingMore = false,
  hasNextPage = false,
  onLoadMore,
  onLogoClick,
  userName,
  userEmail,
  avatarSrc,
  avatarLabel,
  onProfileClick,
  onSettingsClick,
  onHelpClick,
  onSignOutClick,
}) => {
  // Use the sidebar state hook
  const {
    // State
    contextMenu,
    editingItemId,
    deleteConfirmation,
    folderContextMenu,
    editingFolderId,
    folderDeleteConfirmation,
    moveToFolderModal,
    isProfileOpen,
    popoverPosition,
    isChatsHovered,
    dropdownPosition,
    isFoldersHovered,
    foldersDropdownPosition,

    // Inline folder creation
    isCreatingFolder,
    newFolderName,
    setNewFolderName,
    newFolderInputRef,
    handleStartFolderCreation,
    handleConfirmFolderCreation,
    handleCancelFolderCreation,

    // Refs
    chatButtonRef,
    foldersButtonRef,
    avatarButtonRef,

    // Derived state
    rootItems,
    itemsByFolder,
    sortedFolders,
    getAvailableFoldersForMove,

    // Item handlers
    handleContextMenu,
    handleCloseContextMenu,
    handleStartRename,
    handleSaveRename,
    handleCancelRename,
    handleShowDeleteConfirmation,
    handleConfirmDelete,
    handleCancelDelete,

    // Folder handlers
    handleFolderContextMenu,
    handleCloseFolderContextMenu,
    handleStartFolderRename,
    handleSaveFolderRename,
    handleCancelFolderRename,
    handleShowFolderDeleteConfirmation,
    handleConfirmFolderDelete,
    handleCancelFolderDelete,
    handlePinFolder,

    // Move handlers
    handleShowMoveToFolder,
    handleConfirmMoveToFolder,
    handleCancelMoveToFolder,
    handleRemoveFromFolder,

    // UI handlers
    handleChatsHover,
    handleFoldersHover,
    handleAvatarClick,
    handleCloseProfile,
  } = useChatSidebarState({
    items,
    folders,
    folderItems,
    onRenameItem,
    onDeleteItem,
    onRenameFolder,
    onDeleteFolder,
    onPinFolder,
    onFolderToggle,
    onNewChatFolderClick,
    onMoveItemToFolder,
    onCreateFolderAndMoveItem,
    onRemoveItemFromFolder,
  });

  // ============================================================================
  // Collapsed State
  // ============================================================================
  if (isCollapsed) {
    return (
      <CollapsedSidebar
        items={items}
        folders={folders}
        folderItems={folderItems}
        selectedItemId={selectedItemId}
        onToggleCollapse={onToggleCollapse}
        onNewChatClick={onNewChatClick}
        onItemClick={onItemClick}
        isChatsHovered={isChatsHovered}
        dropdownPosition={dropdownPosition}
        chatButtonRef={chatButtonRef}
        onChatsHover={handleChatsHover}
        isFoldersHovered={isFoldersHovered}
        foldersDropdownPosition={foldersDropdownPosition}
        foldersButtonRef={foldersButtonRef}
        onFoldersHover={handleFoldersHover}
        userName={userName}
        userEmail={userEmail}
        avatarSrc={avatarSrc}
        avatarLabel={avatarLabel}
        isProfileOpen={isProfileOpen}
        popoverPosition={popoverPosition}
        avatarButtonRef={avatarButtonRef}
        onAvatarClick={handleAvatarClick}
        onCloseProfile={handleCloseProfile}
        onProfileClick={onProfileClick}
        onSettingsClick={onSettingsClick}
        onHelpClick={onHelpClick}
        onSignOutClick={onSignOutClick}
      />
    );
  }

  // ============================================================================
  // Expanded State
  // ============================================================================
  return (
    <div className="relative px-2 py-3 h-full w-full bg-transparent flex text-sm flex-col overflow-hidden antialiased font-sf">
      {/* Logo Row */}
      <div className="flex items-center justify-between mb-3 px-2">
        <img
          src={VON_COMBINATION_MARK_URL}
          alt="Von logo"
          width={64}
          height={24}
          style={{ cursor: onLogoClick ? 'pointer' : 'default' }}
          onClick={onLogoClick}
        />
        <TertiaryIconButton
          icon={<SidebarSimpleIcon size={16} weight="regular" className="text-gray-800" />}
          onClick={onToggleCollapse}
          title="Collapse sidebar"
        />
      </div>

      {/* New Chat Button */}
      <div className="mt-2 mb-3">
        <div
          className="flex items-center gap-1.5 px-1.5 h-8 rounded-xl text-sm text-gray-900 bg-white border border-transparent hover:bg-gray-50 hover:border-gray-200 hover:shadow-xs transition-colors cursor-pointer"
          onClick={onNewChatClick}
        >
          <PlusCircleIcon size={20} weight="fill" className="flex-shrink-0 text-gray-600" />
          <span className="whitespace-nowrap">New Chat</span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {/* Loading Skeleton */}
        {isLoading && <ChatSidebarSkeleton />}

        {/* Folders Section */}
        {!isLoading && (
          <div className="mb-3">
            <SectionHeader label="Folders" />
            <div>
              {/* "New Folder" button - always visible at the top */}
              <div
                className="flex items-center gap-1.5 px-2 h-8 rounded-xl text-sm text-gray-900 border border-transparent hover:bg-gray-50 hover:border-gray-200 hover:shadow-xs transition-colors cursor-pointer"
                onClick={handleStartFolderCreation}
              >
                <FolderPlusIcon size={18} weight="regular" className="flex-shrink-0" />
                <span>New folder</span>
              </div>

              {/* Inline new folder input */}
              {isCreatingFolder && (
                <div className="flex items-center gap-2 px-2 h-8 rounded-xl bg-gray-50">
                  <FolderSimpleIcon
                    size={16}
                    weight="regular"
                    className="text-gray-800 flex-shrink-0"
                  />
                  <input
                    ref={newFolderInputRef}
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleConfirmFolderCreation();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        handleCancelFolderCreation();
                      }
                    }}
                    onBlur={handleCancelFolderCreation}
                    placeholder="Folder name..."
                    className="flex-1 text-sm text-gray-900 bg-white border border-gray-200 rounded-md px-1.5 py-0.5 outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200"
                  />
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleConfirmFolderCreation}
                    className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-emerald-50 transition-colors cursor-pointer"
                    title="Create folder"
                  >
                    <CheckIcon size={14} weight="bold" className="text-emerald-600" />
                  </button>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleCancelFolderCreation}
                    className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                    title="Discard"
                  >
                    <XIcon size={14} weight="bold" className="text-gray-400" />
                  </button>
                </div>
              )}

              {/* Folder rows */}
              {sortedFolders.map((folder) => {
                const folderItemsList = itemsByFolder[folder.id] || [];
                const isFolderLoading = folderLoadingMap[folder.id] || false;
                return (
                  <div key={folder.id} className="mb-1">
                    <FolderRow
                      folder={folder}
                      isEditing={editingFolderId === folder.id}
                      isMenuOpen={
                        folderContextMenu.isOpen && folderContextMenu.folder?.id === folder.id
                      }
                      onClick={() => onFolderToggle?.(folder.id, !folder.isExpanded)}
                      onContextMenu={(e) => handleFolderContextMenu(e, folder)}
                      onPinFolder={() => handlePinFolder(folder)}
                      onSaveEdit={(newName) => handleSaveFolderRename(folder, newName)}
                      onCancelEdit={handleCancelFolderRename}
                    />
                    <FolderContents
                      isExpanded={folder.isExpanded ?? false}
                      isLoading={isFolderLoading}
                      items={folderItemsList}
                      selectedItemId={selectedItemId}
                      menuOpenItemId={contextMenu.isOpen ? contextMenu.item?.id : null}
                      editingItemId={editingItemId}
                      onItemClick={(id) => onItemClick?.(id)}
                      onItemContextMenu={handleContextMenu}
                      onSaveEdit={handleSaveRename}
                      onCancelEdit={handleCancelRename}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chats Section (root items not in folders) */}
        {!isLoading && rootItems.length > 0 && (
          <div className="mb-2">
            <SectionHeader label="Chats" />
            <div>
              {rootItems.map((item) => (
                <ConversationItem
                  key={item.id}
                  item={item}
                  isSelected={item.id === selectedItemId}
                  onClick={() => onItemClick?.(item.id)}
                  onContextMenu={(e) => handleContextMenu(e, item)}
                  isMenuOpen={contextMenu.isOpen && contextMenu.item?.id === item.id}
                  isEditing={editingItemId === item.id}
                  onSaveEdit={(newName) => handleSaveRename(item, newName)}
                  onCancelEdit={handleCancelRename}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && rootItems.length === 0 && sortedFolders.length === 0 && (
          <div className="py-3 text-center">
            <p className="text-[12px] text-gray-400">No chats yet</p>
          </div>
        )}

        {/* Infinite scroll trigger */}
        {loadMoreRef && <div ref={loadMoreRef} className="h-px flex-shrink-0" />}
      </div>

      {/* More Content Indicator */}
      {hasNextPage && !isFetchingMore && (
        <motion.div
          className="flex items-center justify-start py-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-800/80 hover:text-gray-900 transition-colors cursor-pointer"
            onClick={onLoadMore}
          >
            See more
          </button>
        </motion.div>
      )}

      {/* Loading indicator */}
      {isFetchingMore && (
        <div className="flex items-center justify-center py-1.5">
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-gray-400"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      )}

      {/* User Profile Section */}
      <ProfileSection
        userName={userName}
        userEmail={userEmail}
        avatarSrc={avatarSrc}
        avatarLabel={avatarLabel}
        isProfileOpen={isProfileOpen}
        popoverPosition={popoverPosition}
        avatarButtonRef={avatarButtonRef}
        onAvatarClick={handleAvatarClick}
        onCloseProfile={handleCloseProfile}
        onProfileClick={onProfileClick}
        onSettingsClick={onSettingsClick}
        onHelpClick={onHelpClick}
        onSignOutClick={onSignOutClick}
      />

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        onClose={handleCloseContextMenu}
        items={getContextMenuItems({ isInFolder: !!contextMenu.item?.folderId })}
        fixedPosition={contextMenu.position}
        width={160}
        onItemClick={(menuItem) => {
          if (menuItem.id === 'rename' && contextMenu.item) {
            handleStartRename(contextMenu.item);
          } else if (menuItem.id === 'move' && contextMenu.item) {
            handleShowMoveToFolder(contextMenu.item);
          } else if (menuItem.id === 'remove-from-folder' && contextMenu.item) {
            handleRemoveFromFolder(contextMenu.item);
          } else if (menuItem.id === 'delete' && contextMenu.item) {
            handleShowDeleteConfirmation(contextMenu.item);
          }
          handleCloseContextMenu();
        }}
      />

      {/* Delete Confirmation Popup (for items) */}
      <DeleteConfirmationPopup
        isOpen={deleteConfirmation.isOpen}
        itemLabel={deleteConfirmation.item?.label || ''}
        itemType={deleteConfirmation.item?.type || 'chat'}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Folder Context Menu */}
      <ContextMenu
        isOpen={folderContextMenu.isOpen}
        onClose={handleCloseFolderContextMenu}
        items={getFolderContextMenuItems({ isPinned: folderContextMenu.folder?.isPinned })}
        fixedPosition={folderContextMenu.position}
        width={128}
        onItemClick={(menuItem) => {
          if (menuItem.id === 'pin' && folderContextMenu.folder) {
            handlePinFolder(folderContextMenu.folder);
          } else if (menuItem.id === 'rename' && folderContextMenu.folder) {
            handleStartFolderRename(folderContextMenu.folder);
          } else if (menuItem.id === 'delete' && folderContextMenu.folder) {
            handleShowFolderDeleteConfirmation(folderContextMenu.folder);
          }
          handleCloseFolderContextMenu();
        }}
      />

      {/* Delete Confirmation Popup (for folders) */}
      <DeleteConfirmationPopup
        isOpen={folderDeleteConfirmation.isOpen}
        itemLabel={folderDeleteConfirmation.folder?.label || ''}
        itemType="folder"
        onConfirm={handleConfirmFolderDelete}
        onCancel={handleCancelFolderDelete}
      />

      {/* Move to Folder Modal */}
      <MoveToFolderModal
        isOpen={moveToFolderModal.isOpen}
        itemName={moveToFolderModal.item?.label || ''}
        itemType="chat"
        folders={getAvailableFoldersForMove()}
        currentFolderId={moveToFolderModal.item?.folderId}
        onConfirm={handleConfirmMoveToFolder}
        onCancel={handleCancelMoveToFolder}
      />
    </div>
  );
};

export default ChatSidebar;
