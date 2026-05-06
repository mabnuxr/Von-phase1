import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrashIcon } from '@phosphor-icons/react';

// ============================================================================
// Types
// ============================================================================

export type DeleteItemType = 'chat' | 'dashboard' | 'folder' | 'report' | 'memory';

export interface DeleteConfirmationPopupProps {
  /**
   * Whether the popup is open
   */
  isOpen: boolean;

  /**
   * The label/name of the item being deleted
   */
  itemLabel: string;

  /**
   * The type of item being deleted
   */
  itemType: DeleteItemType;

  /**
   * Optional subtext to display below the main message
   */
  subtext?: string;

  /**
   * Callback when user confirms deletion
   */
  onConfirm: () => void;

  /**
   * Callback when user cancels deletion
   */
  onCancel: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getItemTypeLabel = (itemType: DeleteItemType): string => {
  switch (itemType) {
    case 'chat':
      return 'chat';
    case 'dashboard':
      return 'dashboard';
    case 'folder':
      return 'folder';
    case 'report':
      return 'report';
    case 'memory':
      return 'memory';
    default:
      return 'item';
  }
};

const getDefaultSubtext = (itemType: DeleteItemType): string | undefined => {
  switch (itemType) {
    case 'folder':
      return 'All chats and dashboards in this folder will also be removed.';
    case 'report':
      return 'This may impact your dashboards and any widgets using this report as a data source.';
    default:
      return undefined;
  }
};

// ============================================================================
// Component
// ============================================================================

/**
 * DeleteConfirmationPopup - A centered confirmation dialog for delete actions
 *
 * Features:
 * - Centered modal with backdrop blur overlay
 * - Contextual messaging based on item type
 * - Optional subtext for additional warnings
 * - Red delete button for destructive action
 * - Styled to match the folder creation popup design
 */
export const DeleteConfirmationPopup: React.FC<DeleteConfirmationPopupProps> = ({
  isOpen,
  itemLabel,
  itemType,
  subtext,
  onConfirm,
  onCancel,
}) => {
  const displaySubtext = subtext ?? getDefaultSubtext(itemType);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[2px]"
            onClick={onCancel}
          />

          {/* Centered modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed z-[9999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] max-w-[90vw] bg-white rounded-2xl border border-gray-100 shadow-xl flex flex-col"
          >
            {/* Content */}
            <div className="flex flex-col p-4">
              {/* Header */}
              <div className="flex flex-row items-center gap-2 pb-3 mb-3 border-b border-gray-100">
                <div className="p-1 rounded-lg bg-red-50">
                  <TrashIcon size={16} weight="regular" className="text-red-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-900">
                  Delete {getItemTypeLabel(itemType)}
                </h3>
              </div>

              {/* Message */}
              <p className="text-sm text-gray-900">
                Are you sure you want to delete <span className="font-medium">"{itemLabel}"</span>?
              </p>
              <p className="text-sm text-gray-800/80 mt-1.5">
                This action cannot be undone.{displaySubtext ? ` ${displaySubtext}` : ''}
              </p>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-3 mt-3">
                <button
                  onClick={onCancel}
                  className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-800 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmationPopup;
