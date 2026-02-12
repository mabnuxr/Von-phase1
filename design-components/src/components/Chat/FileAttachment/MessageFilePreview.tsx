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
 * MessageFilePreview component — compact rounded-full pill design
 * Matches FilePreview pill style but read-only (no remove button)
 */
export const MessageFilePreview: React.FC<MessageFilePreviewProps> = ({ attachments }) => {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {attachments.map((attachment) => {
        const isImage = attachment.category === 'image';
        const hasPreview = isImage && attachment.previewUrl;
        const IconComponent = getFileIcon(attachment.category, attachment.extension);

        return (
          <div
            key={attachment.id}
            className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border border-gray-100 bg-white shadow-xs max-w-[220px] flex-shrink-0"
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
          </div>
        );
      })}
    </div>
  );
};

export default MessageFilePreview;
