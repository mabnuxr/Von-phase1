import React from 'react';
import { motion } from 'framer-motion';

// ============================================================================
// AnimatedDots Component
// ============================================================================

export interface AnimatedDotsProps {
  /** Custom class name for additional styling */
  className?: string;
}

/**
 * AnimatedDots - Animated three dots that pulse sequentially
 *
 * Used to indicate ongoing processing activity.
 * Each dot fades in and out with a stagger delay.
 */
export const AnimatedDots: React.FC<AnimatedDotsProps> = ({ className = '' }) => {
  return (
    <span className={`inline-flex items-center ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        >
          .
        </motion.span>
      ))}
    </span>
  );
};

AnimatedDots.displayName = 'AnimatedDots';
