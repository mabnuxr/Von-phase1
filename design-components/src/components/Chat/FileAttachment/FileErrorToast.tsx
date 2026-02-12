/**
 * FileErrorToast component
 * Toast notification shown above the chat input when file validation fails.
 * Positioned similarly to CommandDuplicateToast — right above the input area.
 * Uses amber/gold color scheme with a warning icon.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Warning, X } from '@phosphor-icons/react';

export interface FileErrorToastProps {
  /** Whether the toast is visible */
  isVisible: boolean;
  /** The error message to display */
  message: string;
  /** Callback to dismiss the toast */
  onDismiss: () => void;
}

export const FileErrorToast: React.FC<FileErrorToastProps> = ({
  isVisible,
  message,
  onDismiss,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-full left-0 right-0 max-w-3xl mx-auto mb-2 z-50"
        >
          <div className="bg-amber-50 border border-amber-200 text-sm px-4 py-3 rounded-xl shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Warning size={16} weight="fill" className="text-amber-600 flex-shrink-0" />
              <span className="text-amber-800 font-medium">{message}</span>
            </div>
            <button
              onClick={onDismiss}
              className="text-amber-400 hover:text-amber-600 ml-3 cursor-pointer flex-shrink-0"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FileErrorToast;
