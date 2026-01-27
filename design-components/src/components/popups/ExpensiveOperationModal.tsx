import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X } from '@phosphor-icons/react';

// ============================================================================
// Types
// ============================================================================

export interface ExpensiveOperationModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Number of records to process
   */
  recordCount: number;

  /**
   * Estimated processing time (e.g., "15-20 minutes")
   */
  estimatedTime?: string;

  /**
   * Callback when user confirms the operation
   */
  onConfirm: () => void;

  /**
   * Callback when user cancels
   */
  onCancel: () => void;

  /**
   * Operation description (e.g., "Run full analysis")
   */
  operationName?: string;
}

// ============================================================================
// Von Logo Component (for modal header)
// ============================================================================

const VonLogo: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="14" cy="14" r="14" fill="url(#paint0_radial_expensive_modal)" />
    <path
      d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z"
      stroke="white"
      strokeWidth="1.33"
    />
    <circle cx="13.9932" cy="14" r="7.835" stroke="white" strokeWidth="1.33" />
    <defs>
      <radialGradient
        id="paint0_radial_expensive_modal"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(21.875 1.75) rotate(120.964) scale(30.6125)"
      >
        <stop stopColor="#FFF3EB" />
        <stop offset="0.26" stopColor="#FF9042" />
        <stop offset="1" stopColor="#854FFF" />
      </radialGradient>
    </defs>
  </svg>
);

// ============================================================================
// Component
// ============================================================================

/**
 * ExpensiveOperationModal - A simple confirmation modal for expensive/long-running operations
 * like full data analysis.
 */
export const ExpensiveOperationModal: React.FC<ExpensiveOperationModalProps> = ({
  isOpen,
  recordCount,
  estimatedTime = '10-15 minutes',
  onConfirm,
  onCancel,
  operationName = 'Run full analysis',
}) => {
  const safeRecordCount = recordCount ?? 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20" onClick={onCancel} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-sm mx-4 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onCancel}
              className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
            >
              <X size={16} weight="bold" />
            </button>

            {/* Content */}
            <div className="px-4 py-3">
              {/* Header */}
              <div className="flex items-center gap-1.5 pb-2 mb-3 border-b border-gray-100">
                <VonLogo size={16} />
                <h2 className="text-[15px] font-medium text-gray-900">{operationName}</h2>
              </div>

              {/* Description */}
              <p className="text-[13px] text-gray-800 leading-relaxed mb-4">
                <span className="font-medium text-gray-900">
                  {safeRecordCount.toLocaleString()} records
                </span>
                across your connected data sources.
              </p>

              {/* Time estimate */}
              <div className="flex items-center gap-2 mb-5 text-[13px] text-gray-800">
                <Clock size={14} className="text-gray-600" />
                <span>Estimated time: {estimatedTime}</span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onCancel}
                  className="flex-1 px-3 py-2 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 px-3 py-2 text-[13px] font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Run Analysis
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExpensiveOperationModal;
