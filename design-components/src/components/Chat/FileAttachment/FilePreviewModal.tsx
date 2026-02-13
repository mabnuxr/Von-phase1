import React, { useEffect } from 'react';
import {
  XIcon,
  DownloadSimpleIcon,
  File,
  FileText,
  FileXls,
  FileCsv,
  FilePdf,
  FilePpt,
  FileDoc,
  FileImage,
  FileCode,
  SpinnerIcon,
} from '@phosphor-icons/react';
import type { MessageFileAttachment } from '../types';
import { formatFileSize } from './types';

export interface FilePreviewModalProps {
  /** The file attachment to preview */
  attachment: MessageFileAttachment;
  /** Presigned download URL (null while loading) */
  downloadUrl: string | null;
  /** Whether the download URL is being fetched */
  isLoading: boolean;
  /** Close the modal */
  onClose: () => void;
}

type FileCategory = 'document' | 'spreadsheet' | 'presentation' | 'text' | 'image';

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

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  attachment,
  downloadUrl,
  isLoading,
  onClose,
}) => {
  const isImage = attachment.type.startsWith('image/');
  const isPdf = attachment.type === 'application/pdf';

  // Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  const IconComponent = getFileIcon(attachment.category as FileCategory, attachment.extension);
  const colors = getCategoryColors(attachment.category as FileCategory, attachment.extension);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 antialiased"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white rounded-2xl shadow-modal max-w-[600px] w-full flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="file-preview-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <span
            id="file-preview-title"
            className="text-[13px] font-medium text-gray-500 truncate max-w-[200px]"
            title={attachment.name}
          >
            {attachment.name}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleDownload}
              disabled={!downloadUrl}
              className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Download"
            >
              <DownloadSimpleIcon size={14} weight="bold" className="text-gray-500" />
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <XIcon size={14} weight="bold" className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex items-center justify-center min-h-[200px]">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-gray-400 py-10">
              <SpinnerIcon size={24} className="animate-spin" />
              <span className="text-sm">Loading preview...</span>
            </div>
          ) : isImage && downloadUrl ? (
            <img
              src={downloadUrl}
              alt={attachment.name}
              className="max-h-[60vh] w-full object-contain"
            />
          ) : isPdf && downloadUrl ? (
            <iframe src={downloadUrl} title={attachment.name} className="w-full h-[60vh]" />
          ) : (
            /* Generic file info */
            <div className="flex flex-col items-center gap-3 py-10">
              <div
                className={`w-16 h-16 rounded-2xl ${colors.bg} flex items-center justify-center`}
              >
                <IconComponent size={32} weight="duotone" className={colors.text} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 m-0">{attachment.name}</p>
                <p className="text-xs text-gray-500 mt-1 m-0">
                  {attachment.extension} &middot; {formatFileSize(attachment.size)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
