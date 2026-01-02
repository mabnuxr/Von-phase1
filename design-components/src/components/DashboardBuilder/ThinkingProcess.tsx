import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CaretDown, CaretUp, Brain, CheckCircle, SpinnerGap } from '@phosphor-icons/react';
import type { ThinkingStep } from './types';

export interface ThinkingProcessProps {
  /**
   * List of thinking steps
   */
  steps: ThinkingStep[];

  /**
   * Whether the thinking process is collapsed
   */
  isCollapsed?: boolean;

  /**
   * Callback when collapse state changes
   */
  onToggleCollapse?: () => void;

  /**
   * Whether the thinking is still in progress
   */
  isThinking?: boolean;
}

/**
 * ThinkingProcess - Displays AI thinking steps with collapse/expand
 */
export const ThinkingProcess: React.FC<ThinkingProcessProps> = ({
  steps,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  isThinking = false,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const isCollapsed = controlledCollapsed ?? internalCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  const completedCount = steps.filter((s) => s.status === 'complete').length;
  const totalCount = steps.length;

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {isThinking ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <SpinnerGap size={18} weight="duotone" className="text-purple-600" />
            </motion.div>
          ) : (
            <Brain size={18} weight="duotone" className="text-purple-600" />
          )}
          <span className="text-sm font-medium text-gray-700">
            {isThinking ? 'Thinking...' : 'Thought Process'}
          </span>
          <span className="text-xs text-gray-500">
            ({completedCount}/{totalCount} steps)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <CaretDown size={16} weight="bold" className="text-gray-400" />
          ) : (
            <CaretUp size={16} weight="bold" className="text-gray-400" />
          )}
        </div>
      </button>

      {/* Collapsible Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3"
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {step.status === 'complete' ? (
                      <CheckCircle size={16} weight="duotone" className="text-green-500" />
                    ) : step.status === 'in-progress' ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <SpinnerGap size={16} weight="duotone" className="text-purple-600" />
                      </motion.div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                  </div>

                  {/* Step Text */}
                  <span
                    className={`text-sm ${
                      step.status === 'complete'
                        ? 'text-gray-600'
                        : step.status === 'in-progress'
                          ? 'text-gray-900 font-medium'
                          : 'text-gray-400'
                    }`}
                  >
                    {step.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThinkingProcess;
