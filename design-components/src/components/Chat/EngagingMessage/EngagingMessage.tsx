import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpinningCircles } from '../icons';
import { ENGAGING_MESSAGES } from './constants';

export interface EngagingMessageProps {
  /**
   * Whether the component should be active (showing messages)
   */
  isActive: boolean;

  /**
   * Unique identifier for keying animations
   */
  messageId?: string;

  /**
   * Whether to show the spinner
   * @default true
   */
  showSpinner?: boolean;

  /**
   * Size of the spinner
   * @default 'md'
   */
  spinnerSize?: 'sm' | 'md' | 'lg';

  /**
   * Text size for the message
   * @default 'md'
   */
  textSize?: 'xs' | 'sm' | 'md';

  /**
   * Content signature for tracking changes (triggers message hide/reset when changed)
   * Pass any value that changes when new content arrives (e.g., content length, step count)
   */
  contentSignature?: string | number;

  /**
   * Delay in ms before showing the first message
   * @default 2000
   */
  showDelay?: number;

  /**
   * Interval in ms between message rotations
   * @default 3000
   */
  rotationInterval?: number;

  /**
   * Initial text to show immediately (before delay kicks in)
   * When provided, this text is shown right away, then switches to rotating messages after delay
   * Useful for showing "Thinking" initially before engaging messages
   */
  initialText?: string;

  /**
   * Whether user prefers reduced motion
   */
  prefersReducedMotion?: boolean;

  /**
   * Custom class name for the container
   */
  className?: string;
}

const spinnerSizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const textSizeMap = {
  xs: 'text-sm',
  sm: 'text-sm',
  md: 'text-base',
};

/**
 * EngagingMessage - Shows animated loading messages after a delay
 *
 * Displays a spinner and rotating encouraging messages when there's a delay
 * in receiving new content. Useful for thinking/loading states.
 */
export const EngagingMessage = memo<EngagingMessageProps>(
  ({
    isActive,
    messageId,
    showSpinner = true,
    spinnerSize = 'md',
    textSize = 'sm',
    contentSignature,
    showDelay = 2000,
    rotationInterval = 3000,
    initialText,
    prefersReducedMotion = false,
    className = '',
  }) => {
    // showInitialText: whether to show initialText (before delay)
    // showRotatingMessage: whether to show rotating engaging messages (after delay)
    const [showInitialText, setShowInitialText] = useState(!!initialText);
    const [showRotatingMessage, setShowRotatingMessage] = useState(false);
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const showTimerRef = useRef<number | null>(null);
    const rotationTimerRef = useRef<number | null>(null);
    const prevSignatureRef = useRef<string | number | undefined>(contentSignature);

    useEffect(() => {
      const hasNewContent = contentSignature !== prevSignatureRef.current;
      prevSignatureRef.current = contentSignature;

      if (!isActive) {
        // Clear timers and reset state when not active
        if (showTimerRef.current !== null) {
          clearTimeout(showTimerRef.current);
          showTimerRef.current = null;
        }
        if (rotationTimerRef.current !== null) {
          clearInterval(rotationTimerRef.current);
          rotationTimerRef.current = null;
        }
        setShowInitialText(!!initialText);
        setShowRotatingMessage(false);
        setCurrentMessageIndex(0);
        return;
      }

      // If showDelay is Infinity, never show rotating messages (only show initialText if provided)
      if (showDelay === Infinity) {
        setShowRotatingMessage(false);
        // Clear any existing timers
        if (showTimerRef.current !== null) {
          clearTimeout(showTimerRef.current);
          showTimerRef.current = null;
        }
        if (rotationTimerRef.current !== null) {
          clearInterval(rotationTimerRef.current);
          rotationTimerRef.current = null;
        }
        return;
      }

      // If showDelay is 0, show rotating messages immediately when active
      if (showDelay === 0) {
        if (!showRotatingMessage) {
          setShowInitialText(false);
          setShowRotatingMessage(true);
          // Start rotating messages if not already rotating
          if (rotationTimerRef.current === null) {
            rotationTimerRef.current = window.setInterval(() => {
              setCurrentMessageIndex((prev) => (prev + 1) % ENGAGING_MESSAGES.length);
            }, rotationInterval);
          }
        }
        return;
      }

      // Helper to schedule the rotating message timer
      const scheduleRotatingMessages = () => {
        showTimerRef.current = window.setTimeout(() => {
          setShowInitialText(false);
          setShowRotatingMessage(true);
          // Start rotating messages
          rotationTimerRef.current = window.setInterval(() => {
            setCurrentMessageIndex((prev) => (prev + 1) % ENGAGING_MESSAGES.length);
          }, rotationInterval);
        }, showDelay);
      };

      // If new content arrived, hide rotating message, show initial text, and restart the delay timer
      if (hasNewContent) {
        setShowInitialText(!!initialText);
        setShowRotatingMessage(false);
        setCurrentMessageIndex(0);

        // Clear existing timers
        if (showTimerRef.current !== null) {
          clearTimeout(showTimerRef.current);
          showTimerRef.current = null;
        }
        if (rotationTimerRef.current !== null) {
          clearInterval(rotationTimerRef.current);
          rotationTimerRef.current = null;
        }

        // Start timer to show engaging message after delay
        scheduleRotatingMessages();
      } else if (!showRotatingMessage && showTimerRef.current === null) {
        // No new content, but we're active, not showing rotating messages yet, and no timer is running.
        // This handles the case where we transition from streaming to waiting state without content change.
        scheduleRotatingMessages();
      }

      return () => {
        if (showTimerRef.current !== null) {
          clearTimeout(showTimerRef.current);
          showTimerRef.current = null;
        }
        if (rotationTimerRef.current !== null) {
          clearInterval(rotationTimerRef.current);
          rotationTimerRef.current = null;
        }
      };
    }, [isActive, contentSignature, showDelay, rotationInterval, initialText, showRotatingMessage]);

    if (!isActive || prefersReducedMotion) {
      return null;
    }

    // Determine what text to show
    const displayText = showRotatingMessage
      ? ENGAGING_MESSAGES[currentMessageIndex]
      : showInitialText
        ? initialText
        : null;

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showSpinner && (
          <div className="text-purple-500 flex-shrink-0">
            <SpinningCircles
              key={`spinner-${messageId || 'default'}-${isActive}`}
              className={spinnerSizeMap[spinnerSize]}
            />
          </div>
        )}
        <AnimatePresence mode="wait">
          {displayText && (
            <motion.span
              key={showRotatingMessage ? `rotating-${currentMessageIndex}` : 'initial'}
              className={`${textSizeMap[textSize]} font-medium bg-clip-text text-transparent bg-gradient-to-r from-gray-700 via-purple-600 to-gray-700`}
              style={{
                backgroundSize: '250% 100%',
                animation: 'thinkingShimmer 2.2s linear infinite',
                WebkitBackgroundClip: 'text',
              }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              {displayText}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

EngagingMessage.displayName = 'EngagingMessage';

export default EngagingMessage;
