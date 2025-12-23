import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Robot, SpinnerGap, CheckCircle } from '@phosphor-icons/react';

export type AgentStatus = 'idle' | 'working' | 'complete';

export interface AgentProgressBarProps {
  /**
   * Whether the agent bar is visible
   */
  isVisible: boolean;

  /**
   * Current agent status
   */
  status: AgentStatus;

  /**
   * Current status message
   */
  message: string;

  /**
   * Number of agents working (for multi-agent scenarios)
   */
  agentCount?: number;

  /**
   * Progress percentage (0-100)
   */
  progress?: number;
}

/**
 * AgentProgressBar - Top bar showing agent activity status
 */
export const AgentProgressBar: React.FC<AgentProgressBarProps> = ({
  isVisible,
  status,
  message,
  agentCount = 1,
  progress,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-[90] h-12"
        >
          {/* Gradient border animation at bottom */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5"
            style={{
              background: 'linear-gradient(90deg, #8039e9, #FF9042, #8039e9)',
              backgroundSize: '200% 100%',
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Main bar content */}
          <div className="h-full bg-white/95 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-4">
            {/* Left side - Status */}
            <div className="flex items-center gap-3">
              {/* Agent icon with animation */}
              <div className="relative">
                <motion.div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: status === 'complete'
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'linear-gradient(135deg, #8039e9, #FF9042)',
                  }}
                  animate={
                    status === 'working'
                      ? {
                          scale: [1, 1.05, 1],
                          boxShadow: [
                            '0 0 0 0 rgba(128, 57, 233, 0.4)',
                            '0 0 0 8px rgba(128, 57, 233, 0)',
                            '0 0 0 0 rgba(128, 57, 233, 0)',
                          ],
                        }
                      : {}
                  }
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  {status === 'complete' ? (
                    <CheckCircle size={18} weight="fill" className="text-white" />
                  ) : (
                    <Robot size={18} weight="fill" className="text-white" />
                  )}
                </motion.div>

                {/* Working indicator ring */}
                {status === 'working' && (
                  <motion.div
                    className="absolute -inset-1 rounded-xl border-2 border-purple-400"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Agent count and status text */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {agentCount} Agent{agentCount > 1 ? 's' : ''} {status === 'working' ? 'Working' : status === 'complete' ? 'Complete' : 'Ready'}
                  </span>
                  {status === 'working' && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <SpinnerGap size={14} weight="bold" className="text-purple-600" />
                    </motion.div>
                  )}
                </div>
                <span className="text-xs text-gray-500">{message}</span>
              </div>
            </div>

            {/* Center - Progress bar (optional) */}
            {progress !== undefined && status === 'working' && (
              <div className="flex-1 max-w-md mx-8">
                <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #8039e9, #FF9042)',
                    }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                  {/* Shimmer effect on progress bar */}
                  <motion.div
                    className="absolute inset-0 opacity-50"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                      backgroundSize: '50% 100%',
                    }}
                    animate={{ backgroundPosition: ['-100% 0', '200% 0'] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Right side - Action dots or info */}
            <div className="flex items-center gap-2">
              {status === 'working' && (
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-purple-500"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AgentProgressBar;
