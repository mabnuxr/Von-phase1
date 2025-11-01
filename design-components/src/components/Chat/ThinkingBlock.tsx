import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Streamdown } from 'streamdown';
import { BrainIcon } from './icons';

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
        className="w-full px-3 py-2 flex items-center justify-between rounded-lg transition-all duration-200 group cursor-pointer bg-gray-100 hover:bg-gray-200"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse thinking process' : 'Expand thinking process'}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Brain icon - clean, no animations */}
          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden bg-gray-600">
            {/* Brain icon */}
            <BrainIcon className="w-3 h-3 text-white relative z-10" size={12} />
          </div>

          {/* Label */}
          <span className="text-sm font-medium transition-colors text-gray-700 group-hover:text-gray-900">
            {isStreaming ? 'Thinking...' : 'Thought process'}
          </span>

          {/* Streaming indicator - enhanced animated dots */}
          {isStreaming && (
            <div className="flex gap-1 flex-shrink-0">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-gray-500"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-gray-500"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              />
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-gray-500"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
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
                  <div className="text-xs text-gray-600 leading-snug prose prose-xs markdown-body max-w-none font-sf">
                    {children}
                  </div>
                </div>
              ) : (
                // Fallback to content string with Streamdown
                <div className="text-sm text-gray-700 leading-relaxed prose prose-sm markdown-body max-w-none font-sf">
                  <Streamdown
                    parseIncompleteMarkdown={isStreaming}
                    isAnimating={isStreaming}
                    controls={{ table: true }}
                  >
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
