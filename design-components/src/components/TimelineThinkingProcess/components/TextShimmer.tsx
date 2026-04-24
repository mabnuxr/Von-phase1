import React from 'react';
import { motion } from 'framer-motion';

// ============================================================================
// TextShimmer Component
// ============================================================================

export interface TextShimmerProps {
  children: React.ReactNode;
  /** Whether to animate the shimmer effect */
  animate?: boolean;
  /** Duration of the shimmer animation in seconds */
  duration?: number;
  /** Custom class name for additional styling */
  className?: string;
  /**
   * Color variant. `light` (default) uses a dark-on-light gradient intended
   * for light backgrounds; `dark` inverts it for dark backgrounds.
   */
  variant?: 'light' | 'dark';
}

/**
 * TextShimmer - Animates text with a subtle shimmer effect
 *
 * Uses a simple gray gradient shimmer that sweeps across the text.
 * The shimmer animates from left to right.
 */
export const TextShimmer: React.FC<TextShimmerProps> = ({
  children,
  animate = true,
  duration = 4,
  className = '',
  variant = 'light',
}) => {
  if (!animate) {
    return <span className={className}>{children}</span>;
  }

  const gradient =
    variant === 'dark'
      ? 'linear-gradient(135deg, #9ca3af 0%, #9ca3af 35%, #e5e7eb 45%, #ffffff 50%, #e5e7eb 55%, #9ca3af 65%, #9ca3af 100%)'
      : 'linear-gradient(135deg, #374151 0%, #374151 35%, #9ca3af 45%, #d1d5db 50%, #9ca3af 55%, #374151 65%, #374151 100%)';

  return (
    <span className={className}>
      <motion.span
        style={{
          background: gradient,
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
        animate={{
          backgroundPosition: ['100% 0%', '-100% 0%'],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {children}
      </motion.span>
    </span>
  );
};

TextShimmer.displayName = 'TextShimmer';
