import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConversationItem } from './ConversationItem';
import type { SidebarItem } from '../ChatSidebarV2';

export interface FolderContentsProps {
  isExpanded: boolean;
  isLoading?: boolean;
  items: SidebarItem[];
  selectedItemId?: string;
  menuOpenItemId?: string | null;
  editingItemId?: string | null;
  onItemClick: (id: string) => void;
  onItemContextMenu: (e: React.MouseEvent, item: SidebarItem) => void;
  onSaveEdit?: (item: SidebarItem, newName: string) => void;
  onCancelEdit?: () => void;
}

/**
 * FolderContents - The expandable content area of a folder
 *
 * Features:
 * - Animated expand/collapse
 * - Loading skeleton
 * - Empty state
 * - List of conversation items
 */
export const FolderContents: React.FC<FolderContentsProps> = ({
  isExpanded,
  isLoading = false,
  items,
  selectedItemId,
  menuOpenItemId,
  editingItemId,
  onItemClick,
  onItemContextMenu,
  onSaveEdit,
  onCancelEdit,
}) => {
  return (
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
            // Loading skeleton for folder contents
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
            // Empty state for folder
            <div className="py-2 px-2">
              <p className="text-[11px] text-gray-400">No items in folder</p>
            </div>
          ) : (
            items.map((item) => (
              <ConversationItem
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
            ))
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FolderContents;
