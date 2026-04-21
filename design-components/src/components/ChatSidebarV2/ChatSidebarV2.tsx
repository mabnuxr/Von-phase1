import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SidebarSimpleIcon, PlusCircleIcon, DotsThreeIcon } from '@phosphor-icons/react';
import { TertiaryIconButton, PrimaryIconButton } from '../forms/buttons';
import { ContextMenu, DeleteConfirmationPopup, MoveToFolderModal } from '../popups';
import { ChatSidebarSkeleton } from './ChatSidebarSkeleton';
import {
  ConversationItem,
  FolderList,
  SectionHeader,
  CollapsedSidebar,
  ProfileSection,
} from './components';
import { useChatSidebarState } from './hooks';
import {
  getContextMenuItems,
  getFolderContextMenuItems,
  getDashboardContextMenuItems,
} from './utils';
import { ensureUTC } from '../../utils/ensureUTC';

/**
 * Convert an ISO timestamp (or any Date-parseable string) to a human-readable
 * relative time string like "5 min ago", "2 hours ago", "3 days ago".
 */
function formatRelativeTime(dateStr: string | undefined): string {
  if (!dateStr) return 'Just now';
  const now = Date.now();
  const then = new Date(ensureUTC(dateStr)).getTime();
  if (Number.isNaN(then)) return 'Just now';
  const diffMs = now - then;
  if (diffMs < 0) return 'Just now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

const VON_COMBINATION_MARK_URL =
  'https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/von_combination_mark.svg';

// ============================================================================
// Types
// ============================================================================

export type ItemType = 'chat';
export type ItemStatus = 'idle' | 'running' | 'complete';

/**
 * Approval indicator state for a conversation row.
 * - "pending": awaiting user action → pulsing purple dot
 * - "expired": TTL passed without action → orange→red gradient dot
 * - absent: no indicator
 */
export type ApprovalState = 'pending' | 'expired';

export type ShareAccessType = 'org_wide' | 'restricted';

export interface SidebarItem {
  id: string;
  label: string;
  type: ItemType;
  href?: string;
  /** Folder ID this item belongs to (null for root level) */
  folderId?: string | null;
  /** Status indicator for the item */
  status?: ItemStatus;
  /** Approval indicator state. Absent means no indicator. */
  approvalState?: ApprovalState;
  /** Whether this conversation is shared */
  isShared?: boolean;
  /** How it's shared — drives the icon in the context menu */
  shareAccessType?: ShareAccessType | null;
}

// ============================================================================
// Dashboard Types (modular — can be removed without affecting chat sidebar)
// ============================================================================

export type DashboardItemState = 'draft' | 'published';
export type DashboardItemVisibility = 'private' | 'org';

export interface DashboardSidebarItem {
  id: string;
  label: string;
  state: DashboardItemState;
  visibility: DashboardItemVisibility;
  href?: string;
  isPinned?: boolean;
  isOwner?: boolean;
  lastEdited?: string;
  lastSaved?: string;
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
  onShareItem?: (id: string) => void;
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
  loadMoreRef?: React.Ref<HTMLDivElement | null>;
  isFetchingMore?: boolean;
  onLogoClick?: () => void;
  userName?: string;
  userEmail?: string;
  avatarSrc?: string;
  avatarLabel?: string;
  onSettingsClick?: () => void;

  onSignOutClick?: () => void;
  /** Whether the "New Chat" button should appear in active/selected state */
  isNewChatActive?: boolean;

  // ── Dashboard section (modular — omit all to hide) ──
  /** Dashboard items to show in a "Dashboards" section. Omit to hide the section entirely. */
  dashboards?: DashboardSidebarItem[];
  /** Currently selected dashboard ID */
  selectedDashboardId?: string;
  /** Callback when a dashboard item is clicked */
  onDashboardClick?: (id: string) => void;
  /** Callback to rename a dashboard */
  onRenameDashboard?: (id: string, newName: string) => void;
  /** Whether more dashboards are available to load */
  hasMoreDashboards?: boolean;
  /** Callback to load more dashboards */
  onLoadMoreDashboards?: () => void;
}

// ============================================================================
// Empty State Components
// ============================================================================

const SectionEmptyState: React.FC<{
  message: string;
}> = ({ message }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className="mx-1 my-1 px-3 py-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/50"
  >
    <p className="text-[12px] text-gray-400 leading-tight">{message}</p>
  </motion.div>
);

// ============================================================================
// Dashboard Section (with show more / show less)
// ============================================================================

const MAX_ITEMS_SHOWN = 5;

interface DashboardContextMenuState {
  isOpen: boolean;
  position: { top: number; left: number };
  dashboard: DashboardSidebarItem | null;
}

/** Individual dashboard row — mirrors FolderRow hover/action pattern exactly */
const DashboardRow: React.FC<{
  dash: DashboardSidebarItem;
  isSelected: boolean;
  isEditing: boolean;
  isMenuOpen: boolean;
  onDashboardClick?: (id: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onRenameDashboard?: (id: string, newName: string) => void;
  onCancelEdit: () => void;
}> = ({
  dash,
  isSelected,
  isEditing,
  isMenuOpen,
  onDashboardClick,
  onContextMenu,
  onRenameDashboard,
  onCancelEdit,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [editValue, setEditValue] = useState(dash.label);
  const inputRef = useRef<HTMLInputElement>(null);

  const showDotsButton = (isHovered || isMenuOpen) && !isEditing;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(dash.label);
  }, [dash.label, isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== dash.label) {
      onRenameDashboard?.(dash.id, trimmed);
    }
    onCancelEdit();
  };

  return (
    <div
      className={`
        group relative flex items-center justify-between gap-2.5 px-2 h-8 rounded-xl text-sm text-gray-800 hover:text-gray-900
        transition-colors duration-150 cursor-pointer
        ${
          isSelected
            ? 'shadow-xs bg-gray-50 border border-gray-200 hover:bg-gray-100'
            : 'border border-transparent hover:bg-gray-50 hover:border-gray-200 hover:shadow-xs'
        }
      `}
      onClick={isEditing ? undefined : () => onDashboardClick?.(dash.id)}
      onContextMenu={isEditing || !dash.isOwner ? undefined : onContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={dash.label}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onCancelEdit();
              }
            }}
            onBlur={handleSave}
            className="flex-1 text-sm text-gray-900 bg-white border border-gray-200 rounded-md px-1.5 py-0.5 outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-left truncate min-w-0">{dash.label}</span>
        )}
      </div>

      {!isEditing && showDotsButton && (
        <div className="flex items-center gap-0.5 flex-shrink-0 h-6">
          <PrimaryIconButton
            icon={<DotsThreeIcon size={16} weight="bold" />}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              onContextMenu(e);
            }}
            visible={true}
            size="small"
          />
        </div>
      )}
    </div>
  );
};

const DashboardSection: React.FC<{
  dashboards: DashboardSidebarItem[];
  selectedDashboardId?: string;
  onDashboardClick?: (id: string) => void;
  onRenameDashboard?: (id: string, newName: string) => void;
  hasMoreDashboards?: boolean;
  onLoadMoreDashboards?: () => void;
}> = ({
  dashboards,
  selectedDashboardId,
  onDashboardClick,
  onRenameDashboard,
  hasMoreDashboards,
  onLoadMoreDashboards,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<DashboardContextMenuState>({
    isOpen: false,
    position: { top: 0, left: 0 },
    dashboard: null,
  });

  const handleOpenContextMenu = (e: React.MouseEvent, dash: DashboardSidebarItem) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({
      isOpen: true,
      position: { top: rect.bottom + 4, left: rect.left },
      dashboard: dash,
    });
  };

  return (
    <div className="mb-3">
      <SectionHeader label="Dashboards" />
      <div>
        {dashboards.map((dash) => (
          <DashboardRow
            key={dash.id}
            dash={dash}
            isSelected={dash.id === selectedDashboardId}
            isEditing={editingId === dash.id}
            isMenuOpen={contextMenu.isOpen && contextMenu.dashboard?.id === dash.id}
            onDashboardClick={onDashboardClick}
            onContextMenu={(e) => handleOpenContextMenu(e, dash)}
            onRenameDashboard={onRenameDashboard}
            onCancelEdit={() => setEditingId(null)}
          />
        ))}
        {hasMoreDashboards && (
          <button
            onClick={onLoadMoreDashboards}
            className="w-full px-2 py-1 text-sm text-gray-800 hover:text-gray-900 transition-colors text-left cursor-pointer"
          >
            Show more
          </button>
        )}
      </div>

      {/* Dashboard Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        items={getDashboardContextMenuItems({ isOwner: contextMenu.dashboard?.isOwner })}
        fixedPosition={contextMenu.position}
        width={180}
        onItemClick={(menuItem) => {
          const dash = contextMenu.dashboard;
          if (!dash) return;
          if (menuItem.id === 'rename' && dash.isOwner) {
            setEditingId(dash.id);
          }
          setContextMenu((prev) => ({ ...prev, isOpen: false }));
        }}
        footer={
          contextMenu.dashboard && (
            <div className="text-xs text-gray-700 flex flex-col gap-0.5">
              <span>
                {contextMenu.dashboard.state === 'published' ? 'Published' : 'Draft'} · Edited{' '}
                {formatRelativeTime(contextMenu.dashboard.lastEdited)}
              </span>
              <span>Saved · {formatRelativeTime(contextMenu.dashboard.lastSaved)}</span>
            </div>
          )
        }
      />
    </div>
  );
};

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
  onShareItem,
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
  onLogoClick,
  userName,
  userEmail,
  avatarSrc,
  avatarLabel,
  onSettingsClick,
  onSignOutClick,
  isNewChatActive = false,
  dashboards,
  selectedDashboardId,
  onDashboardClick,
  onRenameDashboard,
  hasMoreDashboards,
  onLoadMoreDashboards,
}) => {
  // Use the sidebar state hook
  const {
    // State
    contextMenu,
    editingItemId,
    editingItemFolderId,
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
    isDashboardsHovered,
    dashboardsDropdownPosition,

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
    dashboardsButtonRef,
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
    handleDashboardsHover,
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

  // Show more / show less state for folders
  const [showAllFolders, setShowAllFolders] = useState(false);
  const hasMoreFolders = sortedFolders.length > MAX_ITEMS_SHOWN;

  const visibleFolders = useMemo(() => {
    if (showAllFolders || !hasMoreFolders) return sortedFolders;
    return sortedFolders.slice(0, MAX_ITEMS_SHOWN);
  }, [sortedFolders, showAllFolders, hasMoreFolders]);

  // Single summary dot for the collapsed Chats icon. Pending beats expired —
  // any actionable approval should win over a passive "overdue" hint.
  const summaryApprovalState: ApprovalState | undefined = useMemo(() => {
    const all = [...items, ...Object.values(folderItems).flat()];
    if (all.some((i) => i.approvalState === 'pending')) return 'pending';
    if (all.some((i) => i.approvalState === 'expired')) return 'expired';
    return undefined;
  }, [items, folderItems]);

  // ============================================================================
  // Render: Stacked layers for smooth collapse/expand animation
  // ============================================================================
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Base layer: Collapsed sidebar — always rendered, always visible */}
      <div
        className="absolute top-0 bottom-0 left-0 w-12"
        style={{ pointerEvents: isCollapsed ? 'auto' : 'none' }}
      >
        <CollapsedSidebar
          items={items}
          folders={folders}
          folderItems={folderItems}
          folderLoadingMap={folderLoadingMap}
          selectedItemId={selectedItemId}
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
          onNewChatClick={onNewChatClick}
          onItemClick={onItemClick}
          onFolderToggle={onFolderToggle}
          isChatsHovered={isChatsHovered}
          dropdownPosition={dropdownPosition}
          chatButtonRef={chatButtonRef}
          onChatsHover={handleChatsHover}
          isFoldersHovered={isFoldersHovered}
          foldersDropdownPosition={foldersDropdownPosition}
          foldersButtonRef={foldersButtonRef}
          onFoldersHover={handleFoldersHover}
          dashboards={dashboards}
          selectedDashboardId={selectedDashboardId}
          onDashboardClick={onDashboardClick}
          isDashboardsHovered={isDashboardsHovered}
          dashboardsDropdownPosition={dashboardsDropdownPosition}
          dashboardsButtonRef={dashboardsButtonRef}
          onDashboardsHover={handleDashboardsHover}
          userName={userName}
          userEmail={userEmail}
          avatarSrc={avatarSrc}
          avatarLabel={avatarLabel}
          isProfileOpen={isProfileOpen}
          popoverPosition={popoverPosition}
          avatarButtonRef={avatarButtonRef}
          onAvatarClick={handleAvatarClick}
          onCloseProfile={handleCloseProfile}
          onSettingsClick={onSettingsClick}
          onSignOutClick={onSignOutClick}
          isNewChatActive={isNewChatActive}
          sortedFolders={sortedFolders}
          itemsByFolder={itemsByFolder}
          summaryApprovalState={summaryApprovalState}
        />
      </div>

      {/* Overlay layer: Expanded content — fades in/out */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            key="expanded"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 bottom-0 left-0 w-60 bg-white rounded-xl border border-gray-100 shadow-xs"
          >
            <div className="relative pl-2 py-3 h-full w-full bg-transparent flex text-sm flex-col overflow-hidden antialiased font-sf">
              {/* Logo Row */}
              <div className="flex items-center justify-between mb-3 px-2 pr-4">
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
              <div className="mt-2 mb-3 pr-2">
                <button
                  className={`flex items-center gap-1.5 px-1.5 h-8 w-full rounded-xl text-sm text-gray-900 border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isNewChatActive
                      ? 'bg-gray-50 border-gray-200 shadow-xs'
                      : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200 hover:shadow-xs'
                  }`}
                  onClick={onNewChatClick}
                  type="button"
                >
                  <PlusCircleIcon size={20} weight="fill" className="flex-shrink-0 text-gray-600" />
                  <span className="whitespace-nowrap">New Chat</span>
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pr-2 settings-scrollbar">
                {/* Loading Skeleton */}
                {isLoading && <ChatSidebarSkeleton />}

                {/* Folders Section */}
                {!isLoading && (
                  <div className="mb-3">
                    <SectionHeader label="Folders" />
                    <div>
                      <FolderList
                        sortedFolders={visibleFolders}
                        itemsByFolder={itemsByFolder}
                        folderLoadingMap={folderLoadingMap}
                        selectedItemId={selectedItemId}
                        isCreatingFolder={isCreatingFolder}
                        newFolderName={newFolderName}
                        onNewFolderNameChange={setNewFolderName}
                        newFolderInputRef={newFolderInputRef}
                        onStartFolderCreation={handleStartFolderCreation}
                        onConfirmFolderCreation={handleConfirmFolderCreation}
                        onCancelFolderCreation={handleCancelFolderCreation}
                        editingFolderId={editingFolderId}
                        folderContextMenu={folderContextMenu}
                        onFolderToggle={onFolderToggle}
                        onFolderContextMenu={handleFolderContextMenu}
                        onPinFolder={handlePinFolder}
                        onSaveFolderRename={handleSaveFolderRename}
                        onCancelFolderRename={handleCancelFolderRename}
                        editingItemId={editingItemId}
                        editingItemFolderId={editingItemFolderId}
                        contextMenu={contextMenu}
                        onItemClick={onItemClick}
                        onItemContextMenu={handleContextMenu}
                        onSaveRename={handleSaveRename}
                        onCancelRename={handleCancelRename}
                      />
                      {hasMoreFolders && (
                        <button
                          onClick={() => setShowAllFolders((prev) => !prev)}
                          className="w-full px-2 py-1 text-sm text-gray-800 hover:text-gray-900 transition-colors text-left cursor-pointer"
                        >
                          {showAllFolders ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Dashboards Section (modular — only renders when dashboards prop is provided) */}
                {!isLoading && dashboards && (
                  <>
                    {dashboards.length > 0 ? (
                      <DashboardSection
                        dashboards={dashboards}
                        selectedDashboardId={selectedDashboardId}
                        onDashboardClick={onDashboardClick}
                        onRenameDashboard={onRenameDashboard}
                        hasMoreDashboards={hasMoreDashboards}
                        onLoadMoreDashboards={onLoadMoreDashboards}
                      />
                    ) : (
                      <div className="mb-3">
                        <SectionHeader label="Dashboards" />
                        <SectionEmptyState message="No dashboards yet. Chat with Von to create one." />
                      </div>
                    )}
                  </>
                )}

                {/* Chats Section (root items not in folders) */}
                {!isLoading && (
                  <div className="mb-2">
                    <SectionHeader label="Chats" />
                    {rootItems.length > 0 ? (
                      <div>
                        {rootItems.map((item) => (
                          <ConversationItem
                            key={item.id}
                            item={item}
                            isSelected={item.id === selectedItemId}
                            onClick={() => onItemClick?.(item.id)}
                            onContextMenu={(e) => handleContextMenu(e, item)}
                            isMenuOpen={contextMenu.isOpen && contextMenu.item?.id === item.id}
                            isEditing={editingItemId === item.id && editingItemFolderId === null}
                            onSaveEdit={(newName) => handleSaveRename(item, newName)}
                            onCancelEdit={handleCancelRename}
                          />
                        ))}
                      </div>
                    ) : (
                      <SectionEmptyState message="No conversations yet. Start a new chat to get going." />
                    )}
                  </div>
                )}

                {/* Infinite scroll trigger */}
                {loadMoreRef && <div ref={loadMoreRef} className="h-px flex-shrink-0" />}
              </div>

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
                onSettingsClick={onSettingsClick}
                onSignOutClick={onSignOutClick}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shared overlays — rendered outside collapsed/expanded wrappers so they work in both states */}

      {/* Context Menu (for items) */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        onClose={handleCloseContextMenu}
        items={getContextMenuItems({
          isInFolder: !!contextMenu.item?.folderId,
          enableShare: !!onShareItem,
          isShared: contextMenu.item?.isShared,
          shareAccessType: contextMenu.item?.shareAccessType,
        })}
        fixedPosition={contextMenu.position}
        width={160}
        onItemClick={(menuItem) => {
          if (menuItem.id === 'rename' && contextMenu.item) {
            handleStartRename(contextMenu.item);
          } else if (menuItem.id === 'move' && contextMenu.item) {
            handleShowMoveToFolder(contextMenu.item);
          } else if (menuItem.id === 'share' && contextMenu.item) {
            onShareItem?.(contextMenu.item.id);
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
