import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SidebarSimpleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowsInLineVerticalIcon,
} from '@phosphor-icons/react';
import { PrimaryButton, SecondaryIconButton, TertiaryIconButton } from '../forms/buttons';
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

export interface SidebarItem {
  id: string;
  label: string;
  type: ItemType;
  href?: string;
  /** Folder ID this item belongs to (null for root level) */
  folderId?: string | null;
}

export interface Folder {
  id: string;
  label: string;
  /** Whether folder is expanded */
  isExpanded?: boolean;
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
  onNewChatFolderClick?: () => void;
  newlyCreatedFolderId?: string | null;
  onRenameItem?: (id: string, newName: string) => void;
  onDeleteItem?: (id: string) => void;
  onMoveItemToFolder?: (itemId: string, folderId: string) => void;
  onCreateFolderAndMoveItem?: (itemId: string, newFolderName: string) => void;
  onRemoveItemFromFolder?: (itemId: string) => void;
  onFolderToggle?: (folderId: string, isExpanded: boolean) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onSearchChange?: (value: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  loadMoreRef?: React.RefObject<HTMLDivElement | null>;
  isFetchingMore?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  onCollapseAllClick?: () => void;
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
 * Supports rename, delete, and move operations via context menu.
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
  newlyCreatedFolderId,
  onRenameItem,
  onDeleteItem,
  onMoveItemToFolder,
  onCreateFolderAndMoveItem,
  onRemoveItemFromFolder,
  onFolderToggle,
  onRenameFolder,
  onDeleteFolder,
  isCollapsed = false,
  onToggleCollapse,
  loadMoreRef,
  isFetchingMore = false,
  hasNextPage = false,
  onLoadMore,
  onCollapseAllClick,
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
    searchValue,
    setSearchValue,
    isChatsExpanded,
    setIsChatsExpanded,
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

    // Refs
    chatButtonRef,
    avatarButtonRef,

    // Derived state
    rootItems,
    itemsByFolder,
    totalChats,
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

    // Move handlers
    handleShowMoveToFolder,
    handleConfirmMoveToFolder,
    handleCancelMoveToFolder,
    handleRemoveFromFolder,

    // UI handlers
    handleCollapseAll,
    handleChatsHover,
    handleAvatarClick,
    handleCloseProfile,
  } = useChatSidebarState({
    items,
    folders,
    folderItems,
    newlyCreatedFolderId,
    onRenameItem,
    onDeleteItem,
    onRenameFolder,
    onDeleteFolder,
    onFolderToggle,
    onCollapseAllClick,
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
        selectedItemId={selectedItemId}
        onToggleCollapse={onToggleCollapse}
        onNewChatClick={onNewChatClick}
        onItemClick={onItemClick}
        isChatsHovered={isChatsHovered}
        dropdownPosition={dropdownPosition}
        chatButtonRef={chatButtonRef}
        onChatsHover={handleChatsHover}
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
    <div className="relative px-2 py-3 h-full w-full bg-transparent flex text-[13px] flex-col overflow-hidden antialiased font-sf">
      {/* Logo Row */}
      <div className="flex items-center justify-between mb-3 px-1">
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

      {/* Search with Collapse All button */}
      <div className="mb-2 px-1 flex items-center gap-1.5">
        <div className="flex-1 flex items-center gap-1.5 px-2 py-1.25 bg-white rounded-lg border border-gray-100 focus-within:border-gray-200 focus-within:ring-1 focus-within:ring-gray-100 transition-colors">
          <MagnifyingGlassIcon size={14} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-none text-[13px] text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <SecondaryIconButton
          icon={<ArrowsInLineVerticalIcon size={14} weight="regular" className="text-gray-600" />}
          onClick={handleCollapseAll}
        />
      </div>

      {/* New Chat Button */}
      <div className="my-2 px-1 flex flex-col gap-1.5">
        <PrimaryButton
          onClick={onNewChatClick}
          className="w-full flex items-center justify-center gap-1.5"
        >
          <PlusIcon size={14} weight="bold" />
          New Chat
        </PrimaryButton>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-1">
        {/* Loading Skeleton */}
        {isLoading && <ChatSidebarSkeleton />}

        {/* Chats Section (with folders inside) */}
        {!isLoading && (
          <div className="mb-1">
            <SectionHeader
              label="Chats"
              isExpanded={isChatsExpanded}
              onToggle={() => setIsChatsExpanded(!isChatsExpanded)}
              onAdd={onNewChatFolderClick}
              addButtonLabel="Add Folder"
              count={totalChats}
            />
            <AnimatePresence>
              {isChatsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden pl-1.5 ml-2.5 border-l border-dashed border-gray-200"
                >
                  {/* Chat Folders */}
                  {folders.map((folder) => {
                    const folderItemsList = itemsByFolder[folder.id] || [];
                    const isFolderLoading = folderLoadingMap[folder.id] || false;
                    if (folderItemsList.length === 0 && searchValue && !isFolderLoading)
                      return null;

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

                  {/* Root Chats (not in folders) */}
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

                  {/* Empty state for chats */}
                  {totalChats === 0 && !searchValue && (
                    <div className="py-3 text-center">
                      <p className="text-[12px] text-gray-400">No chats yet</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Infinite scroll trigger */}
        {loadMoreRef && <div ref={loadMoreRef} className="h-px" />}
      </div>

      {/* More Content Indicator */}
      {hasNextPage && !isFetchingMore && (
        <motion.div
          className="flex items-center justify-center py-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button
            className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
            onClick={onLoadMore}
          >
            Load more
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
        items={getFolderContextMenuItems()}
        fixedPosition={folderContextMenu.position}
        width={128}
        onItemClick={(menuItem) => {
          if (menuItem.id === 'rename' && folderContextMenu.folder) {
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
        folders={getAvailableFoldersForMove()}
        currentFolderId={moveToFolderModal.item?.folderId}
        onConfirm={handleConfirmMoveToFolder}
        onCancel={handleCancelMoveToFolder}
      />
    </div>
  );
};

export default ChatSidebar;
