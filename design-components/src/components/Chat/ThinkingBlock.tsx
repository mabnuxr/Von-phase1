import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Streamdown } from 'streamdown';
import { SpinningCircles } from './icons';
import { ChainOfThoughtTimeline } from './ChainOfThoughtTimeline';
import type { StepMessage } from './types';

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

  /**
   * Step messages to render with chain-of-thought timeline
   * When provided, renders animated timeline instead of children
   */
  stepMessages?: StepMessage[];

  /**
   * Callback when artifact is clicked from tool call
   */
  onArtifactClick?: (
    artifactId: string,
    toolName: string,
    artifactType: string,
    runId: string
  ) => void;
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
  stepMessages,
  onArtifactClick,
}) => {
  // Stable state: always start expanded when mounted
  const [isExpanded, setIsExpanded] = useState(true);
  const [userManuallyToggled, setUserManuallyToggled] = useState(false);
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;


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
        className="w-full py-2 flex items-center justify-between rounded-lg transition-all duration-200 group hover:cursor-pointer "
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse thinking process' : 'Expand thinking process'}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80">
          {isStreaming ? (
            <SpinningCircles className="text-gray-500 group-hover:text-gray-700 transition-colors flex-shrink-0 ml-2" />
          ) : (
            <motion.svg
              className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors flex-shrink-0 ml-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </motion.svg>
          )}

          {/* Label */}
          {isStreaming ? (
            <span className="text-sm font-medium relative inline-block">
              <span
                className="bg-clip-text text-transparent bg-gradient-to-r from-gray-700 via-purple-600 to-gray-700"
                style={{
                  backgroundSize: '250% 100%',
                  animation: prefersReducedMotion
                    ? undefined
                    : 'thinkingShimmer 2.2s linear infinite',
                  WebkitBackgroundClip: 'text',
                }}
              >
                Thinking
              </span>

              {/* accessible live region (hidden visually) */}
              <span className="sr-only" aria-live="polite">
                Assistant is thinking
              </span>

              <style>{`
              @keyframes thinkingShimmer {
                0% { background-position: -150% 0 }
                50% { background-position: 50% 0 }
                100% { background-position: 250% 0 }
              }
              /* small helper for sr-only if you don't have a tailwind sr-only util */
              .sr-only { position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
            `}</style>
            </span>
          ) : (
            <span className="text-sm font-medium transition-colors text-gray-700 group-hover:text-gray-900">
              Thought process
            </span>
          )}
        </div>
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
              {stepMessages && stepMessages.length > 0 ? (
                // Render chain-of-thought timeline with animated dots and lines
                <div className="bg-gray-50/40 rounded-lg pl-3 py-2">
                  <ChainOfThoughtTimeline
                    stepMessages={stepMessages}
                    isStreaming={isStreaming}
                    onArtifactClick={onArtifactClick}
                  />
                </div>
              ) : children ? (
                // Render JSX children with enhanced visual styling for thinking content
                <div className="bg-gray-50/40 rounded-lg pl-3 py-2">
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
