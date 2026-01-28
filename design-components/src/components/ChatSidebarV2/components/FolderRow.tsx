import React, { useState, useRef, useEffect } from 'react';
import { FolderSimpleIcon, DotsThreeIcon } from '@phosphor-icons/react';
import { PrimaryIconButton } from '../../forms/buttons';
import type { Folder } from '../ChatSidebarV2';

export interface FolderRowProps {
  folder: Folder;
  isEditing?: boolean;
  isMenuOpen?: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onSaveEdit?: (newName: string) => void;
  onCancelEdit?: () => void;
}

/**
 * FolderRow - The header row for a folder
 *
 * Features:
 * - Folder icon + name
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
  onSaveEdit,
  onCancelEdit,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [editValue, setEditValue] = useState(folder.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const showButton = (isHovered || isMenuOpen) && !isEditing;

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
      className="group relative flex items-center justify-between gap-2.5 px-2 py-1 text-sm text-gray-800 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
      onClick={isEditing ? undefined : onClick}
      onContextMenu={isEditing ? undefined : onContextMenu}
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
            className="flex-1 text-sm text-gray-900 bg-white border border-gray-200 rounded px-1.5 py-0.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-left truncate">{folder.label}</span>
        )}
      </div>

      {/* More options button - shows on hover or when menu is open */}
      {!isEditing && (
        <PrimaryIconButton
          icon={<DotsThreeIcon size={16} weight="bold" />}
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            onContextMenu?.(e);
          }}
          visible={showButton}
          size="small"
        />
      )}
    </div>
  );
};

export default FolderRow;
