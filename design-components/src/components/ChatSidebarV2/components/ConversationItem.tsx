import React, { useState, useRef, useEffect } from 'react';
import { ChatTextIcon, DotsThreeIcon, SpinnerGapIcon } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
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
 * - Status indicators (running spinner, complete green dot)
 * - Chat icon displayed when no status
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

  // Handle click: use SPA navigation (preventDefault) for normal clicks,
  // allow Cmd/Ctrl+Click and middle-click for native "open in new tab"
  const handleClick = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.button === 1) return;
    e.preventDefault();
    onClick();
  };

  const content = (
    <div
      className={`
        group relative flex items-center gap-2.5 px-2 h-8 rounded-lg text-sm
        transition-colors duration-150
        ${isEditing ? 'bg-gray-50' : isSelected ? 'bg-gray-50 cursor-pointer' : 'hover:bg-gray-50 cursor-pointer'}
      `}
      onClick={isEditing ? undefined : handleClick}
      onContextMenu={isEditing ? undefined : onContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={isEditing ? undefined : item.label}
    >
      {/* Status indicator - spinning for running, green dot for complete */}
      {item.status === 'running' && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="flex-shrink-0"
        >
          <SpinnerGapIcon size={14} weight="regular" className="text-indigo-600" />
        </motion.div>
      )}
      {item.status === 'complete' && (
        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      )}

      {/* Chat icon - only when no status */}
      {(!item.status || item.status === 'idle') && (
        <ChatTextIcon size={16} weight="regular" className="text-gray-700 flex-shrink-0" />
      )}

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
