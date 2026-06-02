import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatTextIcon,
  SidebarSimpleIcon,
  FolderSimpleIcon,
  CaretDownIcon,
  CaretRightIcon,
  DotsThreeIcon,
  PencilSimpleIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowsInLineVerticalIcon,
} from '@phosphor-icons/react';
import {
  PrimaryButton,
  AddButton,
  PrimaryIconButton,
  SecondaryIconButton,
  TertiaryIconButton,
} from '../forms/buttons';
import {
  ProfilePopover,
  ContextMenu,
  DeleteConfirmationPopup,
  MoveToFolderModal,
  type ContextMenuItem,
  type MoveToFolderConfig,
} from '../popups';
import { ArrowBendUpRightIcon } from '@phosphor-icons/react';

const VON_COMBINATION_MARK_URL =
  'https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/v2/von_combination_mark.svg';

// ============================================================================
// Types
// ============================================================================

export interface SimpleSidebarItem {
  id: string;
  label: string;
  href?: string;
  folderId?: string | null;
}

export interface SimpleSidebarFolder {
  id: string;
  label: string;
  isExpanded?: boolean;
}

export interface ChatSidebarSimpleProps {
  items?: SimpleSidebarItem[];
  folders?: SimpleSidebarFolder[];
  selectedItemId?: string;
  onItemClick?: (id: string) => void;
  onNewChatClick?: () => void;
  onNewFolderClick?: () => void;
  /** ID of a newly created folder that should start in edit mode */
  newlyCreatedFolderId?: string | null;
  onRenameItem?: (id: string, newName: string) => void;
  onDeleteItem?: (id: string) => void;
  onFolderToggle?: (folderId: string, isExpanded: boolean) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  /** Move item to folder handler */
  onMoveItemToFolder?: (itemId: string, folderId: string) => void;
  /** Create folder and move item handler */
  onCreateFolderAndMoveItem?: (itemId: string, newFolderName: string) => void;
  /** Remove item from folder handler - moves item back to root level */
  onRemoveItemFromFolder?: (itemId: string) => void;
  onSearchChange?: (value: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCollapseAllClick?: () => void;
  onLogoClick?: () => void;
  userName?: string;
  userEmail?: string;
  avatarSrc?: string;
  avatarLabel?: string;
  onSettingsClick?: () => void;

  onSignOutClick?: () => void;
}

// ============================================================================
// Sub-components
// ============================================================================

const getContextMenuItems = (
  options: { includeMove?: boolean; isInFolder?: boolean } = {}
): ContextMenuItem[] => {
  const { includeMove = true, isInFolder = false } = options;
  return [
    { id: 'rename', label: 'Rename', icon: <PencilSimpleIcon size={14} /> },
    ...(includeMove
      ? [{ id: 'move', label: 'Move', icon: <ArrowBendUpRightIcon size={14} /> }]
      : []),
    ...(isInFolder
      ? [
          {
            id: 'remove-from-folder',
            label: 'Remove from Folder',
            icon: <FolderSimpleIcon size={14} />,
          },
        ]
      : []),
    { id: 'delete', label: 'Delete', icon: <TrashIcon size={14} />, variant: 'danger' as const },
  ];
};

interface SectionHeaderProps {
  label: string;
  isExpanded: boolean;
  onToggle: () => void;
  onAdd?: () => void;
  addButtonLabel?: string;
  count?: number;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  label,
  isExpanded,
  onToggle,
  onAdd,
  addButtonLabel = 'Add new',
  count,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="flex items-center justify-between px-2 py-1.5 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        className="flex items-center justify-between text-xs font-medium text-gray-700 hover:text-gray-800 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <span>{label}</span>
        <div className="flex items-center gap-1.5">
          {count !== undefined && (
            <span className="pl-0.5 text-[11px] text-gray-700 font-mono normal-case -mb-0.5">
              [{count}]
            </span>
          )}
          {isExpanded ? (
            <CaretDownIcon size={12} weight="duotone" className="text-gray-800" />
          ) : (
            <CaretRightIcon size={12} weight="duotone" className="text-gray-800" />
          )}
        </div>
      </button>
      {onAdd && (
        <div className={`transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <AddButton
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
          >
            {addButtonLabel}
          </AddButton>
        </div>
      )}
    </div>
  );
};

interface SidebarItemRowProps {
  item: SimpleSidebarItem;
  isSelected: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  isMenuOpen?: boolean;
  isEditing?: boolean;
  onSaveEdit?: (newName: string) => void;
  onCancelEdit?: () => void;
}

const SidebarItemRow: React.FC<SidebarItemRowProps> = ({
  item,
  isSelected,
  onClick,
  onContextMenu,
  isMenuOpen = false,
  isEditing = false,
  onSaveEdit,
  onCancelEdit,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [editValue, setEditValue] = useState(item.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const showButton = (isHovered || isMenuOpen) && !isEditing;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(item.label);
  }, [item.label, isEditing]);

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== item.label) {
      onSaveEdit?.(trimmedValue);
    } else {
      onCancelEdit?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancelEdit?.();
    }
  };

  const content = (
    <div
      className={`
        group relative flex items-center gap-2.5 px-2 py-1 rounded-lg text-sm
        transition-colors duration-150
        ${isEditing ? 'bg-gray-50' : isSelected ? 'bg-gray-50 cursor-pointer' : 'hover:bg-gray-50 cursor-pointer'}
      `}
      onClick={isEditing ? undefined : onClick}
      onContextMenu={isEditing ? undefined : onContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={isEditing ? undefined : item.label}
    >
      <ChatTextIcon size={16} weight="regular" className="text-gray-700 flex-shrink-0" />

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="flex-1 text-sm text-gray-900 bg-white border border-gray-200 rounded px-1.5 py-0.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span className="flex-1 text-sm truncate text-gray-900">{item.label}</span>

          <PrimaryIconButton
            icon={<DotsThreeIcon size={16} weight="bold" />}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => onContextMenu(e)}
            visible={showButton}
            size="small"
            className="absolute right-1"
          />
        </>
      )}
    </div>
  );

  if (item.href && !isEditing) {
    return (
      <a href={item.href} className="block no-underline">
        {content}
      </a>
    );
  }

  return content;
};

interface FolderSectionProps {
  folder: SimpleSidebarFolder;
  items: SimpleSidebarItem[];
  selectedItemId?: string;
  menuOpenItemId?: string | null;
  editingItemId?: string | null;
  isFolderEditing?: boolean;
  isFolderMenuOpen?: boolean;
  onItemClick: (id: string) => void;
  onItemContextMenu: (e: React.MouseEvent, item: SimpleSidebarItem) => void;
  onToggle: (isExpanded: boolean) => void;
  onSaveEdit?: (item: SimpleSidebarItem, newName: string) => void;
  onCancelEdit?: () => void;
  onFolderContextMenu?: (e: React.MouseEvent) => void;
  onSaveFolderEdit?: (newName: string) => void;
  onCancelFolderEdit?: () => void;
}

const FolderSection: React.FC<FolderSectionProps> = ({
  folder,
  items,
  selectedItemId,
  menuOpenItemId,
  editingItemId,
  isFolderEditing = false,
  isFolderMenuOpen = false,
  onItemClick,
  onItemContextMenu,
  onToggle,
  onSaveEdit,
  onCancelEdit,
  onFolderContextMenu,
  onSaveFolderEdit,
  onCancelFolderEdit,
}) => {
  const isExpanded = folder.isExpanded ?? true;
  const [isHovered, setIsHovered] = useState(false);
  const [editValue, setEditValue] = useState(folder.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const showButton = (isHovered || isFolderMenuOpen) && !isFolderEditing;

  useEffect(() => {
    if (isFolderEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isFolderEditing]);

  useEffect(() => {
    setEditValue(folder.label);
  }, [folder.label, isFolderEditing]);

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== folder.label) {
      onSaveFolderEdit?.(trimmedValue);
    } else {
      onCancelFolderEdit?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancelFolderEdit?.();
    }
  };

  return (
    <div className="mb-1">
      <div
        className="group relative flex items-center justify-between gap-2.5 px-2 py-1 text-sm text-gray-800 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
        onClick={isFolderEditing ? undefined : () => onToggle(!isExpanded)}
        onContextMenu={isFolderEditing ? undefined : onFolderContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <FolderSimpleIcon
            size={16}
            weight="regular"
            className="text-gray-800 mb-[1px] flex-shrink-0"
          />
          {isFolderEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="flex-1 text-sm text-gray-900 bg-white border border-gray-200 rounded px-1.5 py-0.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <span className="text-left truncate">{folder.label}</span>
              <span className="text-[11px] font-mono text-gray-700 -ml-1.5 -mb-1">
                ({items.length})
              </span>
            </>
          )}
        </div>

        {!isFolderEditing && (
          <PrimaryIconButton
            icon={<DotsThreeIcon size={16} weight="bold" />}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              onFolderContextMenu?.(e);
            }}
            visible={showButton}
            size="small"
          />
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden pl-2 border-l border-gray-200 ml-4"
          >
            {items.map((item) => (
              <SidebarItemRow
                key={item.id}
                item={item}
                isSelected={item.id === selectedItemId}
                onClick={() => onItemClick(item.id)}
                onContextMenu={(e) => onItemContextMenu(e, item)}
                isMenuOpen={menuOpenItemId === item.id}
                isEditing={editingItemId === item.id}
                onSaveEdit={(newName) => onSaveEdit?.(item, newName)}
                onCancelEdit={onCancelEdit}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * ChatSidebarSimple - Simplified chat sidebar without dashboard features
 *
 * A variant of ChatSidebar that only shows chats (no dashboards).
 * Used for the Jan17 demo where dashboard functionality is not needed.
 */
export const ChatSidebarSimple: React.FC<ChatSidebarSimpleProps> = ({
  items = [],
  folders = [],
  selectedItemId,
  onItemClick,
  onNewChatClick,
  onNewFolderClick,
  newlyCreatedFolderId,
  onRenameItem,
  onDeleteItem,
  onFolderToggle,
  onRenameFolder,
  onDeleteFolder,
  onMoveItemToFolder,
  onCreateFolderAndMoveItem,
  onRemoveItemFromFolder,
  isCollapsed = false,
  onToggleCollapse,
  onCollapseAllClick,
  onLogoClick,
  userName,
  userEmail,
  avatarSrc,
  avatarLabel,
  onSettingsClick,
  onSignOutClick,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { top: number; left: number };
    item: SimpleSidebarItem | null;
  }>({ isOpen: false, position: { top: 0, left: 0 }, item: null });

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    item: SimpleSidebarItem | null;
  }>({ isOpen: false, item: null });

  const [folderContextMenu, setFolderContextMenu] = useState<{
    isOpen: boolean;
    position: { top: number; left: number };
    folder: SimpleSidebarFolder | null;
  }>({ isOpen: false, position: { top: 0, left: 0 }, folder: null });

  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderDeleteConfirmation, setFolderDeleteConfirmation] = useState<{
    isOpen: boolean;
    folder: SimpleSidebarFolder | null;
  }>({ isOpen: false, folder: null });

  const [isChatsExpanded, setIsChatsExpanded] = useState(true);

  // Move to folder modal state
  const [moveToFolderModal, setMoveToFolderModal] = useState<{
    isOpen: boolean;
    item: SimpleSidebarItem | null;
  }>({ isOpen: false, item: null });

  const chatButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-edit newly created folder
  useEffect(() => {
    if (newlyCreatedFolderId) {
      setEditingFolderId(newlyCreatedFolderId);
    }
  }, [newlyCreatedFolderId]);
  const [isChatsHovered, setIsChatsHovered] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);
  const [popoverPosition, setPopoverPosition] = useState<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  }>({ bottom: 0, left: 0 });

  const handleAvatarClick = () => {
    if (avatarButtonRef.current) {
      const rect = avatarButtonRef.current.getBoundingClientRect();
      setPopoverPosition({
        bottom: window.innerHeight - rect.top + 8,
        left: rect.right + 8,
      });
    }
    setIsProfileOpen(!isProfileOpen);
  };

  const handleCollapseAll = () => {
    setIsChatsExpanded(false);
    folders.forEach((folder) => {
      if (folder.isExpanded) {
        onFolderToggle?.(folder.id, false);
      }
    });
    onCollapseAllClick?.();
  };

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const rootItems = filteredItems.filter((item) => !item.folderId);
  const itemsByFolder = folders.reduce(
    (acc, folder) => {
      acc[folder.id] = filteredItems.filter((item) => item.folderId === folder.id);
      return acc;
    },
    {} as Record<string, SimpleSidebarItem[]>
  );

  const totalChats = filteredItems.length;

  const handleContextMenu = (e: React.MouseEvent, item: SimpleSidebarItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      position: { top: e.clientY, left: e.clientX + 8 },
      item,
    });
  };

  const handleChatsHover = (isHovering: boolean) => {
    if (isHovering && chatButtonRef.current) {
      const rect = chatButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.top,
        left: rect.right + 8,
      });
    }
    setIsChatsHovered(isHovering);
  };

  const handleStartRename = (item: SimpleSidebarItem) => {
    setEditingItemId(item.id);
  };

  const handleSaveRename = (item: SimpleSidebarItem, newName: string) => {
    onRenameItem?.(item.id, newName);
    setEditingItemId(null);
  };

  const handleCancelRename = () => {
    setEditingItemId(null);
  };

  const handleShowDeleteConfirmation = (item: SimpleSidebarItem) => {
    setDeleteConfirmation({ isOpen: true, item });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation.item) {
      onDeleteItem?.(deleteConfirmation.item.id);
    }
    setDeleteConfirmation({ isOpen: false, item: null });
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, item: null });
  };

  const handleFolderContextMenu = (e: React.MouseEvent, folder: SimpleSidebarFolder) => {
    e.preventDefault();
    e.stopPropagation();
    setFolderContextMenu({
      isOpen: true,
      position: { top: e.clientY, left: e.clientX + 8 },
      folder,
    });
  };

  const handleStartFolderRename = (folder: SimpleSidebarFolder) => {
    setEditingFolderId(folder.id);
  };

  const handleSaveFolderRename = (folder: SimpleSidebarFolder, newName: string) => {
    onRenameFolder?.(folder.id, newName);
    setEditingFolderId(null);
  };

  const handleCancelFolderRename = () => {
    setEditingFolderId(null);
  };

  const handleShowFolderDeleteConfirmation = (folder: SimpleSidebarFolder) => {
    setFolderDeleteConfirmation({ isOpen: true, folder });
  };

  const handleConfirmFolderDelete = () => {
    if (folderDeleteConfirmation.folder) {
      onDeleteFolder?.(folderDeleteConfirmation.folder.id);
    }
    setFolderDeleteConfirmation({ isOpen: false, folder: null });
  };

  const handleCancelFolderDelete = () => {
    setFolderDeleteConfirmation({ isOpen: false, folder: null });
  };

  // ============================================================================
  // Move to Folder Handlers
  // ============================================================================

  const handleShowMoveToFolder = (item: SimpleSidebarItem) => {
    setMoveToFolderModal({ isOpen: true, item });
  };

  const handleConfirmMoveToFolder = (config: MoveToFolderConfig) => {
    if (!moveToFolderModal.item) return;

    if (config.isNewFolder && config.newFolderName) {
      onCreateFolderAndMoveItem?.(moveToFolderModal.item.id, config.newFolderName);
    } else {
      onMoveItemToFolder?.(moveToFolderModal.item.id, config.folderId);
    }
    setMoveToFolderModal({ isOpen: false, item: null });
  };

  const handleCancelMoveToFolder = () => {
    setMoveToFolderModal({ isOpen: false, item: null });
  };

  const getAvailableFoldersForMove = () => {
    return folders.map((f) => ({ id: f.id, label: f.label }));
  };

  // ============================================================================
  // Collapsed State
  // ============================================================================
  if (isCollapsed) {
    return (
      <div className="px-2 py-3 h-full w-full bg-transparent flex text-sm flex-col antialiased font-sf">
        <div className="flex flex-col items-center px-1 pt-1 pb-3 border-b border-gray-100 mb-2">
          <TertiaryIconButton
            icon={<SidebarSimpleIcon size={16} weight="regular" className="text-gray-800" />}
            onClick={onToggleCollapse}
            title="Expand sidebar"
          />
        </div>

        <div className="flex-1 px-1">
          <div className="flex flex-col items-center gap-1">
            <PrimaryIconButton
              icon={<PlusIcon size={16} weight="bold" />}
              onClick={onNewChatClick}
              title="New Chat"
            />

            <div
              className="relative mt-2"
              onMouseEnter={() => handleChatsHover(true)}
              onMouseLeave={() => handleChatsHover(false)}
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
                              flex items-center gap-2.5 px-3 py-1.5 text-sm
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

        {(userName || userEmail || avatarLabel) && (
          <div className="mt-auto pt-2 px-1 border-t border-gray-100">
            <button
              ref={avatarButtonRef}
              onClick={handleAvatarClick}
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

        <ProfilePopover
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          userEmail={userEmail}
          position={popoverPosition}
          onSettingsClick={onSettingsClick}
          onSignOutClick={onSignOutClick}
        />
      </div>
    );
  }

  // ============================================================================
  // Expanded State
  // ============================================================================
  return (
    <div className="relative px-2 py-3 h-full w-full bg-transparent flex text-sm flex-col overflow-hidden antialiased font-sf">
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
            className="flex-1 bg-transparent border-0 outline-none text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <SecondaryIconButton
          icon={<ArrowsInLineVerticalIcon size={14} weight="regular" className="text-gray-600" />}
          onClick={handleCollapseAll}
        />
      </div>

      {/* New Chat Button */}
      <div className="my-2 px-1">
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
        {/* Chats Section */}
        <div className="mb-1">
          <SectionHeader
            label="Chats"
            isExpanded={isChatsExpanded}
            onToggle={() => setIsChatsExpanded(!isChatsExpanded)}
            onAdd={onNewFolderClick}
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
                {/* Folders */}
                {folders.map((folder) => {
                  const folderItems = itemsByFolder[folder.id] || [];
                  if (folderItems.length === 0 && searchValue) return null;

                  return (
                    <FolderSection
                      key={folder.id}
                      folder={folder}
                      items={folderItems}
                      selectedItemId={selectedItemId}
                      menuOpenItemId={contextMenu.isOpen ? contextMenu.item?.id : null}
                      editingItemId={editingItemId}
                      isFolderEditing={editingFolderId === folder.id}
                      isFolderMenuOpen={
                        folderContextMenu.isOpen && folderContextMenu.folder?.id === folder.id
                      }
                      onItemClick={(id) => onItemClick?.(id)}
                      onItemContextMenu={handleContextMenu}
                      onToggle={(isExpanded) => onFolderToggle?.(folder.id, isExpanded)}
                      onSaveEdit={handleSaveRename}
                      onCancelEdit={handleCancelRename}
                      onFolderContextMenu={(e) => handleFolderContextMenu(e, folder)}
                      onSaveFolderEdit={(newName) => handleSaveFolderRename(folder, newName)}
                      onCancelFolderEdit={handleCancelFolderRename}
                    />
                  );
                })}
                {/* Root items */}
                {rootItems.map((item) => (
                  <SidebarItemRow
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* User Profile Section */}
      {(userName || userEmail || avatarLabel) && (
        <div className="mt-auto pt-2 border-t border-gray-100 px-1">
          <button
            ref={avatarButtonRef}
            onClick={handleAvatarClick}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
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
            <div className="flex-1 min-w-0 text-left">
              {userName && <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>}
              {userEmail && <p className="text-[11px] text-gray-500 truncate">{userEmail}</p>}
            </div>
            <CaretRightIcon size={12} className="text-gray-400 flex-shrink-0" />
          </button>
        </div>
      )}

      {/* Profile Popover */}
      <ProfilePopover
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userEmail={userEmail}
        position={popoverPosition}
        onSettingsClick={onSettingsClick}
        onSignOutClick={onSignOutClick}
      />

      {/* Context Menu for Items */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
        items={getContextMenuItems({
          includeMove: true,
          isInFolder: !!contextMenu.item?.folderId,
        })}
        fixedPosition={contextMenu.position}
        onItemClick={(menuItem) => {
          if (!contextMenu.item) return;
          if (menuItem.id === 'rename') {
            handleStartRename(contextMenu.item);
          } else if (menuItem.id === 'delete') {
            handleShowDeleteConfirmation(contextMenu.item);
          } else if (menuItem.id === 'move') {
            handleShowMoveToFolder(contextMenu.item);
          } else if (menuItem.id === 'remove-from-folder') {
            onRemoveItemFromFolder?.(contextMenu.item.id);
          }
          setContextMenu({ ...contextMenu, isOpen: false });
        }}
      />

      {/* Context Menu for Folders */}
      <ContextMenu
        isOpen={folderContextMenu.isOpen}
        onClose={() => setFolderContextMenu({ ...folderContextMenu, isOpen: false })}
        items={[
          { id: 'rename', label: 'Rename', icon: <PencilSimpleIcon size={14} /> },
          { id: 'delete', label: 'Delete', icon: <TrashIcon size={14} />, variant: 'danger' },
        ]}
        fixedPosition={folderContextMenu.position}
        onItemClick={(menuItem) => {
          if (!folderContextMenu.folder) return;
          if (menuItem.id === 'rename') {
            handleStartFolderRename(folderContextMenu.folder);
          } else if (menuItem.id === 'delete') {
            handleShowFolderDeleteConfirmation(folderContextMenu.folder);
          }
          setFolderContextMenu({ ...folderContextMenu, isOpen: false });
        }}
      />

      {/* Delete Confirmation for Items */}
      <DeleteConfirmationPopup
        isOpen={deleteConfirmation.isOpen}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        itemLabel={deleteConfirmation.item?.label || ''}
        itemType="chat"
      />

      {/* Delete Confirmation for Folders */}
      <DeleteConfirmationPopup
        isOpen={folderDeleteConfirmation.isOpen}
        onCancel={handleCancelFolderDelete}
        onConfirm={handleConfirmFolderDelete}
        itemLabel={folderDeleteConfirmation.folder?.label || ''}
        itemType="folder"
      />

      {/* Move to Folder Modal */}
      <MoveToFolderModal
        isOpen={moveToFolderModal.isOpen}
        onCancel={handleCancelMoveToFolder}
        onConfirm={handleConfirmMoveToFolder}
        itemName={moveToFolderModal.item?.label || ''}
        folders={getAvailableFoldersForMove()}
        currentFolderId={moveToFolderModal.item?.folderId || undefined}
      />
    </div>
  );
};

export default ChatSidebarSimple;
