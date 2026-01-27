import React from 'react';
import { motion } from 'framer-motion';
import { SpinnerGapIcon } from '@phosphor-icons/react';
import type { DeepResearchThinkingIndicatorProps } from './types';

/**
 * Format elapsed time for display
 */
const formatElapsedTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

/**
 * DeepResearchThinkingIndicator Component
 *
 * Shows a thinking/analyzing indicator during deep research execution.
 * Can optionally show elapsed time, current step, and progress.
 */
export const DeepResearchThinkingIndicator: React.FC<DeepResearchThinkingIndicatorProps> = ({
  isThinking,
  elapsedTime = 0,
  currentStep,
  progress,
  estimatedTimeRemaining,
  className = '',
}) => {
  if (!isThinking) {
    return null;
  }

  return (
    <div
      className={`bg-green-50/50 rounded-xl border border-green-100 overflow-hidden p-3 ${className}`}
    >
      {/* Header with spinner and status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Green dot indicator (matching deep research chip) */}
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-green-200" />

          {/* Spinner */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="flex-shrink-0"
          >
            <SpinnerGapIcon size={16} weight="regular" className="text-green-600" />
          </motion.div>

          {/* Status text */}
          <span className="text-[13px] font-medium text-green-800">
            {currentStep || 'Deep Research in Progress'}
          </span>
        </div>

        {/* Elapsed time */}
        {elapsedTime > 0 && (
          <span className="text-[11px] text-green-700 tabular-nums">
            {formatElapsedTime(elapsedTime)}
          </span>
        )}
      </div>

      {/* Progress bar (optional) */}
      {progress !== undefined && progress > 0 && (
        <div className="mt-3">
          <div className="w-full h-1.5 bg-green-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-green-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {estimatedTimeRemaining && (
            <div className="flex justify-between mt-1">
              <span className="text-[11px] text-green-600">Progress</span>
              <span className="text-[11px] font-medium text-green-700">
                {estimatedTimeRemaining} remaining
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeepResearchThinkingIndicator;
