import React from 'react';
import {
  File,
  FileText,
  FileXls,
  FileCsv,
  FilePdf,
  FilePpt,
  FileDoc,
  FileImage,
  FileCode,
  ArrowsOutIcon,
} from '@phosphor-icons/react';
import type { MessageFileAttachment } from '../types';

export interface MessageFilePreviewProps {
  /** The file attachments to display */
  attachments: MessageFileAttachment[];
  /** Callback when a file pill is clicked (for preview/download) */
  onFileClick?: (attachment: MessageFileAttachment) => void;
}

type FileCategory = 'document' | 'spreadsheet' | 'presentation' | 'text' | 'image';

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
 * MessageFilePreview component — card-style file attachment with colored icon
 * Clickable with expand icon on hover for preview/download
 */
export const MessageFilePreview: React.FC<MessageFilePreviewProps> = ({
  attachments,
  onFileClick,
}) => {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {attachments.map((attachment) => {
        const isImage = attachment.category === 'image';
        const hasPreview = isImage && attachment.previewUrl;
        const IconComponent = getFileIcon(
          attachment.category as FileCategory,
          attachment.extension
        );
        const colors = getCategoryColors(attachment.category as FileCategory, attachment.extension);
        const isClickable = !!onFileClick;

        return (
          <div
            key={attachment.id}
            className={`group/pill relative flex items-center gap-2.5 p-2 pr-3 rounded-xl border border-gray-200 bg-white shadow-xs max-w-[240px] flex-shrink-0 transition-colors ${
              isClickable ? 'cursor-pointer hover:bg-gray-50' : ''
            }`}
            onClick={isClickable ? () => onFileClick(attachment) : undefined}
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

            {/* Expand icon — shows on hover */}
            {isClickable && (
              <div className="absolute top-1 right-1 opacity-0 group-hover/pill:opacity-100 transition-opacity p-0.5 rounded bg-gray-200/70">
                <ArrowsOutIcon size={12} weight="bold" className="text-gray-600" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MessageFilePreview;
