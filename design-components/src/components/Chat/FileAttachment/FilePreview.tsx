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
  /** Size variant (kept for API compat) */
  size?: 'small' | 'medium';
  /** Style variant (kept for API compat) */
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
 * Get category-specific colors for the icon area
 */
function getCategoryColors(
  category: FileCategory,
  extension: string
): { bg: string; text: string } {
  switch (category) {
    case 'document':
      if (extension === 'PDF') return { bg: 'bg-red-50', text: 'text-red-600' };
      if (extension === 'DOC' || extension === 'DOCX')
        return { bg: 'bg-blue-50', text: 'text-blue-600' };
      return { bg: 'bg-gray-100', text: 'text-gray-500' };
    case 'spreadsheet':
      return { bg: 'bg-green-50', text: 'text-green-600' };
    case 'presentation':
      return { bg: 'bg-orange-50', text: 'text-orange-500' };
    case 'image':
      return { bg: 'bg-purple-50', text: 'text-purple-500' };
    case 'text':
      if (extension === 'JSON' || extension === 'MD')
        return { bg: 'bg-slate-100', text: 'text-slate-600' };
      return { bg: 'bg-gray-100', text: 'text-gray-500' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-500' };
  }
}

/**
 * FilePreview component — card-style file attachment with colored icon
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
  const colors = getCategoryColors(attachment.category, attachment.extension);
  const isLoading = attachment.status === 'uploading';

  return (
    <div
      className={`relative flex items-center gap-2.5 p-2 pr-3 rounded-xl border border-gray-200 bg-white shadow-xs max-w-[240px] flex-shrink-0 transition-colors duration-150 cursor-pointer ${
        isHovered ? 'bg-gray-50/50' : ''
      } ${isLoading ? 'animate-pulse opacity-70' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left side: image preview or colored file icon */}
      {hasPreview ? (
        <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={attachment.previewUrl}
            alt={attachment.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}
        >
          <IconComponent size={18} weight="duotone" className={colors.text} />
        </div>
      )}

      {/* File name — truncated */}
      <span
        className="text-[13px] font-medium text-gray-800 truncate min-w-0"
        title={attachment.name}
      >
        {attachment.name}
      </span>

      {/* X icon — shown on hover */}
      {removable && isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.(attachment.id);
          }}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-200 hover:cursor-pointer transition-colors ml-auto"
          aria-label={`Remove ${attachment.name}`}
        >
          <X size={12} weight="bold" className="text-gray-800" />
        </button>
      )}
    </div>
  );
};

export default FilePreview;
