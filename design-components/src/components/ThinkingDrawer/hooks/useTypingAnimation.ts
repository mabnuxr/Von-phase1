import { useState, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface UseTypingAnimationOptions {
  text: string;
  typingSpeed?: number;
  isComplete?: boolean;
  onComplete?: () => void;
}

export interface UseTypingAnimationReturn {
  displayedText: string;
  isTypingDone: boolean;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook for typing animation effect
 *
 * @param options - Configuration options for the typing animation
 * @returns Object containing displayed text and typing completion status
 */
export function useTypingAnimation({
  text,
  typingSpeed = 15,
  isComplete = false,
  onComplete,
}: UseTypingAnimationOptions): UseTypingAnimationReturn {
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingDone, setIsTypingDone] = useState(isComplete);

  useEffect(() => {
    if (isComplete) {
      setDisplayedText(text);
      setIsTypingDone(true);
      return;
    }

    setDisplayedText('');
    setIsTypingDone(false);
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsTypingDone(true);
        onComplete?.();
      }
    }, typingSpeed);

    return () => clearInterval(interval);
  }, [text, typingSpeed, onComplete, isComplete]);

  return { displayedText, isTypingDone };
}
