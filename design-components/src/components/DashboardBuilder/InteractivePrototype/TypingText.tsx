import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

export interface TypingTextProps {
  /**
   * The text to type out
   */
  text: string;

  /**
   * Speed of typing in milliseconds per character
   */
  speed?: number;

  /**
   * Whether to show a blinking cursor
   */
  showCursor?: boolean;

  /**
   * Callback when typing is complete
   */
  onComplete?: () => void;

  /**
   * Whether to start typing immediately
   */
  autoStart?: boolean;

  /**
   * CSS class name for the text
   */
  className?: string;

  /**
   * CSS class name for the cursor
   */
  cursorClassName?: string;

  /**
   * Delay before starting to type (ms)
   */
  delay?: number;
}

/**
 * TypingText - Animates text as if being typed character by character
 */
export const TypingText: React.FC<TypingTextProps> = ({
  text,
  speed = 50,
  showCursor = true,
  onComplete,
  autoStart = true,
  className = '',
  cursorClassName = '',
  delay = 0,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = useRef(false);

  const typeNextChar = useCallback(() => {
    if (indexRef.current < text.length) {
      setDisplayedText(text.slice(0, indexRef.current + 1));
      indexRef.current += 1;
      timeoutRef.current = setTimeout(typeNextChar, speed);
    } else {
      setIsTyping(false);
      setIsComplete(true);
      onComplete?.();
    }
  }, [text, speed, onComplete]);

  const startTyping = useCallback(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    setIsTyping(true);
    indexRef.current = 0;
    setDisplayedText('');

    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        typeNextChar();
      }, delay);
    } else {
      typeNextChar();
    }
  }, [delay, typeNextChar]);

  // Start typing on mount if autoStart is true
  React.useLayoutEffect(() => {
    if (autoStart && !hasStartedRef.current) {
      startTyping();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [autoStart, startTyping]);

  return (
    <span className={`inline ${className}`}>
      {displayedText}
      {showCursor && !isComplete && (
        <motion.span
          className={`inline-block w-0.5 h-[1em] bg-current ml-0.5 align-middle ${cursorClassName}`}
          animate={{ opacity: isTyping ? 1 : [1, 0] }}
          transition={
            isTyping
              ? { duration: 0 }
              : { duration: 0.5, repeat: Infinity, repeatType: 'reverse' }
          }
        />
      )}
    </span>
  );
};

export default TypingText;
