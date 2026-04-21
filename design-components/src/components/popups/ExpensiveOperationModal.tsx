import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from '@phosphor-icons/react';
import { VonIcon } from '../VonIcon';

// ============================================================================
// Types
// ============================================================================

export interface ExpensiveOperationModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Callback when user confirms the operation
   */
  onConfirm: () => void;

  /**
   * Callback when user cancels
   */
  onCancel: () => void;

  /**
   * Operation description (e.g., "Create Dashboard")
   */
  operationName: string;

  /**
   * Optional body text. Defaults to creation-specific copy.
   */
  description?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ExpensiveOperationModal - A simple confirmation modal for expensive/long-running operations
 * like full data analysis.
 */
export const ExpensiveOperationModal: React.FC<ExpensiveOperationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  operationName,
  description = 'Are you sure you want to skip? The dashboard and underlying data sources will not be created.',
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20" onClick={onCancel} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-sm mx-4 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onCancel}
              className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
            >
              <X size={16} weight="bold" />
            </button>

            {/* Content */}
            <div className="px-4 py-3">
              {/* Header */}
              <div className="flex items-center gap-1.5 pb-2 mb-3 border-b border-gray-100">
                <VonIcon variant="badge" shape="circle" size={16} />
                <h2 className="text-sm font-medium text-gray-900">{operationName}</h2>
              </div>

              {/* Description */}
              <p className="text-[13px] text-gray-800 leading-relaxed mb-4">{description}</p>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onCancel}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Skip
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExpensiveOperationModal;
