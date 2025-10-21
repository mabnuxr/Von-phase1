import React from 'react';
import { motion } from 'framer-motion';

/**
 * Typing indicator that matches assistant message style
 * Shows as a unified block with gradient background, label, and thinking dots
 */
export const ChatTypingIndicator: React.FC = () => {
  return (
    <motion.div
      className="w-full group"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Full-width section with assistant gradient background */}
      <div className="w-full py-6 bg-gradient-to-br from-gray-50 via-gray-50/80 to-white hover:from-gray-100/50 hover:via-gray-50/90 hover:to-white transition-all duration-300">
        {/* Centered content area */}
        <div className="max-w-3xl mx-auto px-8">
          {/* Assistant label with avatar */}
          <div className="mb-3 text-[13px] font-medium flex items-center gap-2 text-gray-600">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white text-[11px] font-semibold shadow-sm ring-1 ring-black/5">
              A
            </div>
            <span className="tracking-wide">Assistant</span>
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
    </motion.div>
  );
};

export default ChatTypingIndicator;
