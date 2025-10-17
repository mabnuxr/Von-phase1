import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMarkdown } from './ChatMarkdown';

export interface ThinkingBlockProps {
  /**
   * The reasoning/thinking content to display
   */
  content: string;

  /**
   * Whether the content is currently streaming
   */
  isStreaming?: boolean;

  /**
   * Whether the block should be expanded by default
   * @default false
   */
  defaultExpanded?: boolean;
}

/**
 * Collapsible thinking block component inspired by Claude.ai
 * Displays the AI's reasoning process with elegant animations
 */
export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({
  content,
  isStreaming = false,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50/30 overflow-hidden">
      {/* Header - Clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100/40 transition-colors duration-200 group"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse thinking process' : 'Expand thinking process'}
      >
        <div className="flex items-center gap-2.5">
          {/* Thinking icon */}
          <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center">
            <svg
              className={`w-3 h-3 text-white ${isStreaming ? 'animate-pulse' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>

          {/* Label */}
          <span className="text-sm font-medium text-gray-700">
            {isStreaming ? 'Thinking...' : 'Thought process'}
          </span>

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="flex gap-1">
              <motion.div
                className="w-1 h-1 rounded-full bg-gray-500"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="w-1 h-1 rounded-full bg-gray-500"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              />
              <motion.div
                className="w-1 h-1 rounded-full bg-gray-500"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              />
            </div>
          )}
        </div>

        {/* Chevron icon */}
        <motion.svg
          className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 pt-0 border-t border-gray-200/50">
              <div className="text-sm text-gray-700 leading-relaxed">
                <ChatMarkdown content={content} isStreaming={isStreaming} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThinkingBlock;
