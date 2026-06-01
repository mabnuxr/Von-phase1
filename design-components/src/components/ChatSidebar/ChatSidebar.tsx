import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SidebarSimpleIcon,
  PlusCircleIcon,
  DotsThreeIcon,
  MagnifyingGlassIcon,
} from '@phosphor-icons/react';
import { TertiaryIconButton, PrimaryIconButton } from '../forms/buttons';
import { ContextMenu, DeleteConfirmationPopup, MoveToFolderModal } from '../popups';
import { ChatSidebarSkeleton } from './ChatSidebarSkeleton';
import {
  ConversationItem,
  FolderList,
  SectionHeader,
  CollapsedSidebar,
  ProfileSection,
  RowShimmers,
} from './components';
import { FOLDER_SECTION_LIMIT } from './components/FolderContents';
import { useChatSidebarState } from './hooks';
import { getContextMenuItems, getFolderContextMenuItems } from './utils';

const VON_COMBINATION_MARK_URL =
  'https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/von_combination_mark.svg';

// ============================================================================
// Types
// ============================================================================

/**
 * Sidebar item vocabulary. Note this is *display-side* — the host app's
 * Folders v2 API uses `'conversation' | 'dashboard'`. Mapping `'chat' ⇄
 * 'conversation'` happens at the app boundary, not here.
 */
export const ItemType = {
  Chat: 'chat',
  Dashboard: 'dashboard',
} as const;

export type ItemType = (typeof ItemType)[keyof typeof ItemType];
export type ItemStatus = 'idle' | 'running' | 'complete';

/**
 * Approval indicator state for a conversation row.
 * - "pending": awaiting user action → pulsing purple dot
 * - "expired": TTL passed without action → orange→red gradient dot
 * - absent: no indicator
 */
export type ApprovalState = 'pending' | 'expired';

export interface SidebarItem {
  id: string;
  label: string;
  type: ItemType;
  href?: string;
  /** Folder ID this item belongs to (null for root level) */
  folderId?: string | null;
  /** Status indicator for the item (chats only) */
  status?: ItemStatus;
  /** Approval indicator state (chats only). Absent means no indicator. */
  approvalState?: ApprovalState;
  /** Whether the current user owns this item — gates rename/delete in the
   *  context menu. Always true for chats; reflects API truth for dashboards. */
  isOwner?: boolean;
  /** True when this row is server-managed (e.g. a scheduled command run).
   *  The context menu uses this to disable Manage Folders and Delete. */
  isSystemManaged?: boolean;
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
  isSystem?: boolean;
}

/**
 * Map of folder ID to chat items within that folder
 */
export type FolderItemsMap = Record<string, SidebarItem[]>;

/**
 * Map of folder ID to dashboard items within that folder. Same row shape
 * as `FolderItemsMap` (a `SidebarItem` carries `type: 'dashboard'` for these),
 * so the rendering layer treats both subsections identically.
 */
export type FolderDashboardsMap = Record<string, SidebarItem[]>;

/**
 * Map of folder ID to loading state
 */
export type FolderLoadingMap = Record<string, boolean>;

/**
 * Per-folder, per-type totals from the data layer. The "Show 5 more"
 * expander is hidden when the visible item count reaches the type's total.
 */
export type FolderSectionTotalsMap = Record<string, { conversation: number; dashboard: number }>;

/** Item types that can be filed inside a folder. */
export type FolderItemType = 'conversation' | 'dashboard';

/**
 * Per-section pagination state. Keyed by `${folderId}:${itemType}`; the
 * value is the number of *additional* pages fetched beyond the first
 * (page 1 = first 5 from `/contents`). Absent keys default to 0. Each
 * "Show 5 more" click bumps the count by 1; "Show less" resets to 0.
 */
export type SectionShowMoreMap = Record<string, number>;

export interface ChatSidebarProps {
  items?: SidebarItem[];
  folders?: Folder[];
  folderItems?: FolderItemsMap;
  /** Dashboards filed inside each folder (keyed by folderId) */
  folderDashboards?: FolderDashboardsMap;
  /** Per-folder, per-type totals — drives "Show 5 more" visibility. */
  folderSectionTotals?: FolderSectionTotalsMap;
  folderLoadingMap?: FolderLoadingMap;
  isLoading?: boolean;
  selectedItemId?: string;
  onItemClick?: (id: string) => void;
  onNewChatClick?: () => void;
  onSearchClick?: () => void;
  onNewChatFolderClick?: (folderName: string) => void;
  onRenameItem?: (id: string, newName: string) => void;
  onShareItem?: (id: string) => void;
  /** Called when a conversation's context menu opens — lets the container fetch share status */
  onContextMenuOpen?: (itemId: string) => void;
  /** Share status for the item whose context menu is currently open */
  contextMenuShareInfo?: { isShared: boolean; accessType?: string | null };
  onDeleteItem?: (id: string) => void;
  onMoveItemToFolder?: (itemId: string, folderId: string) => void;
  onCreateFolderAndMoveItem?: (itemId: string, newFolderName: string) => void;
  /** Unfile any sidebar row (chat or dashboard) from its folder. The
   *  `itemType` is forwarded from the row so the host app doesn't need a
   *  per-type callback pair. */
  onRemoveItemFromFolder?: (itemId: string, itemType: ItemType) => void;
  /** Open the host app's multi-folder picker for any sidebar row. The
   *  `itemType` is forwarded from the row so the host app routes by type
   *  without parallel callbacks per item kind. */
  onManageItemFolders?: (itemId: string, itemType: ItemType) => void;
  /** Per-section reveal-count map keyed by `${folderId}:${itemType}`. */
  sectionShowMore?: SectionShowMoreMap;
  /** Reveal the next page of items in a section ("Show 5 more"). */
  onRevealMoreInSection?: (folderId: string, itemType: FolderItemType) => void;
  /** Collapse a section back to the default reveal count ("Show less"). */
  onCollapseSection?: (folderId: string, itemType: FolderItemType) => void;
  onFolderToggle?: (folderId: string, isExpanded: boolean) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onDeleteFolderClick?: (folderId: string) => void;
  onDeleteFolderCancelled?: (folderId: string) => void;
  onPinFolder?: (folderId: string, isPinned: boolean) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  loadMoreRef?: React.Ref<HTMLDivElement | null>;
  isFetchingMore?: boolean;
  /** Whether more unfiled chats are available — drives the click-driven
   *  "Show 5 more" button below the top-level Chats list. */
  hasMoreChats?: boolean;
  /** Callback invoked when the user clicks "Show 5 more" under Chats. */
  onLoadMoreChats?: () => void;
  /** Override the top-level chats section header (default "Chats").
   *  Used by the View Only role to display "Shared Chats" instead. */
  chatsSectionLabel?: string;
  /** Override the empty-state message under the chats section. */
  chatsEmptyMessage?: string;
  onLogoClick?: () => void;
  userName?: string;
  userEmail?: string;
  avatarSrc?: string;
  avatarLabel?: string;
  onSettingsClick?: () => void;

  onSignOutClick?: () => void;

  onHelpDocsClick?: () => void;

  /** When non-empty, the profile-popover Settings item is disabled and shows
   *  this string as the tooltip (used to gate access for View Only users). */
  settingsDisabledReason?: string;
  /** Whether the "New Chat" button should appear in active/selected state */
  isNewChatActive?: boolean;

  // ── Dashboard section (modular — set isDashboardsEnabled=false to hide) ──
  /** When false, hides the top-level Dashboards section AND the per-folder
   *  Dashboards subsection. Defaults to true. */
  isDashboardsEnabled?: boolean;
  /** Dashboard items to show in a "Dashboards" section. */
  dashboards?: DashboardSidebarItem[];
  /** Currently selected dashboard ID */
  selectedDashboardId?: string;
  /** Callback when a dashboard item is clicked */
  onDashboardClick?: (id: string) => void;
  /** Callback to rename a dashboard */
  onRenameDashboard?: (id: string, newName: string) => void;
  /** Callback to delete a dashboard (only shown to owner) */
  onDeleteDashboard?: (id: string) => void;
  /** Whether more dashboards are available to load */
  hasMoreDashboards?: boolean;
  /** Callback to load more dashboards */
  onLoadMoreDashboards?: () => void;
  /** True while the next page of dashboards is in flight. Drives shimmer
   *  placeholders below the dashboards list. */
  isLoadingMoreDashboards?: boolean;
  /** File a dashboard into an existing folder */
  onMoveDashboardToFolder?: (dashboardId: string, folderId: string) => void;
  /** Create a new folder and file the dashboard into it */
  onCreateFolderAndMoveDashboard?: (dashboardId: string, newFolderName: string) => void;
  /** Currently-selected conversation/dashboard ID — used by in-folder dashboard rows. */
  selectedDashboardIdInFolders?: string;
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

interface DashboardSectionProps {
  dashboards: DashboardSidebarItem[];
  /** Folders available as targets in the Move to Folder picker. */
  folders: Folder[];
  selectedDashboardId?: string;
  onDashboardClick?: (id: string) => void;
  onRenameDashboard?: (id: string, newName: string) => void;
  onDeleteDashboard?: (id: string) => void;
  onMoveDashboardToFolder?: (dashboardId: string, folderId: string) => void;
  onCreateFolderAndMoveDashboard?: (dashboardId: string, newFolderName: string) => void;
  /** Unified manage-folders callback. The dashboard section always forwards
   *  `ItemType.Dashboard` so the host can route by type without a separate
   *  per-type prop. */
  onManageItemFolders?: (itemId: string, itemType: ItemType) => void;
  hasMoreDashboards?: boolean;
  onLoadMoreDashboards?: () => void;
  isLoadingMoreDashboards?: boolean;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({
  dashboards,
  folders,
  selectedDashboardId,
  onDashboardClick,
  onRenameDashboard,
  onDeleteDashboard,
  onMoveDashboardToFolder,
  onCreateFolderAndMoveDashboard,
  onManageItemFolders,
  hasMoreDashboards,
  onLoadMoreDashboards,
  isLoadingMoreDashboards = false,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<DashboardContextMenuState>({
    isOpen: false,
    position: { top: 0, left: 0 },
    dashboard: null,
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    dashboard: DashboardSidebarItem | null;
  }>({ isOpen: false, dashboard: null });
  const [moveToFolderState, setMoveToFolderState] = useState<{
    isOpen: boolean;
    dashboard: DashboardSidebarItem | null;
  }>({ isOpen: false, dashboard: null });

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

  const folderOptions = useMemo(
    () => folders.map((f) => ({ id: f.id, label: f.label })),
    [folders]
  );

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
        {isLoadingMoreDashboards ? (
          <RowShimmers count={FOLDER_SECTION_LIMIT} />
        ) : hasMoreDashboards ? (
          <button
            onClick={onLoadMoreDashboards}
            className="w-full px-2 py-1 text-sm text-gray-800 hover:text-gray-900 transition-colors text-left cursor-pointer"
          >
            Show more
          </button>
        ) : null}
      </div>

      {/* Dashboard Context Menu — same shape as the chat context menu;
          rename/delete owner-gated, no Share for dashboards. */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        items={getContextMenuItems({
          itemType: 'dashboard',
          isOwner: contextMenu.dashboard?.isOwner,
        })}
        fixedPosition={contextMenu.position}
        width={180}
        onItemClick={(menuItem) => {
          const dash = contextMenu.dashboard;
          if (!dash) return;
          if (menuItem.id === 'rename' && dash.isOwner) {
            setEditingId(dash.id);
          } else if (menuItem.id === 'manage-folders') {
            onManageItemFolders?.(dash.id, ItemType.Dashboard);
          } else if (menuItem.id === 'delete' && dash.isOwner) {
            setDeleteConfirmation({ isOpen: true, dashboard: dash });
          }
          setContextMenu((prev) => ({ ...prev, isOpen: false }));
        }}
      />

      {/* Dashboard Delete Confirmation */}
      <DeleteConfirmationPopup
        isOpen={deleteConfirmation.isOpen}
        itemLabel={deleteConfirmation.dashboard?.label || ''}
        itemType="dashboard"
        onConfirm={() => {
          if (deleteConfirmation.dashboard) {
            onDeleteDashboard?.(deleteConfirmation.dashboard.id);
          }
          setDeleteConfirmation({ isOpen: false, dashboard: null });
        }}
        onCancel={() => setDeleteConfirmation({ isOpen: false, dashboard: null })}
      />

      {/* Move-to-Folder picker — same modal as for chats */}
      <MoveToFolderModal
        isOpen={moveToFolderState.isOpen}
        itemName={moveToFolderState.dashboard?.label || ''}
        itemType="dashboard"
        folders={folderOptions}
        onConfirm={(config) => {
          const dash = moveToFolderState.dashboard;
          setMoveToFolderState({ isOpen: false, dashboard: null });
          if (!dash) return;
          if (config.isNewFolder && config.newFolderName) {
            onCreateFolderAndMoveDashboard?.(dash.id, config.newFolderName);
          } else if (config.folderId) {
            onMoveDashboardToFolder?.(dash.id, config.folderId);
          }
        }}
        onCancel={() => setMoveToFolderState({ isOpen: false, dashboard: null })}
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
  folderDashboards = {},
  folderSectionTotals = {},
  folderLoadingMap = {},
  isLoading = false,
  selectedItemId,
  onItemClick,
  onNewChatClick,
  onSearchClick,
  onNewChatFolderClick,
  onRenameItem,
  onShareItem,
  onContextMenuOpen,
  contextMenuShareInfo,
  onDeleteItem,
  onMoveItemToFolder,
  onCreateFolderAndMoveItem,
  onRemoveItemFromFolder,
  onManageItemFolders,
  sectionShowMore,
  onRevealMoreInSection,
  onCollapseSection,
  onFolderToggle,
  onRenameFolder,
  onDeleteFolder,
  onDeleteFolderClick,
  onDeleteFolderCancelled,
  onPinFolder,
  isCollapsed = false,
  onToggleCollapse,
  loadMoreRef,
  isFetchingMore = false,
  hasMoreChats,
  onLoadMoreChats,
  chatsSectionLabel = 'Chats',
  chatsEmptyMessage = 'No conversations yet. Start a new chat to get going.',
  onLogoClick,
  userName,
  userEmail,
  avatarSrc,
  avatarLabel,
  onSettingsClick,
  onSignOutClick,
  onHelpDocsClick,
  settingsDisabledReason,
  isNewChatActive = false,
  isDashboardsEnabled = true,
  dashboards,
  selectedDashboardId,
  onDashboardClick,
  onRenameDashboard,
  onDeleteDashboard,
  hasMoreDashboards,
  onLoadMoreDashboards,
  isLoadingMoreDashboards,
  onMoveDashboardToFolder,
  onCreateFolderAndMoveDashboard,
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
    handleContextMenu: rawHandleContextMenu,
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

    // Move handlers — the unified context menu no longer dispatches the
    // legacy single-select `'move'` action, so `handleShowMoveToFolder` is
    // intentionally omitted. The bundled <MoveToFolderModal/> remains
    // mounted (still wired to confirm/cancel) but is unreachable until the
    // dead-code cleanup follow-up lands.
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
    onDeleteFolderClick,
    onDeleteFolderCancelled,
    onPinFolder,
    onFolderToggle,
    onNewChatFolderClick,
    onMoveItemToFolder,
    onCreateFolderAndMoveItem,
    onRemoveItemFromFolder,
    onRenameDashboard,
    onDeleteDashboard,
    onMoveDashboardToFolder,
    onCreateFolderAndMoveDashboard,
  });

  // Wrap context menu handler to notify container (for share status fetch)
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, item: SidebarItem) => {
      rawHandleContextMenu(e, item);
      onContextMenuOpen?.(item.id);
    },
    [rawHandleContextMenu, onContextMenuOpen]
  );

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
          dashboards={isDashboardsEnabled ? dashboards : undefined}
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
          onHelpDocsClick={onHelpDocsClick}
          settingsDisabledReason={settingsDisabledReason}
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

              {/* New Chat Button — hidden when no onNewChatClick is provided
                  (e.g. View Only role can't create chats). */}
              {onNewChatClick && (
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
              )}

              {/* Search Button */}
              {onSearchClick && (
                <div className="mb-3 pr-2">
                  <button
                    className="flex items-center gap-1.5 px-1.5 h-8 w-full rounded-xl text-sm text-gray-900 border border-transparent bg-white hover:bg-gray-50 hover:border-gray-200 hover:shadow-xs transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    onClick={onSearchClick}
                    type="button"
                  >
                    <MagnifyingGlassIcon
                      size={20}
                      weight="regular"
                      className="flex-shrink-0 text-gray-600"
                    />
                    <span className="whitespace-nowrap">Search</span>
                    <span className="ml-auto inline-flex items-center px-1.5 min-h-[18px] text-[10.5px] font-mono text-gray-500 bg-gray-100 border border-gray-200 rounded">
                      ⌘K
                    </span>
                  </button>
                </div>
              )}

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pr-2 settings-scrollbar">
                {/* Loading Skeleton */}
                {isLoading && <ChatSidebarSkeleton />}

                {/* Folders Section — hidden entirely when there are no folders
                    AND no folder-creation handler (e.g. View Only role). */}
                {!isLoading &&
                  (visibleFolders.length > 0 || !!onNewChatFolderClick) && (
                  <div className="mb-3">
                    <SectionHeader label="Folders" />
                    <div>
                      <FolderList
                        sortedFolders={visibleFolders}
                        itemsByFolder={itemsByFolder}
                        dashboardsByFolder={folderDashboards}
                        isDashboardsEnabled={isDashboardsEnabled}
                        folderSectionTotals={folderSectionTotals}
                        folderLoadingMap={folderLoadingMap}
                        selectedItemId={selectedItemId ?? selectedDashboardId}
                        isCreatingFolder={isCreatingFolder}
                        newFolderName={newFolderName}
                        onNewFolderNameChange={setNewFolderName}
                        newFolderInputRef={newFolderInputRef}
                        onStartFolderCreation={
                          onNewChatFolderClick
                            ? handleStartFolderCreation
                            : undefined
                        }
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
                        onDashboardClick={onDashboardClick}
                        onSaveRename={handleSaveRename}
                        onCancelRename={handleCancelRename}
                        sectionShowMore={sectionShowMore}
                        onRevealMoreInSection={onRevealMoreInSection}
                        onCollapseSection={onCollapseSection}
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

                {/* Dashboards Section (modular — gated by isDashboardsEnabled) */}
                {!isLoading && isDashboardsEnabled && dashboards && (
                  <>
                    {dashboards.length > 0 ? (
                      <DashboardSection
                        dashboards={dashboards}
                        folders={folders}
                        selectedDashboardId={selectedDashboardId}
                        onDashboardClick={onDashboardClick}
                        onRenameDashboard={onRenameDashboard}
                        onDeleteDashboard={onDeleteDashboard}
                        onMoveDashboardToFolder={onMoveDashboardToFolder}
                        onCreateFolderAndMoveDashboard={onCreateFolderAndMoveDashboard}
                        onManageItemFolders={onManageItemFolders}
                        hasMoreDashboards={hasMoreDashboards}
                        onLoadMoreDashboards={onLoadMoreDashboards}
                        isLoadingMoreDashboards={isLoadingMoreDashboards}
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
                    <SectionHeader label={chatsSectionLabel} />
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
                        {isFetchingMore ? (
                          <RowShimmers count={FOLDER_SECTION_LIMIT} />
                        ) : hasMoreChats ? (
                          <button
                            onClick={onLoadMoreChats}
                            className="w-full px-2 py-1 text-sm text-gray-800 hover:text-gray-900 transition-colors text-left cursor-pointer"
                          >
                            Show more
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <SectionEmptyState message={chatsEmptyMessage} />
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
                onHelpDocsClick={onHelpDocsClick}
                settingsDisabledReason={settingsDisabledReason}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shared overlays — rendered outside collapsed/expanded wrappers so they work in both states */}

      {/* Context Menu (for items — same surface for chats and dashboards;
          rename/delete owner-gated, share appears for chats only). */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        onClose={handleCloseContextMenu}
        items={getContextMenuItems({
          itemType: contextMenu.item?.type,
          isOwner: contextMenu.item?.isOwner,
          isInFolder: !!contextMenu.item?.folderId,
          isSystemManaged: !!contextMenu.item?.isSystemManaged,
          enableShare: !!onShareItem,
          shareInfo: contextMenuShareInfo,
        })}
        fixedPosition={contextMenu.position}
        width={160}
        onItemClick={(menuItem) => {
          if (menuItem.id === 'rename' && contextMenu.item) {
            handleStartRename(contextMenu.item);
          } else if (menuItem.id === 'manage-folders' && contextMenu.item) {
            // Unified callback — the host app routes on `itemType`.
            onManageItemFolders?.(contextMenu.item.id, contextMenu.item.type);
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
