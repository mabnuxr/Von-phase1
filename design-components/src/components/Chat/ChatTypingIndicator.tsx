import React from 'react';
import { motion } from 'framer-motion';

/**
 * Typing indicator that matches assistant message style
 * Shows as a unified block with gradient background, label, and thinking dots
 */
export const ChatTypingIndicator: React.FC = () => {
  return (
    <motion.div
      className="w-full group font-sf mb-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Centered container */}
      <div className="px-6">
        <div className="max-w-4xl mx-auto">
          {/* Minimal message layout */}
          <div className="py-4">
            {/* Horizontal layout: Avatar + Content */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                AI
              </div>

              {/* Thinking dots */}
              <div className="flex items-center gap-1.5">
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
                <span className="text-sm text-gray-400 ml-1">thinking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatTypingIndicator;
