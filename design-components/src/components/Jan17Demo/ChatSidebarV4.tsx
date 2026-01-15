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
  BuildingOfficeIcon,
  UserSquareIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CaretUpDownIcon,
  UsersIcon,
} from '@phosphor-icons/react';
// CaretDownIcon and CaretRightIcon used in FolderSection for expand/collapse
import {
  PrimaryButton,
  AddButton,
  PrimaryIconButton,
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
import { ChatSidebarSkeleton } from '../ChatSidebarV3/ChatSidebarSkeleton';

const VON_COMBINATION_MARK_URL =
  'https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/von_combination_mark.svg';

// ============================================================================
// Types
// ============================================================================

export type ItemType = 'chat' | 'dashboard';
export type OwnershipType = 'mine' | 'shared' | 'shared_by_me';

export interface SidebarItem {
  id: string;
  label: string;
  type: ItemType;
  href?: string;
  ownership?: OwnershipType;
  ownerName?: string;
  folderId?: string | null;
}

export interface Folder {
  id: string;
  label: string;
  isExpanded?: boolean;
}

export type FolderItemsMap = Record<string, SidebarItem[]>;
export type FolderLoadingMap = Record<string, boolean>;

export interface ChatSidebarV4Props {
  items?: SidebarItem[];
  folders?: Folder[];
  folderItems?: FolderItemsMap;
  folderLoadingMap?: FolderLoadingMap;
  isLoading?: boolean;
  selectedItemId?: string;
  onItemClick?: (id: string, type: ItemType) => void;
  onNewChatClick?: () => void;
  onNewChatFolderClick?: () => void;
  onRenameItem?: (id: string, type: ItemType, newName: string) => void;
  onDeleteItem?: (id: string, type: ItemType) => void;
  onFolderToggle?: (folderId: string, isExpanded: boolean) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onMoveItemToFolder?: (itemId: string, itemType: ItemType, folderId: string) => void;
  onCreateFolderAndMoveItem?: (itemId: string, itemType: ItemType, newFolderName: string) => void;
  onRemoveItemFromFolder?: (itemId: string, itemType: ItemType) => void;
  onSearchChange?: (value: string) => void;
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
// Sub-components
// ============================================================================

const getContextMenuItems = (
  options: {
    isInFolder?: boolean;
  } = {}
): ContextMenuItem[] => {
  const { isInFolder = false } = options;
  return [
    { id: 'rename', label: 'Rename', icon: <PencilSimpleIcon size={14} /> },
    { id: 'move', label: 'Move to Folder', icon: <ArrowBendUpRightIcon size={14} /> },
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

const getFolderContextMenuItems = (): ContextMenuItem[] => [
  { id: 'rename', label: 'Rename', icon: <PencilSimpleIcon size={14} /> },
  { id: 'delete', label: 'Delete', icon: <TrashIcon size={14} />, variant: 'danger' },
];

interface SectionHeaderProps {
  label: string;
  onAdd?: () => void;
  addButtonLabel?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  label,
  onAdd,
  addButtonLabel = 'Add new',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="flex items-center justify-between px-2 py-1.5 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="text-xs font-medium text-gray-700">{label}</span>
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
  item: SidebarItem;
  isSelected: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  showIcon?: boolean;
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
  showIcon = false,
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
        group relative flex items-center gap-2.5 px-2 py-1 rounded-lg text-[13px]
        transition-colors duration-150
        ${isEditing ? 'bg-gray-50' : isSelected ? 'bg-gray-50 cursor-pointer' : 'hover:bg-gray-50 cursor-pointer'}
      `}
      onClick={isEditing ? undefined : onClick}
      onContextMenu={isEditing ? undefined : onContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={isEditing ? undefined : item.label}
    >
      {showIcon &&
        (item.type === 'dashboard' ? (
          <span
            className="flex-shrink-0"
            title={
              item.ownership === 'shared'
                ? `Shared by ${item.ownerName || 'someone'}`
                : item.ownership === 'shared_by_me'
                  ? 'Shared by you'
                  : 'Private'
            }
          >
            {item.ownership === 'shared' ? (
              <BuildingOfficeIcon size={16} weight="regular" className="text-gray-700" />
            ) : item.ownership === 'shared_by_me' ? (
              <UsersIcon size={16} weight="regular" className="text-gray-700" />
            ) : (
              <UserSquareIcon size={16} weight="regular" className="text-gray-700" />
            )}
          </span>
        ) : (
          <ChatTextIcon size={16} weight="regular" className="text-gray-700 flex-shrink-0" />
        ))}

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="flex-1 text-[13px] text-gray-900 bg-white border border-gray-200 rounded px-1.5 py-0.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span
            className={`flex-1 text-[13px] truncate ${
              isSelected ? 'text-gray-900' : 'text-gray-900'
            }`}
          >
            {item.label}
          </span>

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
  folder: Folder;
  items: SidebarItem[];
  selectedItemId?: string;
  menuOpenItemId?: string | null;
  editingItemId?: string | null;
  isFolderEditing?: boolean;
  isFolderMenuOpen?: boolean;
  isLoading?: boolean;
  onItemClick: (id: string, type: ItemType) => void;
  onItemContextMenu: (e: React.MouseEvent, item: SidebarItem) => void;
  onToggle: (isExpanded: boolean) => void;
  onSaveEdit?: (item: SidebarItem, newName: string) => void;
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
  isLoading = false,
  onItemClick,
  onItemContextMenu,
  onToggle,
  onSaveEdit,
  onCancelEdit,
  onFolderContextMenu,
  onSaveFolderEdit,
  onCancelFolderEdit,
}) => {
  // Folders start collapsed by default (isExpanded defaults to false)
  const isExpanded = folder.isExpanded ?? false;
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
        className="group relative flex items-center justify-between gap-2.5 px-2 py-1 text-[13px] text-gray-800 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
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
              className="flex-1 text-[13px] text-gray-900 bg-white border border-gray-200 rounded px-1.5 py-0.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-left truncate">{folder.label}</span>
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
            {isLoading ? (
              <div className="space-y-1 py-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2.5 px-2 py-1.5">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                    <div
                      className="h-4 flex-1 bg-gray-200 rounded animate-pulse"
                      style={{ maxWidth: `${50 + i * 15}%` }}
                    />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="py-2 px-2">
                <p className="text-[11px] text-gray-400">No items in folder</p>
              </div>
            ) : (
              items.map((item) => (
                <SidebarItemRow
                  key={item.id}
                  item={item}
                  isSelected={item.id === selectedItemId}
                  onClick={() => onItemClick(item.id, item.type)}
                  onContextMenu={(e) => onItemContextMenu(e, item)}
                  showIcon={true}
                  isMenuOpen={menuOpenItemId === item.id}
                  isEditing={editingItemId === item.id}
                  onSaveEdit={(newName) => onSaveEdit?.(item, newName)}
                  onCancelEdit={onCancelEdit}
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const ChatSidebarV4: React.FC<ChatSidebarV4Props> = ({
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
  onFolderToggle,
  onRenameFolder,
  onDeleteFolder,
  onMoveItemToFolder,
  onCreateFolderAndMoveItem,
  onRemoveItemFromFolder,
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
  const [searchValue, setSearchValue] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { top: number; left: number };
    item: SidebarItem | null;
  }>({ isOpen: false, position: { top: 0, left: 0 }, item: null });

  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    item: SidebarItem | null;
  }>({ isOpen: false, item: null });

  const [folderContextMenu, setFolderContextMenu] = useState<{
    isOpen: boolean;
    position: { top: number; left: number };
    folder: Folder | null;
  }>({ isOpen: false, position: { top: 0, left: 0 }, folder: null });

  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

  const [folderDeleteConfirmation, setFolderDeleteConfirmation] = useState<{
    isOpen: boolean;
    folder: Folder | null;
  }>({ isOpen: false, folder: null });


  const [moveToFolderModal, setMoveToFolderModal] = useState<{
    isOpen: boolean;
    item: SidebarItem | null;
  }>({ isOpen: false, item: null });

  const chatButtonRef = useRef<HTMLButtonElement>(null);
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

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const itemsByFolder = folders.reduce(
    (acc, folder) => {
      const itemsFromProp = folderItems[folder.id] || [];
      const itemsFromFilter = filteredItems.filter((item) => item.folderId === folder.id);
      const folderItemsList = itemsFromProp.length > 0 ? itemsFromProp : itemsFromFilter;

      acc[folder.id] = searchValue
        ? folderItemsList.filter((item) =>
            item.label.toLowerCase().includes(searchValue.toLowerCase())
          )
        : folderItemsList;
      return acc;
    },
    {} as Record<string, SidebarItem[]>
  );

  const rootItems = filteredItems.filter((item) => !item.folderId);
  const rootChats = rootItems.filter((item) => item.type === 'chat');
  const rootDashboards = rootItems.filter((item) => item.type === 'dashboard');

  const handleContextMenu = (e: React.MouseEvent, item: SidebarItem) => {
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

  const handleStartRename = (item: SidebarItem) => {
    setEditingItemId(item.id);
  };

  const handleSaveRename = (item: SidebarItem, newName: string) => {
    onRenameItem?.(item.id, item.type, newName);
    setEditingItemId(null);
  };

  const handleCancelRename = () => {
    setEditingItemId(null);
  };

  const handleShowDeleteConfirmation = (item: SidebarItem) => {
    setDeleteConfirmation({ isOpen: true, item });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation.item) {
      onDeleteItem?.(deleteConfirmation.item.id, deleteConfirmation.item.type);
    }
    setDeleteConfirmation({ isOpen: false, item: null });
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, item: null });
  };

  const handleFolderContextMenu = (e: React.MouseEvent, folder: Folder) => {
    e.preventDefault();
    e.stopPropagation();
    setFolderContextMenu({
      isOpen: true,
      position: { top: e.clientY, left: e.clientX + 8 },
      folder,
    });
  };

  const handleStartFolderRename = (folder: Folder) => {
    setEditingFolderId(folder.id);
  };

  const handleSaveFolderRename = (folder: Folder, newName: string) => {
    onRenameFolder?.(folder.id, newName);
    setEditingFolderId(null);
  };

  const handleCancelFolderRename = () => {
    setEditingFolderId(null);
  };

  const handleShowFolderDeleteConfirmation = (folder: Folder) => {
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

  const handleShowMoveToFolder = (item: SidebarItem) => {
    setMoveToFolderModal({ isOpen: true, item });
  };

  const handleConfirmMoveToFolder = (config: MoveToFolderConfig) => {
    if (!moveToFolderModal.item) return;

    if (config.isNewFolder && config.newFolderName) {
      onCreateFolderAndMoveItem?.(
        moveToFolderModal.item.id,
        moveToFolderModal.item.type,
        config.newFolderName
      );
    } else {
      onMoveItemToFolder?.(moveToFolderModal.item.id, moveToFolderModal.item.type, config.folderId);
    }
    setMoveToFolderModal({ isOpen: false, item: null });
  };

  const handleCancelMoveToFolder = () => {
    setMoveToFolderModal({ isOpen: false, item: null });
  };

  const handleRemoveFromFolder = (item: SidebarItem) => {
    onRemoveItemFromFolder?.(item.id, item.type);
  };

  const getAvailableFoldersForMove = () => {
    return folders.map((f) => ({ id: f.id, label: f.label }));
  };

  // ============================================================================
  // Collapsed State
  // ============================================================================
  if (isCollapsed) {
    return (
      <div className="px-2 py-3 h-full w-full bg-transparent flex text-[13px] flex-col antialiased font-sf">
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
                title="Chats & Dashboards"
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
                              flex items-center gap-2.5 px-3 py-1.5 text-[13px]
                              transition-all duration-150 cursor-pointer
                              ${isSelected ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-900 hover:bg-gray-50'}
                            `}
                            onClick={() => onItemClick?.(item.id, item.type)}
                            title={item.label}
                          >
                            {item.type === 'dashboard' ? (
                              <span
                                className="flex-shrink-0"
                                title={
                                  item.ownership === 'shared'
                                    ? `Shared by ${item.ownerName || 'someone'}`
                                    : item.ownership === 'shared_by_me'
                                      ? 'Shared by you'
                                      : 'Private'
                                }
                              >
                                {item.ownership === 'shared' ? (
                                  <BuildingOfficeIcon
                                    size={16}
                                    weight="regular"
                                    className="text-gray-800"
                                  />
                                ) : item.ownership === 'shared_by_me' ? (
                                  <UsersIcon size={16} weight="regular" className="text-gray-800" />
                                ) : (
                                  <UserSquareIcon
                                    size={16}
                                    weight="regular"
                                    className="text-gray-800"
                                  />
                                )}
                              </span>
                            ) : (
                              <ChatTextIcon
                                size={16}
                                weight="regular"
                                className="text-gray-800 flex-shrink-0"
                              />
                            )}
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

      {/* Search (no collapse all button) */}
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
      </div>

      {/* New Chat Button Only */}
      <div className="my-2 px-1 flex flex-col gap-1.5">
        <PrimaryButton
          onClick={onNewChatClick}
          className="flex-1 flex items-center justify-center gap-1.5"
        >
          <PlusIcon size={14} weight="bold" />
          New Chat
        </PrimaryButton>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-1 min-h-0">
        {isLoading && <ChatSidebarSkeleton />}

        {/* Projects Section (formerly Folders) */}
        {!isLoading && folders.length > 0 && (
          <div className="mb-2">
            <SectionHeader
              label="Projects"
              onAdd={onNewChatFolderClick}
              addButtonLabel="Add"
            />
            <div>
              {folders.map((folder) => {
                const folderItemsList = itemsByFolder[folder.id] || [];
                const isFolderLoading = folderLoadingMap[folder.id] || false;

                return (
                  <FolderSection
                    key={folder.id}
                    folder={folder}
                    items={folderItemsList}
                    selectedItemId={selectedItemId}
                    menuOpenItemId={contextMenu.isOpen ? contextMenu.item?.id : null}
                    editingItemId={editingItemId}
                    isFolderEditing={editingFolderId === folder.id}
                    isFolderMenuOpen={
                      folderContextMenu.isOpen && folderContextMenu.folder?.id === folder.id
                    }
                    isLoading={isFolderLoading}
                    onItemClick={(id, type) => onItemClick?.(id, type)}
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
            </div>
          </div>
        )}

        {/* Dashboards Section */}
        {!isLoading && rootDashboards.length > 0 && (
          <div className="mb-2">
            <SectionHeader label="Dashboards" />
            <div>
              {rootDashboards.map((item) => (
                <SidebarItemRow
                  key={item.id}
                  item={item}
                  isSelected={item.id === selectedItemId}
                  onClick={() => onItemClick?.(item.id, item.type)}
                  onContextMenu={(e) => handleContextMenu(e, item)}
                  showIcon={true}
                  isMenuOpen={contextMenu.isOpen && contextMenu.item?.id === item.id}
                  isEditing={editingItemId === item.id}
                  onSaveEdit={(newName) => handleSaveRename(item, newName)}
                  onCancelEdit={handleCancelRename}
                />
              ))}
            </div>
          </div>
        )}

        {/* Chats Section */}
        {!isLoading && rootChats.length > 0 && (
          <div className="mb-2">
            <SectionHeader label="Chats" />
            <div>
              {rootChats.map((item) => (
                <SidebarItemRow
                  key={item.id}
                  item={item}
                  isSelected={item.id === selectedItemId}
                  onClick={() => onItemClick?.(item.id, item.type)}
                  onContextMenu={(e) => handleContextMenu(e, item)}
                  showIcon={false}
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
        {!isLoading && filteredItems.length === 0 && folders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
            <ChatTextIcon size={24} weight="duotone" className="text-gray-300 mb-1" />
            <p className="text-[13px] text-gray-500">
              {searchValue ? 'No results found' : 'No chats or dashboards yet'}
            </p>
          </div>
        )}

        {loadMoreRef && <div ref={loadMoreRef} className="h-px flex-shrink-0" />}
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
            <motion.div animate={{ y: [0, 2, 0] }} transition={{ duration: 1, repeat: Infinity }}>
              <CaretDownIcon size={12} weight="bold" />
            </motion.div>
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
      {(userName || userEmail || avatarLabel) && (
        <div className="mt-auto pt-2 px-1 border-t border-gray-100">
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
              {userName && (
                <p className="text-[13px] font-medium text-gray-900 truncate">{userName}</p>
              )}
              {userEmail && <p className="text-[11px] text-gray-500 truncate">{userEmail}</p>}
            </div>
            <CaretUpDownIcon size={14} className="text-gray-400 flex-shrink-0" />
          </button>
        </div>
      )}

      {/* Profile Popover */}
      <ProfilePopover
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
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

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
        items={getContextMenuItems({ isInFolder: !!contextMenu.item?.folderId })}
        fixedPosition={contextMenu.position}
        width={160}
        onItemClick={(item) => {
          if (item.id === 'rename' && contextMenu.item) {
            handleStartRename(contextMenu.item);
          } else if (item.id === 'move' && contextMenu.item) {
            handleShowMoveToFolder(contextMenu.item);
          } else if (item.id === 'remove-from-folder' && contextMenu.item) {
            handleRemoveFromFolder(contextMenu.item);
          } else if (item.id === 'delete' && contextMenu.item) {
            handleShowDeleteConfirmation(contextMenu.item);
          }
          setContextMenu({ ...contextMenu, isOpen: false });
        }}
      />

      {/* Delete Confirmation Popup */}
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
        onClose={() => setFolderContextMenu({ ...folderContextMenu, isOpen: false })}
        items={getFolderContextMenuItems()}
        fixedPosition={folderContextMenu.position}
        width={128}
        onItemClick={(item) => {
          if (item.id === 'rename' && folderContextMenu.folder) {
            handleStartFolderRename(folderContextMenu.folder);
          } else if (item.id === 'delete' && folderContextMenu.folder) {
            handleShowFolderDeleteConfirmation(folderContextMenu.folder);
          }
          setFolderContextMenu({ ...folderContextMenu, isOpen: false });
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
        itemType={moveToFolderModal.item?.type || 'chat'}
        folders={getAvailableFoldersForMove()}
        onConfirm={handleConfirmMoveToFolder}
        onCancel={handleCancelMoveToFolder}
      />
    </div>
  );
};

export default ChatSidebarV4;
