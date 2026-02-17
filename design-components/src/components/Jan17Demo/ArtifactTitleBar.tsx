import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GoogleDriveLogo as GoogleDriveLogoIcon,
  DownloadSimple as DownloadSimpleIcon,
  PencilSimple as PencilSimpleIcon,
  Check as CheckIcon,
} from '@phosphor-icons/react';

// ============================================================================
// Types
// ============================================================================

export interface DownloadOption {
  label: string;
  onClick: () => void;
}

export interface ArtifactTitleBarProps {
  title: string;
  downloadOptions: DownloadOption[];
  isEditing: boolean;
  onToggleEdit: () => void;
  onGoogleDriveClick?: () => void;
}

// ============================================================================
// Download Popover
// ============================================================================

interface DownloadPopoverProps {
  options: DownloadOption[];
  isOpen: boolean;
  onClose: () => void;
}

const DownloadPopover: React.FC<DownloadPopoverProps> = ({ options, isOpen, onClose }) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-w-[180px]"
        >
          {options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => {
                option.onClick();
                onClose();
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2"
            >
              <DownloadSimpleIcon size={14} weight="regular" className="text-gray-400" />
              {option.label}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const ArtifactTitleBar: React.FC<ArtifactTitleBarProps> = ({
  title,
  downloadOptions,
  isEditing,
  onToggleEdit,
  onGoogleDriveClick,
}) => {
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
      {/* Title */}
      <h2 className="text-sm font-medium text-gray-900 truncate">{title}</h2>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Google Drive */}
        <button
          onClick={() => {
            console.log('Google Drive sync clicked');
            onGoogleDriveClick?.();
          }}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          title="Save to Google Drive"
        >
          <GoogleDriveLogoIcon size={18} weight="regular" />
        </button>

        {/* Download with popover */}
        <div className="relative">
          <button
            onClick={() => setIsDownloadOpen(!isDownloadOpen)}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Download"
          >
            <DownloadSimpleIcon size={18} weight="regular" />
          </button>
          <DownloadPopover
            options={downloadOptions}
            isOpen={isDownloadOpen}
            onClose={() => setIsDownloadOpen(false)}
          />
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-gray-200 mx-0.5" />

        {/* Edit/Done toggle */}
        {isEditing ? (
          <button
            onClick={onToggleEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <CheckIcon size={14} weight="bold" />
            Done
          </button>
        ) : (
          <button
            onClick={onToggleEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <PencilSimpleIcon size={14} weight="regular" />
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default ArtifactTitleBar;
