import React from 'react';
import { motion } from 'framer-motion';
import type { BuildMode } from './types';

export interface ModeToggleProps {
  /**
   * Current mode
   */
  mode: BuildMode;

  /**
   * Callback when mode changes
   */
  onModeChange: (mode: BuildMode) => void;

  /**
   * Whether the toggle is disabled
   */
  disabled?: boolean;

  /**
   * Size variant
   */
  size?: 'sm' | 'md';
}

/**
 * ModeToggle - Toggle between Assistant (Ask) and Analyst (Build) modes
 */
export const ModeToggle: React.FC<ModeToggleProps> = ({
  mode,
  onModeChange,
  disabled = false,
  size = 'md',
}) => {
  const isAsk = mode === 'ask';

  const handleToggle = (newMode: BuildMode) => {
    if (!disabled && newMode !== mode) {
      onModeChange(newMode);
    }
  };

  const sizeClasses = {
    sm: {
      container: 'h-7 p-0.5',
      button: 'px-2.5 py-0.5 text-xs',
    },
    md: {
      container: 'h-8 p-0.5',
      button: 'px-3 py-1 text-sm',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div
      className={`inline-flex items-center bg-gray-100 rounded-full ${classes.container} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {/* Ask Mode */}
      <button
        onClick={() => handleToggle('ask')}
        disabled={disabled}
        className={`relative flex items-center justify-center rounded-full font-medium transition-all duration-200 ${classes.button} ${
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        {isAsk && (
          <motion.div
            layoutId="mode-toggle-bg"
            className="absolute inset-0 bg-white rounded-full shadow-sm"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        <span className={`relative z-10 ${isAsk ? 'text-gray-900' : 'text-gray-500'}`}>
          Ask
        </span>
      </button>

      {/* Build Mode */}
      <button
        onClick={() => handleToggle('build')}
        disabled={disabled}
        className={`relative flex items-center justify-center rounded-full font-medium transition-all duration-200 ${classes.button} ${
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        {!isAsk && (
          <motion.div
            layoutId="mode-toggle-bg"
            className="absolute inset-0 bg-white rounded-full shadow-sm"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        <span className={`relative z-10 ${!isAsk ? 'text-gray-900' : 'text-gray-500'}`}>
          Build
        </span>
      </button>
    </div>
  );
};

export default ModeToggle;
