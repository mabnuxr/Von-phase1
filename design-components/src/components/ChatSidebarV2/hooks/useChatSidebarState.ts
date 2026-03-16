import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { SidebarItem, Folder, FolderItemsMap } from '../ChatSidebarV2';
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
  onPinFolder?: (folderId: string, isPinned: boolean) => void;
  onFolderToggle?: (folderId: string, isExpanded: boolean) => void;
  onNewChatFolderClick?: (folderName: string) => void;
  onMoveItemToFolder?: (itemId: string, folderId: string) => void;
  onCreateFolderAndMoveItem?: (itemId: string, newFolderName: string) => void;
  onRemoveItemFromFolder?: (itemId: string) => void;
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
  onPinFolder,
  onNewChatFolderClick,
  onMoveItemToFolder,
  onCreateFolderAndMoveItem,
  onRemoveItemFromFolder,
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

  // Refs
  const chatButtonRef = useRef<HTMLButtonElement>(null);
  const foldersButtonRef = useRef<HTMLButtonElement>(null);
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
      onRenameItem?.(item.id, newName);
      setEditingItemId(null);
      setEditingItemFolderId(null);
    },
    [onRenameItem]
  );

  const handleCancelRename = useCallback(() => {
    setEditingItemId(null);
    setEditingItemFolderId(null);
  }, []);

  const handleShowDeleteConfirmation = useCallback((item: SidebarItem) => {
    setDeleteConfirmation({ isOpen: true, item });
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteConfirmation.item) {
      onDeleteItem?.(deleteConfirmation.item.id);
    }
    setDeleteConfirmation({ isOpen: false, item: null });
  }, [deleteConfirmation.item, onDeleteItem]);

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

  const handleShowFolderDeleteConfirmation = useCallback((folder: Folder) => {
    setFolderDeleteConfirmation({ isOpen: true, folder });
  }, []);

  const handleConfirmFolderDelete = useCallback(() => {
    if (folderDeleteConfirmation.folder) {
      onDeleteFolder?.(folderDeleteConfirmation.folder.id);
    }
    setFolderDeleteConfirmation({ isOpen: false, folder: null });
  }, [folderDeleteConfirmation.folder, onDeleteFolder]);

  const handleCancelFolderDelete = useCallback(() => {
    setFolderDeleteConfirmation({ isOpen: false, folder: null });
  }, []);

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
      if (!moveToFolderModal.item) return;

      if (config.isNewFolder && config.newFolderName) {
        onCreateFolderAndMoveItem?.(moveToFolderModal.item.id, config.newFolderName);
      } else {
        onMoveItemToFolder?.(moveToFolderModal.item.id, config.folderId);
      }
      setMoveToFolderModal({ isOpen: false, item: null });
    },
    [moveToFolderModal.item, onCreateFolderAndMoveItem, onMoveItemToFolder]
  );

  const handleCancelMoveToFolder = useCallback(() => {
    setMoveToFolderModal({ isOpen: false, item: null });
  }, []);

  const handleRemoveFromFolder = useCallback(
    (item: SidebarItem) => {
      onRemoveItemFromFolder?.(item.id);
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
  };
}
