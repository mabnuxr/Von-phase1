import React, { useState, useRef, useEffect } from 'react';
import { FolderSimpleIcon, DotsThreeIcon, PushPinIcon } from '@phosphor-icons/react';
import { PrimaryIconButton } from '../../forms/buttons';
import type { Folder } from '../ChatSidebar';

export interface FolderRowProps {
  folder: Folder;
  isEditing?: boolean;
  isMenuOpen?: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onPinFolder?: () => void;
  onSaveEdit?: (newName: string) => void;
  onCancelEdit?: () => void;
}

/**
 * FolderRow - The header row for a folder
 *
 * Features:
 * - Folder icon + name
 * - Pin icon (visible on hover or when pinned)
 * - Inline editing for rename
 * - Click to toggle expansion
 * - Context menu on right-click or button click
 */
export const FolderRow: React.FC<FolderRowProps> = ({
  folder,
  isEditing = false,
  isMenuOpen = false,
  onClick,
  onContextMenu,
  onPinFolder,
  onSaveEdit,
  onCancelEdit,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [editValue, setEditValue] = useState(folder.label);
  const inputRef = useRef<HTMLInputElement>(null);
  // System folders allow pin/unpin but no rename or delete — show the pin
  // affordance, hide the kebab.
  const hasActions = !!onPinFolder || (!folder.isSystem && !!onContextMenu);
  const showButton = !folder.isSystem && !!onContextMenu && (isHovered || isMenuOpen) && !isEditing;
  const showPinButton = !!onPinFolder && (folder.isPinned || isHovered) && !isEditing;

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset edit value when folder label changes or editing starts
  useEffect(() => {
    setEditValue(folder.label);
  }, [folder.label, isEditing]);

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== folder.label) {
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

  return (
    <div
      className="group relative flex items-center justify-between gap-2.5 px-2 h-8 text-sm text-gray-800 hover:text-gray-900 rounded-xl border border-transparent hover:bg-gray-50 hover:border-gray-200 hover:shadow-xs transition-colors duration-150 cursor-pointer"
      onClick={isEditing ? undefined : onClick}
      onContextMenu={isEditing || folder.isSystem ? undefined : onContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <FolderSimpleIcon
          size={16}
          weight="regular"
          className="text-gray-800 mb-[1px] flex-shrink-0"
        />

        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="flex-1 text-sm text-gray-900 bg-white border border-gray-200 rounded-md px-1.5 py-0.5 outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-left truncate min-w-0" title={folder.label}>
            {folder.label}
          </span>
        )}
      </div>

      {!isEditing && hasActions && (
        <div className="flex items-center gap-0.5 flex-shrink-0 h-6">
          {/* Pin button: always rendered, uses opacity to avoid layout shifts */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPinFolder?.();
            }}
            className={`flex items-center justify-center w-6 h-6 rounded-md hover:bg-gray-100 transition-all cursor-pointer ${
              showPinButton ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            title={folder.isPinned ? 'Unpin folder' : 'Pin folder'}
          >
            <PushPinIcon
              size={14}
              weight={folder.isPinned ? 'fill' : 'regular'}
              className={
                folder.isPinned
                  ? 'text-gray-400 hover:text-gray-600'
                  : 'text-gray-800 hover:text-gray-900'
              }
            />
          </button>
          {/* Three-dot menu: only rendered when hovered/menu open so pin moves to far right when idle */}
          {showButton && (
            <PrimaryIconButton
              icon={<DotsThreeIcon size={16} weight="bold" />}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                onContextMenu?.(e);
              }}
              visible={true}
              size="small"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default FolderRow;
