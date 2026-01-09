import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderSimpleIcon, FolderPlusIcon, CheckIcon } from '@phosphor-icons/react';

// ============================================================================
// Types
// ============================================================================

export interface MoveToFolderFolder {
  id: string;
  label: string;
}

export interface MoveToFolderConfig {
  /** The target folder ID (not used if isNewFolder is true) */
  folderId: string;
  /** Whether this is a new folder being created */
  isNewFolder: boolean;
  /** Name for the new folder (only used if isNewFolder is true) */
  newFolderName?: string;
}

export interface MoveToFolderModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * The name of the item being moved
   */
  itemName: string;

  /**
   * The type of item being moved
   */
  itemType: 'chat';

  /**
   * Available folders to move to
   */
  folders: MoveToFolderFolder[];

  /**
   * Current folder ID (to exclude from options)
   */
  currentFolderId?: string | null;

  /**
   * Callback when user confirms the move
   */
  onConfirm: (config: MoveToFolderConfig) => void;

  /**
   * Callback when user cancels
   */
  onCancel: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * MoveToFolderModal - A slide-up modal for moving items between folders
 *
 * Features:
 * - List of existing folders to choose from
 * - Option to create a new folder
 * - Inline input for new folder name
 * - Animated slide-up panel
 * - Backdrop blur overlay
 */
export const MoveToFolderModal: React.FC<MoveToFolderModalProps> = ({
  isOpen,
  itemName,
  itemType,
  folders,
  currentFolderId,
  onConfirm,
  onCancel,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter out current folder from options
  const availableFolders = folders.filter((f) => f.id !== currentFolderId);

  // Focus input when creating new folder
  useEffect(() => {
    if (isCreatingNew && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreatingNew]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFolderId(null);
      setIsCreatingNew(false);
      setNewFolderName('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (isCreatingNew && newFolderName.trim()) {
      onConfirm({
        folderId: '',
        isNewFolder: true,
        newFolderName: newFolderName.trim(),
      });
    } else if (selectedFolderId) {
      onConfirm({
        folderId: selectedFolderId,
        isNewFolder: false,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newFolderName.trim()) {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const canConfirm = (isCreatingNew && newFolderName.trim()) || selectedFolderId;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-[99] bg-white/10 backdrop-blur-[1.75px]"
            onClick={onCancel}
          />

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-0 left-0 right-0 h-[70%] z-[100] flex flex-col rounded-t-2xl overflow-hidden bg-gradient-to-b from-white to-gray-50"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
              <div className="p-1.5 rounded-lg bg-gray-100">
                <FolderSimpleIcon size={18} weight="duotone" className="text-gray-700" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">Move to Folder</h3>
                <p className="text-xs text-gray-500 truncate">
                  Moving "{itemName}"
                </p>
              </div>
            </div>

            {/* Folder list */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
              {/* Create new folder option */}
              <button
                onClick={() => {
                  setIsCreatingNew(true);
                  setSelectedFolderId(null);
                }}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px]
                  transition-colors cursor-pointer text-left
                  ${isCreatingNew ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'}
                `}
              >
                <FolderPlusIcon size={16} weight="regular" />
                <span className="font-medium">Create new folder</span>
              </button>

              {/* New folder name input */}
              <AnimatePresence>
                {isCreatingNew && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 py-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="New folder name..."
                        className="w-full text-[13px] text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-400"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Divider if there are folders */}
              {availableFolders.length > 0 && (
                <div className="border-t border-gray-100 my-2" />
              )}

              {/* Existing folders */}
              {availableFolders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => {
                    setSelectedFolderId(folder.id);
                    setIsCreatingNew(false);
                  }}
                  className={`
                    w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-[13px]
                    transition-colors cursor-pointer text-left
                    ${selectedFolderId === folder.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-900'}
                  `}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FolderSimpleIcon size={16} weight="regular" className="flex-shrink-0" />
                    <span className="truncate">{folder.label}</span>
                  </div>
                  {selectedFolderId === folder.id && (
                    <CheckIcon size={14} weight="bold" className="text-indigo-600 flex-shrink-0" />
                  )}
                </button>
              ))}

              {/* Empty state */}
              {availableFolders.length === 0 && !isCreatingNew && (
                <div className="py-4 text-center">
                  <p className="text-xs text-gray-400">No folders available</p>
                  <p className="text-xs text-gray-400 mt-1">Create a new folder above</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 px-4 py-3 border-t border-gray-100 bg-white">
              <button
                onClick={handleConfirm}
                disabled={!canConfirm}
                className={`
                  w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer
                  ${canConfirm
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                `}
              >
                {isCreatingNew ? 'Create & Move' : 'Move'}
              </button>
              <button
                onClick={onCancel}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MoveToFolderModal;
