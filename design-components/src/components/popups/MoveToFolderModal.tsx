import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderSimple, Plus } from '@phosphor-icons/react';
import { TextInput } from '../forms/input';
import { Select } from '../forms/dropdown';
import { PrimaryButton, SecondaryButton } from '../forms/buttons';

// ============================================================================
// Types
// ============================================================================

export interface FolderOption {
  id: string;
  label: string;
}

// Alias for compatibility
export type MoveToFolderFolder = FolderOption;

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
   * The name of the item being moved (for display)
   */
  itemName: string;

  /**
   * Type of item being moved
   */
  itemType: 'chat' | 'dashboard' | 'chart';

  /**
   * Available folders to move to
   */
  folders: FolderOption[];

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
// Constants
// ============================================================================

const CREATE_NEW_FOLDER_ID = '__create_new__';

// ============================================================================
// Component
// ============================================================================

/**
 * MoveToFolderModal - A slide-up modal for moving items to folders
 *
 * Features:
 * - Dropdown to select existing folder
 * - Option to create a new folder inline
 * - Shows "No folders available" state with create option
 * - Filters out current folder from options
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
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [errors, setErrors] = useState<{ folder?: string; newFolderName?: string }>({});

  // Filter out current folder from options
  const availableFolders = folders.filter((f) => f.id !== currentFolderId);

  // Build dropdown options
  const folderOptions = [
    ...availableFolders.map((f) => ({
      value: f.id,
      label: f.label,
      icon: <FolderSimple size={16} weight="regular" />,
    })),
    {
      value: CREATE_NEW_FOLDER_ID,
      label: 'Create New Folder',
      icon: <Plus size={16} weight="bold" className="text-indigo-600" />,
    },
  ];

  const handleFolderChange = (value: string) => {
    setSelectedFolderId(value);
    if (value === CREATE_NEW_FOLDER_ID) {
      setIsCreatingNew(true);
    } else {
      setIsCreatingNew(false);
      setNewFolderName('');
    }
    setErrors({});
  };

  const handleConfirm = () => {
    const newErrors: { folder?: string; newFolderName?: string } = {};

    if (!selectedFolderId) {
      newErrors.folder = 'Please select a folder';
    }

    if (isCreatingNew && !newFolderName.trim()) {
      newErrors.newFolderName = 'Folder name is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    onConfirm({
      folderId: isCreatingNew ? '' : selectedFolderId,
      isNewFolder: isCreatingNew,
      newFolderName: isCreatingNew ? newFolderName.trim() : undefined,
    });

    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  const resetForm = () => {
    setSelectedFolderId('');
    setIsCreatingNew(false);
    setNewFolderName('');
    setErrors({});
  };

  const itemTypeLabel = itemType === 'chart' ? 'chart' : itemType;

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
            className="absolute inset-0 z-[99] bg-white/10 backdrop-blur-[2px]"
            onClick={handleCancel}
          />

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-0 left-0 right-0 h-[90%] z-[100] px-2 flex flex-col rounded-t-2xl border border-gray-100 shadow-[0_-8px_30px_-8px_rgba(255,237,213,0.8)]"
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50 rounded-t-2xl overflow-hidden" />

            {/* Content */}
            <div className="relative z-10 flex flex-col flex-1 py-3 overflow-hidden">
              {/* Header */}
              <div className="flex flex-row items-center gap-2 px-1 pb-3 mb-3 border-b border-gray-100">
                <FolderSimple size={18} weight="duotone" className="text-gray-700" />
                <div>
                  <h3 className="font-medium text-gray-900">Move to Folder</h3>
                </div>
              </div>

              {/* Form Content */}
              <div className="px-1 space-y-4 flex-1">
                {/* Item being moved */}
                <div className="text-sm text-gray-600">
                  Moving <span className="font-medium text-gray-900">"{itemName}"</span> (
                  {itemTypeLabel})
                </div>

                {/* Folder Selection */}
                {availableFolders.length === 0 && !isCreatingNew ? (
                  <div className="space-y-3">
                    <div className="py-4 text-center">
                      <FolderSimple size={32} weight="duotone" className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">No folders available</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Create a new folder to organize your {itemTypeLabel}s
                      </p>
                    </div>
                    <SecondaryButton
                      onClick={() => {
                        setSelectedFolderId(CREATE_NEW_FOLDER_ID);
                        setIsCreatingNew(true);
                      }}
                      fullWidth
                      className="flex items-center justify-center gap-1.5"
                    >
                      <Plus size={14} weight="bold" />
                      Create New Folder
                    </SecondaryButton>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Select
                      label="Select Folder"
                      labelClassName="text-xs font-medium text-gray-700"
                      options={folderOptions}
                      value={selectedFolderId}
                      onChange={handleFolderChange}
                      placeholder="Choose a folder..."
                      error={errors.folder}
                    />

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
                          <TextInput
                            label="New Folder Name"
                            labelClassName="text-xs font-medium text-gray-700"
                            value={newFolderName}
                            onChange={(e) => {
                              setNewFolderName(e.target.value);
                              if (errors.newFolderName) {
                                setErrors((prev) => ({ ...prev, newFolderName: undefined }));
                              }
                            }}
                            placeholder="Enter folder name..."
                            error={errors.newFolderName}
                            autoFocus
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col items-center gap-2 pt-3 mt-auto border-t border-gray-100 px-1">
                <PrimaryButton
                  onClick={handleConfirm}
                  fullWidth
                  disabled={!selectedFolderId && availableFolders.length > 0}
                >
                  {isCreatingNew ? 'Create Folder & Move' : 'Move'}
                </PrimaryButton>
                <SecondaryButton onClick={handleCancel} fullWidth>
                  Cancel
                </SecondaryButton>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MoveToFolderModal;
