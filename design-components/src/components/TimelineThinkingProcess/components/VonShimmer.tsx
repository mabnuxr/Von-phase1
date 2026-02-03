import React from 'react';
import { motion } from 'framer-motion';

// ============================================================================
// VonShimmer Component
// ============================================================================

export interface VonShimmerProps {
  children: React.ReactNode;
  /** Whether to animate the shimmer effect */
  animate?: boolean;
  /** Duration of the shimmer animation in seconds */
  duration?: number;
  /** Custom class name for additional styling */
  className?: string;
}

/**
 * VonShimmer - Animates text with Von brand gradient
 *
 * Uses the Von gradient (orange #F97316 to purple #A855F7).
 * The gradient slowly shifts position for a subtle animated effect.
 */
export const VonShimmer: React.FC<VonShimmerProps> = ({
  children,
  animate = true,
  duration = 4,
  className = '',
}) => {
  if (!animate) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className={className}>
      <motion.span
        style={{
          background: 'linear-gradient(90deg, #F97316 0%, #A855F7 100%)',
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {children}
      </motion.span>
    </span>
  );
};

VonShimmer.displayName = 'VonShimmer';
