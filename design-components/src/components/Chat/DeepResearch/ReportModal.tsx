import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, DownloadSimpleIcon } from '@phosphor-icons/react';
import { Streamdown } from 'streamdown';
import { PrimaryButton } from '../../forms/buttons';

export interface ReportModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Title of the report */
  title: string;
  /** Markdown content of the report */
  content: string;
  /** Callback when "Build Dashboard" is clicked */
  onBuildDashboard?: () => void;
  /** Callback when "Download PDF" is clicked */
  onDownload?: () => void;
}

/**
 * ReportModal Component
 *
 * Full-screen modal for viewing deep research reports.
 * Provides expanded view with build dashboard and download options.
 */
export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  onBuildDashboard,
  onDownload,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-xl shadow-xl w-[90vw] max-w-4xl h-[85vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-medium text-gray-900">{title}</h2>
              <div className="flex items-center gap-2">
                {onBuildDashboard && (
                  <PrimaryButton onClick={onBuildDashboard}>Build Dashboard</PrimaryButton>
                )}
                {onDownload && (
                  <button
                    onClick={onDownload}
                    className="p-2 text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-lg transition-colors cursor-pointer"
                    title="Download PDF"
                  >
                    <DownloadSimpleIcon size={16} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <XIcon size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="prose-sm markdown-body max-w-none">
                <Streamdown parseIncompleteMarkdown={false} isAnimating={false} controls={{ table: true }}>
                  {content}
                </Streamdown>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReportModal;
