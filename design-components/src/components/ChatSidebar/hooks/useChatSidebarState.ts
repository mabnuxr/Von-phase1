import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { SidebarItem, Folder, FolderItemsMap, ItemType } from '../ChatSidebar';
import type { MoveToFolderConfig } from '../../popups';

// ============================================================================
// Types
// ============================================================================

export interface ContextMenuState {
  isOpen: boolean;
  position: { top: number; left: number };
  item: SidebarItem | null;
}

export interface FolderContextMenuState {
  isOpen: boolean;
  position: { top: number; left: number };
  folder: Folder | null;
}

export interface DeleteConfirmationState {
  isOpen: boolean;
  item: SidebarItem | null;
}

export interface FolderDeleteConfirmationState {
  isOpen: boolean;
  folder: Folder | null;
}

export interface MoveToFolderModalState {
  isOpen: boolean;
  item: SidebarItem | null;
}

export interface PopoverPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface UseChatSidebarStateOptions {
  items: SidebarItem[];
  folders: Folder[];
  folderItems: FolderItemsMap;
  onRenameItem?: (id: string, newName: string) => void;
  onDeleteItem?: (id: string) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onDeleteFolderClick?: (folderId: string) => void;
  onDeleteFolderCancelled?: (folderId: string) => void;
  onPinFolder?: (folderId: string, isPinned: boolean) => void;
  onFolderToggle?: (folderId: string, isExpanded: boolean) => void;
  onNewChatFolderClick?: (folderName: string) => void;
  onMoveItemToFolder?: (itemId: string, folderId: string) => void;
  onCreateFolderAndMoveItem?: (itemId: string, newFolderName: string) => void;
  /** Unfile a sidebar row (chat or dashboard) from its folder. The unified
   *  `itemType` is forwarded so the host doesn't need a parallel per-type prop. */
  onRemoveItemFromFolder?: (itemId: string, itemType: ItemType) => void;
  // Dashboard parallels — dispatched when the in-folder context menu acts
  // on a SidebarItem whose `type` is 'dashboard'. Falls back to the chat
  // callbacks if not provided so existing chat-only callers keep working.
  onRenameDashboard?: (id: string, newName: string) => void;
  onDeleteDashboard?: (id: string) => void;
  onMoveDashboardToFolder?: (dashboardId: string, folderId: string) => void;
  onCreateFolderAndMoveDashboard?: (dashboardId: string, newFolderName: string) => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useChatSidebarState({
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
  onNewChatFolderClick,
  onMoveItemToFolder,
  onCreateFolderAndMoveItem,
  onRemoveItemFromFolder,
  onRenameDashboard,
  onDeleteDashboard,
  onMoveDashboardToFolder,
  onCreateFolderAndMoveDashboard,
}: UseChatSidebarStateOptions) {
  // ============================================================================
  // State
  // ============================================================================

  // Inline folder creation
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Item context menu
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    position: { top: 0, left: 0 },
    item: null,
  });

  // Item editing (track both item ID and folder context to avoid ambiguity
  // when the same conversation appears in both folder and root sections)
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemFolderId, setEditingItemFolderId] = useState<string | null>(null);

  // Item delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationState>({
    isOpen: false,
    item: null,
  });

  // Folder context menu
  const [folderContextMenu, setFolderContextMenu] = useState<FolderContextMenuState>({
    isOpen: false,
    position: { top: 0, left: 0 },
    folder: null,
  });

  // Folder editing
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

  // Folder delete confirmation
  const [folderDeleteConfirmation, setFolderDeleteConfirmation] =
    useState<FolderDeleteConfirmationState>({
      isOpen: false,
      folder: null,
    });

  // Move to folder modal
  const [moveToFolderModal, setMoveToFolderModal] = useState<MoveToFolderModalState>({
    isOpen: false,
    item: null,
  });

  // Profile popover
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition>({
    bottom: 0,
    left: 0,
  });

  // Collapsed sidebar hover dropdown
  const [isChatsHovered, setIsChatsHovered] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [isFoldersHovered, setIsFoldersHovered] = useState(false);
  const [foldersDropdownPosition, setFoldersDropdownPosition] = useState({ top: 0, left: 0 });
  const [isDashboardsHovered, setIsDashboardsHovered] = useState(false);
  const [dashboardsDropdownPosition, setDashboardsDropdownPosition] = useState({ top: 0, left: 0 });

  // Refs
  const chatButtonRef = useRef<HTMLButtonElement>(null);
  const foldersButtonRef = useRef<HTMLButtonElement>(null);
  const dashboardsButtonRef = useRef<HTMLButtonElement>(null);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // Effects
  // ============================================================================

  // Focus new folder input when creating
  useEffect(() => {
    if (isCreatingFolder && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [isCreatingFolder]);

  // ============================================================================
  // Derived State
  // ============================================================================

  // Root items (not in any folder)
  const rootItems = useMemo(() => items.filter((item) => !item.folderId), [items]);

  // Items by folder - use folderItems prop if provided, otherwise filter from items
  const itemsByFolder = useMemo(() => {
    return folders.reduce(
      (acc, folder) => {
        const itemsFromProp = folderItems[folder.id] || [];
        const itemsFromFilter = items.filter((item) => item.folderId === folder.id);
        acc[folder.id] = itemsFromProp.length > 0 ? itemsFromProp : itemsFromFilter;
        return acc;
      },
      {} as Record<string, SidebarItem[]>
    );
  }, [folders, folderItems, items]);

  // Sorted folders: pinned first, then alphabetical by label
  const sortedFolders = useMemo(() => {
    return [...folders].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return a.label.localeCompare(b.label);
    });
  }, [folders]);

  // Available folders for move (excludes current folder)
  const getAvailableFoldersForMove = useCallback(() => {
    return folders.map((f) => ({ id: f.id, label: f.label }));
  }, [folders]);

  // ============================================================================
  // Inline Folder Creation Handlers
  // ============================================================================

  const handleStartFolderCreation = useCallback(() => {
    setIsCreatingFolder(true);
    setNewFolderName('');
  }, []);

  const handleConfirmFolderCreation = useCallback(() => {
    const trimmed = newFolderName.trim();
    if (trimmed) {
      onNewChatFolderClick?.(trimmed);
    }
    setIsCreatingFolder(false);
    setNewFolderName('');
  }, [newFolderName, onNewChatFolderClick]);

  const handleCancelFolderCreation = useCallback(() => {
    setIsCreatingFolder(false);
    setNewFolderName('');
  }, []);

  // ============================================================================
  // Item Handlers
  // ============================================================================

  const handleContextMenu = useCallback((e: React.MouseEvent, item: SidebarItem) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({
      isOpen: true,
      position: { top: rect.bottom + 4, left: rect.left },
      item,
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleStartRename = useCallback((item: SidebarItem) => {
    setEditingItemId(item.id);
    setEditingItemFolderId(item.folderId ?? null);
  }, []);

  const handleSaveRename = useCallback(
    (item: SidebarItem, newName: string) => {
      if (item.type === 'dashboard') {
        onRenameDashboard?.(item.id, newName);
      } else {
        onRenameItem?.(item.id, newName);
      }
      setEditingItemId(null);
      setEditingItemFolderId(null);
    },
    [onRenameItem, onRenameDashboard]
  );

  const handleCancelRename = useCallback(() => {
    setEditingItemId(null);
    setEditingItemFolderId(null);
  }, []);

  const handleShowDeleteConfirmation = useCallback((item: SidebarItem) => {
    setDeleteConfirmation({ isOpen: true, item });
  }, []);

  const handleConfirmDelete = useCallback(() => {
    const target = deleteConfirmation.item;
    if (target) {
      if (target.type === 'dashboard') {
        onDeleteDashboard?.(target.id);
      } else {
        onDeleteItem?.(target.id);
      }
    }
    setDeleteConfirmation({ isOpen: false, item: null });
  }, [deleteConfirmation.item, onDeleteItem, onDeleteDashboard]);

  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmation({ isOpen: false, item: null });
  }, []);

  // ============================================================================
  // Folder Handlers
  // ============================================================================

  const handleFolderContextMenu = useCallback((e: React.MouseEvent, folder: Folder) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setFolderContextMenu({
      isOpen: true,
      position: { top: rect.bottom + 4, left: rect.left },
      folder,
    });
  }, []);

  const handleCloseFolderContextMenu = useCallback(() => {
    setFolderContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleStartFolderRename = useCallback((folder: Folder) => {
    setEditingFolderId(folder.id);
  }, []);

  const handleSaveFolderRename = useCallback(
    (folder: Folder, newName: string) => {
      onRenameFolder?.(folder.id, newName);
      setEditingFolderId(null);
    },
    [onRenameFolder]
  );

  const handleCancelFolderRename = useCallback(() => {
    setEditingFolderId(null);
  }, []);

  const handleShowFolderDeleteConfirmation = useCallback(
    (folder: Folder) => {
      setFolderDeleteConfirmation({ isOpen: true, folder });
      onDeleteFolderClick?.(folder.id);
    },
    [onDeleteFolderClick]
  );

  const handleConfirmFolderDelete = useCallback(() => {
    if (folderDeleteConfirmation.folder) {
      onDeleteFolder?.(folderDeleteConfirmation.folder.id);
    }
    setFolderDeleteConfirmation({ isOpen: false, folder: null });
  }, [folderDeleteConfirmation.folder, onDeleteFolder]);

  const handleCancelFolderDelete = useCallback(() => {
    if (folderDeleteConfirmation.folder) {
      onDeleteFolderCancelled?.(folderDeleteConfirmation.folder.id);
    }
    setFolderDeleteConfirmation({ isOpen: false, folder: null });
  }, [folderDeleteConfirmation.folder, onDeleteFolderCancelled]);

  const handlePinFolder = useCallback(
    (folder: Folder) => {
      onPinFolder?.(folder.id, !folder.isPinned);
    },
    [onPinFolder]
  );

  // ============================================================================
  // Move to Folder Handlers
  // ============================================================================

  const handleShowMoveToFolder = useCallback((item: SidebarItem) => {
    setMoveToFolderModal({ isOpen: true, item });
  }, []);

  const handleConfirmMoveToFolder = useCallback(
    (config: MoveToFolderConfig) => {
      const target = moveToFolderModal.item;
      if (!target) return;

      if (config.isNewFolder && config.newFolderName) {
        if (target.type === 'dashboard') {
          onCreateFolderAndMoveDashboard?.(target.id, config.newFolderName);
        } else {
          onCreateFolderAndMoveItem?.(target.id, config.newFolderName);
        }
      } else {
        if (target.type === 'dashboard') {
          onMoveDashboardToFolder?.(target.id, config.folderId);
        } else {
          onMoveItemToFolder?.(target.id, config.folderId);
        }
      }
      setMoveToFolderModal({ isOpen: false, item: null });
    },
    [
      moveToFolderModal.item,
      onCreateFolderAndMoveItem,
      onMoveItemToFolder,
      onCreateFolderAndMoveDashboard,
      onMoveDashboardToFolder,
    ]
  );

  const handleCancelMoveToFolder = useCallback(() => {
    setMoveToFolderModal({ isOpen: false, item: null });
  }, []);

  const handleRemoveFromFolder = useCallback(
    (item: SidebarItem) => {
      // Single host callback; forward the item's type so the app can dispatch
      // without parallel per-type props.
      onRemoveItemFromFolder?.(item.id, item.type);
    },
    [onRemoveItemFromFolder]
  );

  // ============================================================================
  // UI Handlers
  // ============================================================================

  const handleChatsHover = useCallback((isHovering: boolean) => {
    if (isHovering && chatButtonRef.current) {
      const rect = chatButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.top,
        left: rect.right + 8,
      });
    }
    setIsChatsHovered(isHovering);
  }, []);

  const handleFoldersHover = useCallback((isHovering: boolean) => {
    if (isHovering && foldersButtonRef.current) {
      const rect = foldersButtonRef.current.getBoundingClientRect();
      setFoldersDropdownPosition({
        top: rect.top,
        left: rect.right + 8,
      });
    }
    setIsFoldersHovered(isHovering);
  }, []);

  const handleDashboardsHover = useCallback((isHovering: boolean) => {
    if (isHovering && dashboardsButtonRef.current) {
      const rect = dashboardsButtonRef.current.getBoundingClientRect();
      setDashboardsDropdownPosition({
        top: rect.top,
        left: rect.right + 8,
      });
    }
    setIsDashboardsHovered(isHovering);
  }, []);

  const handleAvatarClick = useCallback(() => {
    if (avatarButtonRef.current) {
      const rect = avatarButtonRef.current.getBoundingClientRect();
      setPopoverPosition({
        bottom: window.innerHeight - rect.top + 8,
        left: rect.left,
      });
    }
    setIsProfileOpen((prev) => !prev);
  }, []);

  const handleCloseProfile = useCallback(() => {
    setIsProfileOpen(false);
  }, []);

  // ============================================================================
  // Return
  // ============================================================================

  return {
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
  };
}
