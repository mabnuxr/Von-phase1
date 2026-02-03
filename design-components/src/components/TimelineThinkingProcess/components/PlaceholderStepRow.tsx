import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { SpinnerGapIcon } from '@phosphor-icons/react';
import { TextShimmer } from './TextShimmer';

const PLACEHOLDER_TEXTS = ['Contemplating', 'Processing', 'Pondering', 'Enchanting'];

export interface PlaceholderStepRowProps {
  /** Whether this is the last step (no connector line below) */
  isLast?: boolean;
}

/**
 * PlaceholderStepRow - Shows a placeholder step while waiting for the next step
 *
 * Displays in the same timeline format as StepRow with:
 * - Spinner indicator
 * - Random shimmer text (Contemplating, Processing, Pondering, Enchanting)
 * - Timeline connector line (unless isLast)
 */
export const PlaceholderStepRow = React.memo<PlaceholderStepRowProps>(({ isLast = true }) => {
  // Pick a random text once when component mounts
  const text = useMemo(
    () => PLACEHOLDER_TEXTS[Math.floor(Math.random() * PLACEHOLDER_TEXTS.length)],
    []
  );

  return (
    <div className="relative flex gap-1">
      {/* Timeline connector - spinner indicator */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-6 h-5 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="flex items-center justify-center"
          >
            <SpinnerGapIcon size={14} weight="regular" className="text-gray-800" />
          </motion.div>
        </div>
        {!isLast && <div className="w-px flex-1 bg-gray-100 min-h-[8px]" />}
      </div>

      {/* Content - shimmer text (same style as in-progress steps) */}
      <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-6'}`}>
        <div className="w-full flex items-center text-left">
          <TextShimmer className="text-sm leading-5">{text}</TextShimmer>
        </div>
      </div>
    </div>
  );
});

PlaceholderStepRow.displayName = 'PlaceholderStepRow';
