import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudArrowUp, File, FileImage, FileXls, FilePdf } from '@phosphor-icons/react';
import { FILE_SIZE_LIMIT_MB, MAX_FILES } from './types';

export interface DragDropOverlayProps {
  /** Whether the overlay is visible */
  isVisible: boolean;
  /** Whether files are being dragged over the drop zone */
  isDragActive?: boolean;
}

/**
 * DragDropOverlay component
 * Full-screen overlay shown when dragging files over the chat area
 */
export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({
  isVisible,
  isDragActive = false,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className={`
              flex flex-col items-center justify-center p-12 rounded-3xl
              border-2 border-dashed transition-colors duration-200
              ${isDragActive ? 'border-orange-400 bg-orange-50/50' : 'border-gray-300 bg-gray-50/50'}
            `}
          >
            {/* Upload icon */}
            <motion.div
              animate={isDragActive ? { y: [-4, 0, -4] } : { y: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className={`
                w-20 h-20 rounded-2xl flex items-center justify-center mb-6
                ${isDragActive ? 'bg-orange-100' : 'bg-gray-100'}
              `}
            >
              <CloudArrowUp
                size={48}
                weight="duotone"
                className={isDragActive ? 'text-orange-500' : 'text-gray-500'}
              />
            </motion.div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isDragActive ? 'Release to upload' : 'Drop files here'}
            </h3>

            {/* Subtitle */}
            <p className="text-sm text-gray-500 mb-6">
              {isDragActive
                ? 'Your files will be attached to your message'
                : 'Drag and drop files to attach them'}
            </p>

            {/* Supported file types */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <FilePdf size={16} weight="duotone" className="text-red-500" />
                <span>PDF</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <FileXls size={16} weight="duotone" className="text-green-500" />
                <span>Excel</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <File size={16} weight="duotone" className="text-blue-500" />
                <span>CSV</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <FileImage size={16} weight="duotone" className="text-purple-500" />
                <span>Images</span>
              </div>
            </div>

            {/* Limitations */}
            <div className="flex items-center gap-3 text-[11px] text-gray-400">
              <span>Max {MAX_FILES} files</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>Up to {FILE_SIZE_LIMIT_MB}MB each</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DragDropOverlay;
