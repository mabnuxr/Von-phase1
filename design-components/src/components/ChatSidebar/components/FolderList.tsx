import React from 'react';
import { FolderPlusIcon, FolderSimpleIcon } from '@phosphor-icons/react';
import { FolderRow } from './FolderRow';
import { FolderContents } from './FolderContents';
import type {
  SidebarItem,
  Folder,
  FolderLoadingMap,
  FolderItemsMap,
  FolderDashboardsMap,
  FolderItemType,
  FolderSectionTotalsMap,
  SectionShowMoreMap,
} from '../ChatSidebar';
import type { ContextMenuState, FolderContextMenuState } from '../hooks';

export interface FolderListProps {
  sortedFolders: Folder[];
  itemsByFolder: FolderItemsMap;
  dashboardsByFolder?: FolderDashboardsMap;
  isDashboardsEnabled?: boolean;
  folderSectionTotals?: FolderSectionTotalsMap;
  folderLoadingMap?: FolderLoadingMap;
  selectedItemId?: string;
  onFolderToggle?: (folderId: string, isExpanded: boolean) => void;
  /** Click handler for chat items — receives the conversation id. */
  onItemClick?: (id: string) => void;
  /** Click handler for dashboard items — receives the dashboard id. */
  onDashboardClick?: (id: string) => void;

  /**
   * When true, renders a read-only view (no creation, editing, context menus).
   * Used in the collapsed sidebar popover.
   */
  minimal?: boolean;

  /** Show "No folders" empty state when there are no folders */
  showEmptyState?: boolean;

  // --- Per-section show-more state (per-folder + per-type) ---
  sectionShowMore?: SectionShowMoreMap;
  onRevealMoreInSection?: (folderId: string, itemType: FolderItemType) => void;
  onCollapseSection?: (folderId: string, itemType: FolderItemType) => void;

  // --- Full-mode props (ignored when minimal=true) ---

  // Folder creation
  isCreatingFolder?: boolean;
  newFolderName?: string;
  onNewFolderNameChange?: (name: string) => void;
  newFolderInputRef?: React.RefObject<HTMLInputElement | null>;
  onStartFolderCreation?: () => void;
  onConfirmFolderCreation?: () => void;
  onCancelFolderCreation?: () => void;

  // Folder editing/context
  editingFolderId?: string | null;
  folderContextMenu?: FolderContextMenuState;
  onFolderContextMenu?: (e: React.MouseEvent, folder: Folder) => void;
  onPinFolder?: (folder: Folder) => void;
  onSaveFolderRename?: (folder: Folder, newName: string) => void;
  onCancelFolderRename?: () => void;

  // Item editing/context (for items inside folders)
  editingItemId?: string | null;
  editingItemFolderId?: string | null;
  contextMenu?: ContextMenuState;
  onItemContextMenu?: (e: React.MouseEvent, item: SidebarItem) => void;
  onSaveRename?: (item: SidebarItem, newName: string) => void;
  onCancelRename?: () => void;
}

/**
 * FolderList — renders one row per folder with the A2 nested body inside
 * each expanded folder. Both chats and dashboards inside a folder render
 * through the shared `ConversationItem` row, so the visual is identical.
 */
export const FolderList: React.FC<FolderListProps> = ({
  sortedFolders,
  itemsByFolder,
  dashboardsByFolder = {},
  isDashboardsEnabled = true,
  folderSectionTotals = {},
  folderLoadingMap = {},
  selectedItemId,
  onFolderToggle,
  onItemClick,
  onDashboardClick,
  minimal = false,
  showEmptyState = false,
  sectionShowMore,
  onRevealMoreInSection,
  onCollapseSection,
  isCreatingFolder,
  newFolderName,
  onNewFolderNameChange,
  newFolderInputRef,
  onStartFolderCreation,
  onConfirmFolderCreation,
  onCancelFolderCreation,
  editingFolderId,
  folderContextMenu,
  onFolderContextMenu,
  onPinFolder,
  onSaveFolderRename,
  onCancelFolderRename,
  editingItemId,
  editingItemFolderId,
  contextMenu,
  onItemContextMenu,
  onSaveRename,
  onCancelRename,
}) => {
  return (
    <>
      {/* "New Folder" row — hidden when no creation handler is provided. */}
      {!minimal && onStartFolderCreation && (
        <div
          className="flex items-center gap-1.5 px-2 h-8 rounded-xl text-sm text-gray-900 border border-transparent hover:bg-gray-50 hover:border-gray-200 hover:shadow-xs transition-colors cursor-pointer"
          onClick={onStartFolderCreation}
        >
          <FolderPlusIcon size={16} weight="regular" className="flex-shrink-0" />
          <span>New folder</span>
        </div>
      )}

      {/* Inline new folder input — full mode only */}
      {!minimal && isCreatingFolder && (
        <div className="flex items-center gap-2 px-2 h-8 rounded-xl bg-gray-50">
          <FolderSimpleIcon size={16} weight="regular" className="text-gray-800 flex-shrink-0" />
          <input
            ref={newFolderInputRef}
            type="text"
            value={newFolderName}
            onChange={(e) => onNewFolderNameChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onConfirmFolderCreation?.();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onCancelFolderCreation?.();
              }
            }}
            onBlur={onCancelFolderCreation}
            placeholder="Folder name..."
            className="flex-1 text-sm text-gray-900 bg-white border border-gray-200 rounded-md px-1.5 py-0.5 outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200"
          />
        </div>
      )}

      {/* Folder rows */}
      {sortedFolders.map((folder) => {
        const folderConversations = itemsByFolder[folder.id] || [];
        const folderDashes = dashboardsByFolder[folder.id] || [];
        const isFolderLoading = folderLoadingMap[folder.id] || false;
        return (
          <div key={folder.id}>
            <FolderRow
              folder={folder}
              isEditing={!minimal && editingFolderId === folder.id}
              isMenuOpen={
                !minimal &&
                !!folderContextMenu?.isOpen &&
                folderContextMenu?.folder?.id === folder.id
              }
              onClick={() => onFolderToggle?.(folder.id, !folder.isExpanded)}
              onContextMenu={minimal ? undefined : (e) => onFolderContextMenu?.(e, folder)}
              onPinFolder={minimal ? undefined : () => onPinFolder?.(folder)}
              onSaveEdit={minimal ? undefined : (newName) => onSaveFolderRename?.(folder, newName)}
              onCancelEdit={minimal ? undefined : onCancelFolderRename}
            />
            <FolderContents
              folderId={folder.id}
              isExpanded={folder.isExpanded ?? false}
              isLoading={isFolderLoading}
              conversations={folderConversations}
              dashboards={folderDashes}
              isDashboardsEnabled={isDashboardsEnabled && !folder.isSystem}
              conversationsTotal={folderSectionTotals[folder.id]?.conversation}
              dashboardsTotal={folderSectionTotals[folder.id]?.dashboard}
              selectedItemId={selectedItemId}
              menuOpenItemId={!minimal && contextMenu?.isOpen ? contextMenu.item?.id : null}
              editingItemId={
                !minimal && editingItemFolderId === folder.id ? (editingItemId ?? null) : null
              }
              sectionShowMore={sectionShowMore}
              onRevealMoreInSection={onRevealMoreInSection}
              onCollapseSection={onCollapseSection}
              onItemClick={(item) =>
                item.type === 'dashboard' ? onDashboardClick?.(item.id) : onItemClick?.(item.id)
              }
              onItemContextMenu={minimal ? undefined : onItemContextMenu}
              onSaveEdit={minimal ? undefined : onSaveRename}
              onCancelEdit={minimal ? undefined : onCancelRename}
            />
          </div>
        );
      })}

      {/* Empty state */}
      {showEmptyState && sortedFolders.length === 0 && !(isCreatingFolder && !minimal) && (
        <div className="px-3 py-3 text-xs text-gray-400 text-center">No folders</div>
      )}
    </>
  );
};

export default FolderList;
