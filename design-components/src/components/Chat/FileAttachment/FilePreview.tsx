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
import { formatFileSize } from './types';

export interface FilePreviewProps {
  /** The file attachment to preview */
  attachment: FileAttachment;
  /** Callback when remove button is clicked */
  onRemove?: (id: string) => void;
  /** Whether the preview is removable */
  removable?: boolean;
  /** Size variant */
  size?: 'small' | 'medium';
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
 * Get background color based on file category
 */
function getCategoryColor(category: FileCategory): string {
  switch (category) {
    case 'image':
      return 'bg-purple-50';
    case 'spreadsheet':
      return 'bg-green-50';
    case 'document':
      return 'bg-red-50';
    case 'presentation':
      return 'bg-orange-50';
    case 'text':
      return 'bg-blue-50';
    default:
      return 'bg-gray-50';
  }
}

/**
 * Get icon color based on file category
 */
function getCategoryIconColor(category: FileCategory): string {
  switch (category) {
    case 'image':
      return 'text-purple-600';
    case 'spreadsheet':
      return 'text-green-600';
    case 'document':
      return 'text-red-600';
    case 'presentation':
      return 'text-orange-600';
    case 'text':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Get badge color based on file category
 */
function getCategoryBadgeColor(category: FileCategory): string {
  switch (category) {
    case 'image':
      return 'bg-purple-100 text-purple-700';
    case 'spreadsheet':
      return 'bg-green-100 text-green-700';
    case 'document':
      return 'bg-red-100 text-red-700';
    case 'presentation':
      return 'bg-orange-100 text-orange-700';
    case 'text':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

/**
 * FilePreview component for displaying attached files
 * Shows image preview for images, icon + name for other files
 */
export const FilePreview: React.FC<FilePreviewProps> = ({
  attachment,
  onRemove,
  removable = true,
  size = 'medium',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isImage = attachment.category === 'image';
  const IconComponent = getFileIcon(attachment.category, attachment.extension);

  const dimensions = size === 'small' ? 'h-16 w-16' : 'h-20 w-20';
  const iconSize = size === 'small' ? 24 : 28;

  // Truncate filename if too long
  const truncatedName =
    attachment.name.length > 20
      ? `${attachment.name.substring(0, 17)}...`
      : attachment.name;

  if (isImage && attachment.previewUrl) {
    // Image preview - square format
    return (
      <div
        className={`relative ${dimensions} rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 group`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src={attachment.previewUrl}
          alt={attachment.name}
          className="w-full h-full object-cover"
        />

        {/* Hover overlay with remove button */}
        {removable && isHovered && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity">
            <button
              onClick={() => onRemove?.(attachment.id)}
              className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
              aria-label={`Remove ${attachment.name}`}
            >
              <X size={16} weight="bold" className="text-gray-700" />
            </button>
          </div>
        )}

        {/* Upload progress indicator */}
        {attachment.status === 'uploading' && attachment.uploadProgress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div
              className="h-full bg-blue-500 transition-all duration-200"
              style={{ width: `${attachment.uploadProgress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  // Non-image file preview - rectangular box
  return (
    <div
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 ${getCategoryColor(attachment.category)} flex-shrink-0 group min-w-[180px] max-w-[220px]`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* File icon */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-lg bg-white flex items-center justify-center ${getCategoryIconColor(attachment.category)}`}
      >
        <IconComponent size={iconSize} weight="duotone" />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="text-sm font-medium text-gray-800 truncate" title={attachment.name}>
          {truncatedName}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${getCategoryBadgeColor(attachment.category)}`}
          >
            {attachment.extension}
          </span>
          <span className="text-[11px] text-gray-500">{formatFileSize(attachment.size)}</span>
        </div>
      </div>

      {/* Remove button */}
      {removable && isHovered && (
        <button
          onClick={() => onRemove?.(attachment.id)}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors shadow-sm"
          aria-label={`Remove ${attachment.name}`}
        >
          <X size={12} weight="bold" className="text-white" />
        </button>
      )}

      {/* Upload progress indicator */}
      {attachment.status === 'uploading' && attachment.uploadProgress !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-xl overflow-hidden">
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
