import { useState, useEffect } from "react";

interface AnimatedTitleProps {
  title: string;
  isAnimating: boolean;
  onAnimationComplete?: () => void;
}

/**
 * Component that displays a title with a ChatGPT-style typing animation
 */
export function AnimatedTitle({
  title,
  isAnimating,
  onAnimationComplete,
}: AnimatedTitleProps) {
  const [displayedTitle, setDisplayedTitle] = useState(
    isAnimating ? "" : title,
  );

  useEffect(() => {
    if (!isAnimating) {
      setDisplayedTitle(title);
      return;
    }

    // Typing animation
    let currentIndex = 0;
    setDisplayedTitle("");

    const interval = setInterval(() => {
      if (currentIndex < title.length) {
        setDisplayedTitle(title.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        onAnimationComplete?.();
      }
    }, 30); // ~30ms per character for smooth typing

    return () => clearInterval(interval);
  }, [title, isAnimating, onAnimationComplete]);

  return <>{displayedTitle}</>;
}
