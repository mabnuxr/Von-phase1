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
} from '@phosphor-icons/react';
import type { MessageFileAttachment } from '../types';
import { formatFileSize } from './types';

export interface MessageFilePreviewProps {
  /** The file attachments to display */
  attachments: MessageFileAttachment[];
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
 * MessageFilePreview component for displaying attached files in sent messages
 * Non-removable, read-only display
 */
export const MessageFilePreview: React.FC<MessageFilePreviewProps> = ({ attachments }) => {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {attachments.map((attachment) => {
        const isImage = attachment.category === 'image';
        const IconComponent = getFileIcon(attachment.category, attachment.extension);

        // Truncate filename if too long
        const truncatedName =
          attachment.name.length > 18 ? `${attachment.name.substring(0, 15)}...` : attachment.name;

        if (isImage && attachment.previewUrl) {
          // Image preview - square format
          return (
            <div
              key={attachment.id}
              className="relative h-16 w-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0"
            >
              <img
                src={attachment.previewUrl}
                alt={attachment.name}
                className="w-full h-full object-cover"
              />
            </div>
          );
        }

        // Non-image file preview - compact rectangular box
        return (
          <div
            key={attachment.id}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-200 ${getCategoryColor(attachment.category)} flex-shrink-0`}
          >
            {/* File icon */}
            <div
              className={`flex-shrink-0 w-7 h-7 rounded bg-white flex items-center justify-center ${getCategoryIconColor(attachment.category)}`}
            >
              <IconComponent size={16} weight="duotone" />
            </div>

            {/* File info */}
            <div className="min-w-0 overflow-hidden">
              <div
                className="text-xs font-medium text-gray-800 truncate max-w-[120px]"
                title={attachment.name}
              >
                {truncatedName}
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={`text-[9px] font-semibold px-1 py-0.5 rounded ${getCategoryBadgeColor(attachment.category)}`}
                >
                  {attachment.extension}
                </span>
                <span className="text-[10px] text-gray-500">{formatFileSize(attachment.size)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageFilePreview;
