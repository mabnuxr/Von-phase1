import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudArrowUp } from '@phosphor-icons/react';
import { FILE_SIZE_LIMIT_MB, MAX_FILES } from './types';

export interface DragDropOverlayProps {
  /** Whether the overlay is visible */
  isVisible: boolean;
  /** Whether files are being dragged over the drop zone */
  isDragActive?: boolean;
}

/**
 * DragDropOverlay component
 * Compact inline overlay that replaces the chat input area when dragging files.
 * Uses muted colors consistent with the design system (bg-gray-50, border-gray-100).
 */
export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({
  isVisible,
  isDragActive = false,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
          className="w-full max-4-xl"
        >
          <div
            className={`
              flex items-center gap-4 px-5 py-4 rounded-2xl
              border border-dashed transition-colors duration-150
              ${isDragActive ? 'border-gray-300 bg-gray-50/50' : 'border-gray-200 bg-gray-50/50'}
            `}
          >
            {/* Upload icon */}
            <motion.div
              animate={isDragActive ? { y: [-2, 0, -2] } : { y: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 shadow-xs"
            >
              <CloudArrowUp size={22} weight="duotone" className="text-gray-500" />
            </motion.div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {isDragActive ? 'Release to upload' : 'Drop files here'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                PDF, Excel, CSV, Word, Images — max {MAX_FILES} files, {FILE_SIZE_LIMIT_MB}MB each
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DragDropOverlay;
