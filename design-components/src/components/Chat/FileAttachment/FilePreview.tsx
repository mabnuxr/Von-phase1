import React, { useState } from 'react';
import {
  X,
  File,
  FileText,
  FileXls,
  FileCsv,
  FilePdf,
  FilePpt,
  FileDoc,
  FileImage,
  FileCode,
} from '@phosphor-icons/react';
import type { FileAttachment, FileCategory } from './types';

export interface FilePreviewProps {
  /** The file attachment to preview */
  attachment: FileAttachment;
  /** Callback when remove button is clicked */
  onRemove?: (id: string) => void;
  /** Whether the preview is removable */
  removable?: boolean;
  /** Size variant (kept for API compat, pill is always compact) */
  size?: 'small' | 'medium';
  /** Style variant (kept for API compat, pill style is always used) */
  variant?: 'default' | 'minimal';
}

/**
 * Get icon component based on file category and extension
 */
function getFileIcon(category: FileCategory, extension: string) {
  switch (category) {
    case 'image':
      return FileImage;
    case 'spreadsheet':
      if (extension === 'CSV') return FileCsv;
      return FileXls;
    case 'document':
      if (extension === 'PDF') return FilePdf;
      if (extension === 'DOC' || extension === 'DOCX') return FileDoc;
      return FileText;
    case 'presentation':
      return FilePpt;
    case 'text':
      if (extension === 'JSON' || extension === 'MD') return FileCode;
      return FileText;
    default:
      return File;
  }
}

/**
 * FilePreview component — compact rounded-full pill design
 *
 * - White bg, border-gray-100, shadow-xs, rounded-full
 * - Max width 220px, name truncated beyond that
 * - If image with preview: shows small circular thumbnail on the left
 * - Otherwise: shows file type icon on the left
 * - On hover: bg-gray-50/50, shows X icon on the far right
 * - Click X to remove
 */
export const FilePreview: React.FC<FilePreviewProps> = ({
  attachment,
  onRemove,
  removable = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isImage = attachment.category === 'image';
  const hasPreview = isImage && attachment.previewUrl;
  const IconComponent = getFileIcon(attachment.category, attachment.extension);

  return (
    <div
      className={`relative flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border border-gray-100 bg-white shadow-xs max-w-[220px] flex-shrink-0 transition-colors duration-150 ${
        isHovered ? 'bg-gray-50/50' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left side: image preview or file icon */}
      {hasPreview ? (
        <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
          <img
            src={attachment.previewUrl}
            alt={attachment.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <IconComponent size={12} weight="duotone" className="text-gray-500" />
        </div>
      )}

      {/* File name — truncated */}
      <span className="text-xs text-gray-800 truncate min-w-0" title={attachment.name}>
        {attachment.name}
      </span>

      {/* X icon — shown on hover */}
      {removable && isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.(attachment.id);
          }}
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors ml-auto"
          aria-label={`Remove ${attachment.name}`}
        >
          <X size={10} weight="bold" className="text-gray-800" />
        </button>
      )}

      {/* Upload progress indicator */}
      {attachment.status === 'uploading' && attachment.uploadProgress !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-200"
            style={{ width: `${attachment.uploadProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default FilePreview;
