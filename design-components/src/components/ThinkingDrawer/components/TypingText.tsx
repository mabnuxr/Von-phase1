import React from 'react';
import { motion } from 'framer-motion';
import { useTypingAnimation } from '../hooks';

// ============================================================================
// Types
// ============================================================================

export interface TypingTextProps {
  text: string;
  typingSpeed?: number;
  onComplete?: () => void;
  isComplete?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * TypingText - Displays text with a typing animation effect
 *
 * Features:
 * - Character-by-character text reveal
 * - Configurable typing speed
 * - Animated cursor during typing
 * - Callback on completion
 */
export const TypingText = React.memo<TypingTextProps>(
  ({ text, typingSpeed = 15, onComplete, isComplete = false }) => {
    const { displayedText, isTypingDone } = useTypingAnimation({
      text,
      typingSpeed,
      isComplete,
      onComplete,
    });

    return (
      <span>
        {displayedText}
        {!isTypingDone && (
          <motion.span
            className="inline-block w-0.5 h-3 bg-gray-400 ml-0.5 align-middle"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
          />
        )}
      </span>
    );
  }
);

TypingText.displayName = 'TypingText';
