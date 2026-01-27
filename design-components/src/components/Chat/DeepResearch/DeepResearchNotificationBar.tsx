import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnvelopeSimpleIcon } from '@phosphor-icons/react';

export interface DeepResearchNotificationBarProps {
  /**
   * Whether the notification bar is visible
   */
  isVisible: boolean;
  /**
   * Optional custom message
   */
  message?: string;
  /**
   * Optional callback when the bar is dismissed
   */
  onDismiss?: () => void;
}

/**
 * DeepResearchNotificationBar - A notification bar that appears above the chat input
 * when a deep research task is running in the background.
 *
 * Informs users they can continue with other conversations and will be notified
 * when the research completes.
 */
export const DeepResearchNotificationBar: React.FC<DeepResearchNotificationBarProps> = ({
  isVisible,
  message = "Feel free to continue with other conversations. We'll email you once this research completes.",
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className="mb-3"
        >
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-900 rounded-xl">
            <EnvelopeSimpleIcon size={16} weight="regular" className="text-white flex-shrink-0" />
            <span className="text-[13px] text-white">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeepResearchNotificationBar;
