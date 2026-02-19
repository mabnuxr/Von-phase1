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
import { useArtifactContent } from '../hooks/useArtifactContent';
import { PdfViewer } from '../viewers/PdfViewer';
import { TextViewer } from '../viewers/TextViewer';
import { DocxViewer } from '../viewers/DocxViewer';
import { HtmlSpreadsheetViewer } from '../viewers/HtmlSpreadsheetViewer';

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

// MIME types that have a rich viewer (must match useArtifactContent)
const RICH_PREVIEW_MIMES = new Set([
  'application/pdf',
  'text/markdown',
  'text/plain',
  'text/x-markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
]);

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
  // Determine upfront if a rich viewer exists — avoids layout shift when content loads
  const canRichPreview = !isImage && RICH_PREVIEW_MIMES.has(attachment.type);

  // For non-image files, parse content using the same hook as artifact viewers
  const content = useArtifactContent(
    isImage ? undefined : (downloadUrl ?? undefined),
    isImage ? undefined : attachment.type
  );

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

  const handleDownload = async () => {
    if (!downloadUrl) return;
    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = attachment.name;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      window.open(downloadUrl, '_blank');
    }
  };

  const IconComponent = getFileIcon(attachment.category as FileCategory, attachment.extension);
  const colors = getCategoryColors(attachment.category as FileCategory, attachment.extension);

  // Show loading only while URL is actively being fetched, or content is parsing
  // (not when downloadUrl is null after fetch failed — that's a failed state, not loading)
  const showLoading = isLoading || (!isImage && !!downloadUrl && content.kind === 'loading');
  // URL fetch failed — no downloadUrl and not loading
  const urlFetchFailed = !isLoading && !downloadUrl;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 antialiased"
      onClick={handleOverlayClick}
    >
      <div
        className={`bg-white rounded-2xl shadow-modal flex flex-col overflow-hidden ${
          canRichPreview ? 'max-w-[900px] w-full h-[80vh]' : 'max-w-[600px] w-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="file-preview-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
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
        <div
          className={
            canRichPreview
              ? 'flex-1 overflow-hidden flex flex-col'
              : 'flex items-center justify-center min-h-[200px]'
          }
        >
          {/* Loading */}
          {showLoading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400 py-10">
              <SpinnerIcon size={24} className="animate-spin" />
              <span className="text-sm">Loading preview...</span>
            </div>
          )}

          {/* Image preview */}
          {isImage && !isLoading && downloadUrl && (
            <img
              src={downloadUrl}
              alt={attachment.name}
              className="max-h-[60vh] w-full object-contain"
            />
          )}

          {/* Rich viewers */}
          {!isImage && content.kind === 'pdf' && <PdfViewer url={content.url} />}
          {!isImage && content.kind === 'text' && <TextViewer text={content.text} />}
          {!isImage && content.kind === 'docx' && <DocxViewer buffer={content.buffer} />}
          {!isImage && content.kind === 'spreadsheet' && (
            <HtmlSpreadsheetViewer sheets={content.sheets} truncated={content.truncated} />
          )}

          {/* Error */}
          {!isImage && content.kind === 'error' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-500 py-10">
              <p className="text-sm text-center">{content.message}</p>
            </div>
          )}

          {/* URL fetch failed — show generic file card instead of infinite spinner */}
          {urlFetchFailed && (
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
                <p className="text-xs text-gray-400 mt-2 m-0">Preview unavailable</p>
              </div>
            </div>
          )}

          {/* Unsupported — generic file card */}
          {!isImage && !isLoading && !urlFetchFailed && content.kind === 'unsupported' && (
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
