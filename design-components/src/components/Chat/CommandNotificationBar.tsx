import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from '@phosphor-icons/react';

export interface CommandNotificationBarProps {
  /** Whether the notification bar is visible */
  isVisible: boolean;
  /** Number of files attached to the command */
  fileCount: number;
  /** Called when the bar is dismissed */
  onDismiss?: () => void;
}

/**
 * CommandNotificationBar - A notification bar that appears near the top of the
 * chat area after sending a message with a command that has file attachments.
 */
export const CommandNotificationBar: React.FC<CommandNotificationBarProps> = ({
  isVisible,
  fileCount,
  onDismiss,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="mb-3"
        >
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-900 rounded-xl">
            <span className="text-[13px] text-white flex-1">
              {fileCount} new file{fileCount !== 1 ? 's' : ''} added to the chat context
            </span>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandNotificationBar;
