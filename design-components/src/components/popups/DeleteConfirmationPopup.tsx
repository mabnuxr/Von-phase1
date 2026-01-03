import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WarningIcon } from '@phosphor-icons/react';

// ============================================================================
// Types
// ============================================================================

export type DeleteItemType = 'chat' | 'dashboard' | 'folder' | 'report';

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
 * DeleteConfirmationPopup - A slide-up confirmation dialog for delete actions
 *
 * Features:
 * - Animated slide-up panel with red gradient background
 * - Backdrop blur overlay
 * - Contextual messaging based on item type
 * - Optional subtext for additional warnings
 * - Confirm/Cancel buttons
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
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-[99] bg-white/10 backdrop-blur-[1.75px]"
            onClick={onCancel}
          />

          {/* Delete confirmation panel */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-0 left-0 right-0 h-[60%] z-[100] flex flex-col rounded-t-2xl overflow-hidden"
          >
            {/* Red gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-red-600 via-red-500 to-red-300/70" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-start justify-start flex-1 px-6 py-6 text-center">
              <div className="p-2 rounded-xl bg-red-500/80 shadow-xs mb-3">
                <WarningIcon size={32} weight="duotone" className="text-white" />
              </div>
              <h3 className="text-lg text-left leading-[1.4rem] font-semibold text-white mb-2">
                Delete{' '}
                <span className="italic underline">
                  "{itemLabel}" {getItemTypeLabel(itemType)}?
                </span>{' '}
                This action is irreversible.
              </h3>

              {/* Optional subtext */}
              {displaySubtext && (
                <p className="text-sm text-left text-white/90 mb-4">{displaySubtext}</p>
              )}

              {/* Action buttons */}
              <div className="w-full flex flex-col items-center gap-3 mt-2">
                <button
                  onClick={onConfirm}
                  className="w-full px-4 py-1.5 text-sm font-medium text-red-700 bg-white rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={onCancel}
                  className="w-full px-4 py-1.5 text-sm font-medium text-white border border-white rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                >
                  Don't delete
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
