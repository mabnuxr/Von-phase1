import React from 'react';
import { motion } from 'framer-motion';

/**
 * Animated typing indicator for chat
 */
export const ChatTypingIndicator: React.FC = () => {
  return (
    <motion.div
      className="flex w-full justify-start"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="max-w-[85%] rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-1.5">
          {/* Animated typing dots */}
          <motion.div
            className="w-2 h-2 rounded-full bg-gray-400"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="w-2 h-2 rounded-full bg-gray-400"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.15,
            }}
          />
          <motion.div
            className="w-2 h-2 rounded-full bg-gray-400"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.3,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ChatTypingIndicator;
