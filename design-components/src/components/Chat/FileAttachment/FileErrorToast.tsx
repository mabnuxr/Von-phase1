/**
 * FileErrorToast component
 * Inline toast shown above the chat input when file validation fails.
 * Designed to be rendered inside the chat input wrapper (not fixed-position).
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WarningCircle, X } from '@phosphor-icons/react';

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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="w-full"
        >
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-amber-200 bg-amber-50">
            <WarningCircle size={16} weight="fill" className="text-amber-500 flex-shrink-0" />
            <span className="text-[13px] font-medium text-amber-700 truncate min-w-0 flex-1">
              {message}
            </span>
            <button
              onClick={onDismiss}
              className="text-amber-300 hover:text-amber-500 transition-colors cursor-pointer flex-shrink-0 p-0.5 rounded-md hover:bg-amber-100"
              aria-label="Dismiss"
            >
              <X size={12} weight="bold" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FileErrorToast;
