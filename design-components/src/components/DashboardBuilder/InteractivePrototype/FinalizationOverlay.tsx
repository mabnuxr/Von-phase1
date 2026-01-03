import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Sparkle, RocketLaunch, ArrowRight } from '@phosphor-icons/react';

export type OverlayPhase = 'hidden' | 'finalizing' | 'complete';

export interface FinalizationOverlayProps {
  /**
   * Current phase of the overlay
   */
  phase: OverlayPhase;

  /**
   * Callback when the overlay is dismissed
   */
  onDismiss?: () => void;

  /**
   * Dashboard title to display
   */
  dashboardTitle?: string;
}

/**
 * FinalizationOverlay - Full-screen overlay for finalization and completion states
 */
export const FinalizationOverlay: React.FC<FinalizationOverlayProps> = ({
  phase,
  onDismiss,
  dashboardTitle = 'Your Dashboard',
}) => {
  const [showDetails, setShowDetails] = useState(false);

  React.useLayoutEffect(() => {
    if (phase === 'complete') {
      const t = setTimeout(() => setShowDetails(true), 500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  return (
    <AnimatePresence>
      {phase !== 'hidden' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Finalizing State */}
          <AnimatePresence>
            {phase === 'finalizing' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative z-10 bg-white rounded-2xl shadow-2xl overflow-hidden"
              >
                {/* Gradient border animation */}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    padding: 2,
                    background: 'linear-gradient(135deg, #8039e9, #FF9042, #8039e9)',
                    backgroundSize: '200% 200%',
                  }}
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  <div className="w-full h-full bg-white rounded-2xl" />
                </motion.div>

                {/* Content */}
                <div className="relative px-12 py-10 flex flex-col items-center">
                  {/* Spinning indicator */}
                  <motion.div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                    style={{
                      background: 'linear-gradient(135deg, #8039e9, #FF9042)',
                    }}
                    animate={{
                      boxShadow: [
                        '0 0 0 0 rgba(128, 57, 233, 0.4)',
                        '0 0 0 20px rgba(128, 57, 233, 0)',
                        '0 0 0 0 rgba(128, 57, 233, 0)',
                      ],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkle size={28} weight="fill" className="text-white" />
                    </motion.div>
                  </motion.div>

                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Finalizing Dashboard</h2>
                  <p className="text-sm text-gray-500 text-center max-w-xs">
                    Applying finishing touches and optimizing your visualizations...
                  </p>

                  {/* Progress dots */}
                  <div className="flex gap-2 mt-6">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-purple-500"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.4, 1, 0.4],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Complete State */}
          <AnimatePresence>
            {phase === 'complete' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', damping: 25 }}
                className="relative z-10 bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full mx-4"
              >
                {/* Success header with gradient */}
                <div
                  className="px-8 py-8 text-center"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(128, 57, 233, 0.08), rgba(255, 144, 66, 0.08))',
                  }}
                >
                  {/* Success icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, delay: 0.2 }}
                    className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #8039e9, #FF9042)',
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 12, delay: 0.4 }}
                    >
                      <CheckCircle size={40} weight="fill" className="text-white" />
                    </motion.div>
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-2xl font-bold text-gray-900 mb-2"
                  >
                    Dashboard Ready!
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-sm text-gray-600"
                  >
                    {dashboardTitle} has been generated and is ready for you to explore.
                  </motion.p>
                </div>

                {/* Details section */}
                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="px-8 py-6 border-t border-gray-100"
                    >
                      <div className="space-y-3">
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          className="flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                            <CheckCircle size={16} weight="fill" className="text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              6 Data Tables Created
                            </p>
                            <p className="text-xs text-gray-500">
                              Connected to Salesforce & Von AI
                            </p>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                          className="flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                            <CheckCircle size={16} weight="fill" className="text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              8 Visualizations Built
                            </p>
                            <p className="text-xs text-gray-500">Charts, metrics, and tables</p>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                          className="flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                            <CheckCircle size={16} weight="fill" className="text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">AI Insights Added</p>
                            <p className="text-xs text-gray-500">Churn predictions & risk scores</p>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action button */}
                <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50">
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onDismiss}
                    className="w-full py-3 px-4 rounded-xl text-white font-medium flex items-center justify-center gap-2 cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, #8039e9, #FF9042)',
                    }}
                  >
                    <RocketLaunch size={18} weight="fill" />
                    Explore Dashboard
                    <ArrowRight size={16} weight="bold" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FinalizationOverlay;
