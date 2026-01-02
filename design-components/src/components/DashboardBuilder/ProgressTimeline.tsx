import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, SpinnerGap, Circle } from '@phosphor-icons/react';
import type { ProgressStep } from './types';

export interface ProgressTimelineProps {
  /**
   * List of progress steps
   */
  steps: ProgressStep[];

  /**
   * Orientation of the timeline
   */
  orientation?: 'vertical' | 'horizontal';

  /**
   * Size variant
   */
  size?: 'sm' | 'md';
}

/**
 * ProgressTimeline - Shows build progress steps
 */
export const ProgressTimeline: React.FC<ProgressTimelineProps> = ({
  steps,
  orientation = 'vertical',
  size = 'md',
}) => {
  const isVertical = orientation === 'vertical';

  const sizeClasses = {
    sm: {
      icon: 16,
      label: 'text-xs',
      desc: 'text-[10px]',
      gap: 'gap-2',
    },
    md: {
      icon: 20,
      label: 'text-sm',
      desc: 'text-xs',
      gap: 'gap-3',
    },
  };

  const classes = sizeClasses[size];

  const getStepIcon = (step: ProgressStep, index: number) => {
    if (step.status === 'complete') {
      return (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <CheckCircle size={classes.icon} weight="duotone" className="text-green-500" />
        </motion.div>
      );
    }

    if (step.status === 'in-progress') {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <SpinnerGap size={classes.icon} weight="duotone" className="text-purple-600" />
        </motion.div>
      );
    }

    return <Circle size={classes.icon} weight="duotone" className="text-gray-300" />;
  };

  if (isVertical) {
    return (
      <div className={`flex flex-col ${classes.gap}`}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-3">
            {/* Icon and Line */}
            <div className="flex flex-col items-center">
              <div className="flex-shrink-0">{getStepIcon(step, index)}</div>
              {index < steps.length - 1 && (
                <div
                  className={`w-0.5 flex-1 min-h-[24px] mt-1 ${
                    step.status === 'complete' ? 'bg-green-200' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <p
                className={`font-medium ${classes.label} ${
                  step.status === 'complete'
                    ? 'text-gray-700'
                    : step.status === 'in-progress'
                      ? 'text-gray-900'
                      : 'text-gray-400'
                }`}
              >
                {step.label}
              </p>
              {step.description && (
                <p
                  className={`${classes.desc} mt-0.5 ${
                    step.status === 'pending' ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {step.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Horizontal orientation
  return (
    <div className="flex items-start justify-between w-full">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            {getStepIcon(step, index)}
            <p
              className={`font-medium ${classes.label} mt-2 text-center ${
                step.status === 'complete'
                  ? 'text-gray-700'
                  : step.status === 'in-progress'
                    ? 'text-gray-900'
                    : 'text-gray-400'
              }`}
            >
              {step.label}
            </p>
            {step.description && (
              <p
                className={`${classes.desc} mt-0.5 text-center max-w-[120px] ${
                  step.status === 'pending' ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {step.description}
              </p>
            )}
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 mt-2.5 ${
                step.status === 'complete' ? 'bg-green-200' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default ProgressTimeline;
