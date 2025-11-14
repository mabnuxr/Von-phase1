import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Streamdown } from 'streamdown';
import { SpinningCircles } from './icons';
import { ChainOfThoughtTimeline } from './ChainOfThoughtTimeline';
import type { StepMessage } from './types';

// Extract CSS animation to global scope to prevent re-creation on every render
// This fixes animation freeze issues after multiple page refreshes
const THINKING_SHIMMER_STYLES = `
  @keyframes thinkingShimmer {
    0% { background-position: -150% 0 }
    50% { background-position: 50% 0 }
    100% { background-position: 250% 0 }
  }
  .sr-only {
    position: absolute !important;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    white-space: nowrap;
    border: 0;
  }
`;

// Inject styles once at module level
if (typeof document !== 'undefined') {
  const styleId = 'thinking-shimmer-styles';
  if (!document.getElementById(styleId)) {
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = THINKING_SHIMMER_STYLES;
    document.head.appendChild(styleElement);
  }
}

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

  /**
   * Unique identifier for this message (used for keying animations)
   * Helps ensure animations properly reset on refresh
   */
  messageId?: string;
}

/**
 * Format elapsed time in milliseconds to seconds with one decimal place
 * Examples: "0.5s", "3.2s", "67.8s", "125.0s"
 */
function formatElapsedTime(ms: number): string {
  const seconds = ms / 1000;
  return `${seconds.toFixed(1)}s`;
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
  messageId,
}) => {
  // Stable state: always start expanded when mounted
  const [isExpanded, setIsExpanded] = useState(true);
  const [userManuallyToggled, setUserManuallyToggled] = useState(false);
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Timer state for tracking elapsed time
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const timerIdRef = useRef<number | null>(null);

  // Auto-collapse when status becomes 'completed' AND not streaming
  // Auto-expand when streaming starts (handles refresh recovery)
  useEffect(() => {
    if (isStreaming && !userManuallyToggled) {
      // Expand when streaming starts (fixes collapse on refresh)
      setIsExpanded(true);
    } else if (status === 'completed' && !isStreaming && !userManuallyToggled) {
      // Only collapse when truly completed and not streaming
      setIsExpanded(false);
    }
  }, [status, isStreaming, userManuallyToggled]);

  // Timer effect - tracks elapsed time and resets on new steps
  useEffect(() => {
    // Clear existing timer
    if (timerIdRef.current !== null) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }

    if (isStreaming) {
      // Reset timer when step count changes (new step arrives)
      startTimeRef.current = Date.now();
      setElapsedMs(0);

      // Start interval to update elapsed time every 100ms
      timerIdRef.current = window.setInterval(() => {
        if (startTimeRef.current !== null) {
          setElapsedMs(Date.now() - startTimeRef.current);
        }
      }, 100);
    } else {
      // When streaming stops, preserve the final elapsed time
      startTimeRef.current = null;
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timerIdRef.current !== null) {
        clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
    };
  }, [isStreaming, stepMessages?.length]);

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
        <div className="flex items-center justify-between flex-1 min-w-0 hover:opacity-80">
          <div className="flex items-center gap-2">
            {/* Chevron icon - shows when not streaming or when collapsed */}
            {!isStreaming && (
              <motion.svg
                className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors flex-shrink-0 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </motion.svg>
            )}

            {/* Label */}
            {isStreaming ? (
              <span className="text-sm font-medium relative inline-block ml-2">
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
              </span>
            ) : (
              <span className="text-sm font-medium transition-colors text-gray-700 group-hover:text-gray-900">
                Thought process
              </span>
            )}
          </div>

          {/* Timer display - shows during and after streaming */}
          {(isStreaming || elapsedMs > 0) && (
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400 mr-2">
              {formatElapsedTime(elapsedMs)}
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

      {/* Streaming indicator - appears below content only during streaming */}
      {isStreaming && !prefersReducedMotion && (
        <div className="w-full flex items-center gap-3 ml-3">
          {/* Spinning circles with unique key to force remount on refresh */}
          <div className="text-purple-500">
            <SpinningCircles
              key={`spinner-${messageId || 'default'}-${isStreaming}`}
              className="w-8 h-8"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ThinkingBlock;
