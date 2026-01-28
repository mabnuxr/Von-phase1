import React, { useState, useRef, useEffect } from 'react';
import { ChatTextIcon, DotsThreeIcon } from '@phosphor-icons/react';
import { PrimaryIconButton } from '../../forms/buttons';
import type { SidebarItem } from '../ChatSidebarV2';

export interface ConversationItemProps {
  item: SidebarItem;
  isSelected: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  isMenuOpen?: boolean;
  isEditing?: boolean;
  onSaveEdit?: (newName: string) => void;
  onCancelEdit?: () => void;
}

/**
 * ConversationItem - A single conversation row in the sidebar
 *
 * Features:
 * - Chat icon always displayed
 * - Inline editing with Enter to save, Escape to cancel
 * - Context menu trigger on hover or right-click
 * - Link wrapper if href is present
 */
export const ConversationItem: React.FC<ConversationItemProps> = ({
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

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset edit value when item label changes or editing starts
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
      {/* Chat icon - always visible */}
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
          <span className="flex-1 text-sm text-gray-900 truncate">{item.label}</span>

          {/* More options button - shows on hover or when menu is open */}
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

export default ConversationItem;
