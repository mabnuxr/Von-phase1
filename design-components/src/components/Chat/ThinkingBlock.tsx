import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Streamdown } from 'streamdown';

export interface ThinkingBlockProps {
  /**
   * The reasoning/thinking content to display
   */
  content?: string;

  /**
   * JSX children to render instead of content string
   * When provided, this takes precedence over content
   */
  children?: React.ReactNode;

  /**
   * Whether the content is currently streaming
   * Used for visual indicators (animations, styling)
   */
  isStreaming?: boolean;

  /**
   * Message status - used to determine when to collapse
   * Block auto-collapses when status becomes 'completed'
   */
  status?: 'created' | 'streaming' | 'completed' | 'failed' | 'timeout';
}

/**
 * Collapsible thinking block component inspired by Claude.ai
 * Displays the AI's reasoning process with elegant animations
 */
export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({
  content,
  children,
  isStreaming = false,
  status,
}) => {
  // Stable state: always start expanded when mounted
  const [isExpanded, setIsExpanded] = useState(true);
  const [userManuallyToggled, setUserManuallyToggled] = useState(false);

  // Auto-collapse only when status becomes 'completed' (and user hasn't manually toggled)
  useEffect(() => {
    if (status === 'completed' && !userManuallyToggled) {
      setIsExpanded(false);
    }
  }, [status, userManuallyToggled]);

  // Handle manual toggle by user
  const handleToggle = () => {
    setUserManuallyToggled(true);
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="mb-2 overflow-hidden">
      {/* Header - Clickable to expand/collapse */}
      <button
        onClick={handleToggle}
        className="w-full px-3 py-2 flex items-center justify-between bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 group cursor-pointer"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse thinking process' : 'Expand thinking process'}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Thinking icon */}
          <div className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
            <svg
              className={`w-2.5 h-2.5 text-white ${isStreaming ? 'animate-pulse' : ''}`}
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
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
            {isStreaming ? 'Thinking...' : 'Thought process'}
          </span>

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="flex gap-1 flex-shrink-0">
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
          className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors flex-shrink-0 ml-2"
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
            <div className="px-3 py-2 pt-0">
              {children ? (
                // Render JSX children with enhanced visual styling for thinking content
                <div className="bg-gray-50/40 rounded-lg border-l-2 border-gray-300/50 pl-3 py-2">
                  <div className="text-xs text-gray-600 leading-snug prose prose-xs max-w-none font-sf">
                    {children}
                  </div>
                </div>
              ) : (
                // Fallback to content string with Streamdown
                <div className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none font-sf">
                  <Streamdown parseIncompleteMarkdown={isStreaming} isAnimating={isStreaming}>
                    {content}
                  </Streamdown>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThinkingBlock;
