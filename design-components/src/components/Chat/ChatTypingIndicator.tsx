import React from 'react';
import { motion } from 'framer-motion';

/**
 * Clean minimal thinking indicator for full-width chat layout
 * Shows just the thinking dots without duplicate assistant label
 */
export const ChatTypingIndicator: React.FC = () => {
  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {/* Full-width section matching assistant message style */}
      <div className="w-full py-6 bg-gradient-to-br from-gray-50 via-gray-50/80 to-white">
        {/* Centered content area */}
        <div className="max-w-3xl mx-auto px-8">
          {/* Minimal thinking indicator - no label needed as it follows assistant messages */}
          <div className="flex items-center gap-1.5">
            {/* Animated dots */}
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-gray-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-gray-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.2,
              }}
            />
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-gray-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.4,
              }}
            />

            {/* Subtle text */}
            <span className="text-sm text-gray-400 ml-1">thinking</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatTypingIndicator;
