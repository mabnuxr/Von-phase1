import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CommandNotificationBarProps {
  /**
   * Whether the notification bar is visible
   */
  isVisible: boolean;
  /**
   * Number of files attached to the command
   */
  fileCount: number;
  /**
   * Optional callback when the bar is dismissed
   */
  onDismiss?: () => void;
}

/**
 * CommandNotificationBar - A notification bar that appears above the chat input
 * after sending a message with a command that has file attachments.
 *
 * Informs users they are now chatting with the specified number of files.
 */
export const CommandNotificationBar: React.FC<CommandNotificationBarProps> = ({
  isVisible,
  fileCount,
}) => {
  const message = `You are now chatting with ${fileCount} file${fileCount !== 1 ? 's' : ''}`;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className="mb-3 max-w-4xl mx-auto w-full px-2"
        >
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-900 rounded-xl">
            <span className="text-[13px] text-white">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandNotificationBar;
