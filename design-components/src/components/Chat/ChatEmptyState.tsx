import React from 'react';
import { motion } from 'framer-motion';

export interface ChatEmptyStateProps {
  /**
   * Optional example prompts to show
   */
  examplePrompts?: string[];
  /**
   * Callback when example prompt is clicked
   */
  onPromptClick?: (prompt: string) => void;
}

/**
 * Beautiful empty state for chat with animations
 */
export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({
  examplePrompts = [
    'Show me my revenue forecast',
    'What deals are at risk this quarter?',
    'Generate a sales report',
  ],
  onPromptClick,
}) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-start min-h-0 px-6 py-8 overflow-y-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Animated Icon */}
      <motion.div
        className="mb-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg"
          animate={{
            boxShadow: [
              '0 10px 30px rgba(128, 57, 233, 0.3)',
              '0 15px 40px rgba(128, 57, 233, 0.4)',
              '0 10px 30px rgba(128, 57, 233, 0.3)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </motion.div>
      </motion.div>

      {/* Heading */}
      <motion.h3
        className="text-lg font-semibold text-gray-900 mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        Start a conversation
      </motion.h3>

      {/* Subtitle */}
      <motion.p
        className="text-sm text-gray-500 text-center mb-6 max-w-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        Ask me anything about your revenue, forecasts, or deals. I'm here to help!
      </motion.p>

      {/* Example Prompts */}
      <motion.div
        className="flex flex-col gap-3 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
          Try asking:
        </p>
        {examplePrompts.map((prompt, index) => (
          <motion.button
            key={prompt}
            className="text-left px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 hover:border-purple-300 hover:bg-purple-50 transition-colors cursor-pointer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPromptClick?.(prompt)}
          >
            <span className="text-purple-500 mr-2">→</span>
            {prompt}
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default ChatEmptyState;
