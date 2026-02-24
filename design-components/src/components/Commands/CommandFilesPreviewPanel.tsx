/**
 * CommandFilesPreviewPanel
 *
 * Slides in to the left of the CommandDrawer when the user clicks a file chip.
 * Shows a tab strip (one tab per attached file) and a preview area beneath.
 * Reuses the same viewers as ArtifactViewerPanel (PDF, DOCX, XLSX, text).
 */

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileDoc,
  FilePdf,
  FileXls,
  FileCsv,
  FilePpt,
  FileText,
  FileImage,
  File as FileIcon,
  SpinnerGap,
  WarningCircle,
} from '@phosphor-icons/react';
import type { CommandAttachment } from './types';
import { useArtifactContent } from '../Chat/hooks/useArtifactContent';
import { PdfViewer } from '../Chat/viewers/PdfViewer';
import { TextViewer } from '../Chat/viewers/TextViewer';
import { DocxViewer } from '../Chat/viewers/DocxViewer';
import { HtmlSpreadsheetViewer } from '../Chat/viewers/HtmlSpreadsheetViewer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommandFileEntry {
  attachment: CommandAttachment;
  /** Blob URL (pending files) or server presigned URL (existing files) */
  previewUrl?: string;
}

export interface CommandFilesPreviewPanelProps {
  /** Shown in the breadcrumb: "<commandName> / <fileName>" */
  commandName: string;
  files: CommandFileEntry[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFileIcon(attachment: CommandAttachment): React.ReactNode {
  const ext = attachment.extension?.toLowerCase();
  const mime = attachment.type ?? '';

  if (attachment.category === 'image') return <FileImage size={40} weight="thin" className="text-purple-400" />;
  if (mime === 'application/pdf' || ext === 'pdf') return <FilePdf size={40} weight="thin" className="text-red-400" />;
  if (attachment.category === 'spreadsheet') {
    if (ext === 'csv') return <FileCsv size={40} weight="thin" className="text-green-500" />;
    return <FileXls size={40} weight="thin" className="text-green-500" />;
  }
  if (attachment.category === 'presentation') return <FilePpt size={40} weight="thin" className="text-orange-400" />;
  if (attachment.category === 'text') return <FileText size={40} weight="thin" className="text-slate-400" />;
  if (ext === 'doc' || ext === 'docx') return <FileDoc size={40} weight="thin" className="text-blue-400" />;
  return <FileIcon size={40} weight="thin" className="text-gray-400" />;
}

function getTabIcon(attachment: CommandAttachment): React.ReactNode {
  const ext = attachment.extension?.toLowerCase();
  const mime = attachment.type ?? '';

  if (attachment.category === 'image') return <FileImage size={13} weight="duotone" className="text-purple-400 shrink-0" />;
  if (mime === 'application/pdf' || ext === 'pdf') return <FilePdf size={13} weight="duotone" className="text-red-400 shrink-0" />;
  if (attachment.category === 'spreadsheet') {
    if (ext === 'csv') return <FileCsv size={13} weight="duotone" className="text-green-500 shrink-0" />;
    return <FileXls size={13} weight="duotone" className="text-green-500 shrink-0" />;
  }
  if (attachment.category === 'presentation') return <FilePpt size={13} weight="duotone" className="text-orange-400 shrink-0" />;
  if (attachment.category === 'text') return <FileText size={13} weight="duotone" className="text-slate-400 shrink-0" />;
  if (ext === 'doc' || ext === 'docx') return <FileDoc size={13} weight="duotone" className="text-blue-400 shrink-0" />;
  return <FileIcon size={13} weight="duotone" className="text-gray-400 shrink-0" />;
}

function getFileTypeLabel(attachment: CommandAttachment): string {
  const ext = attachment.extension?.toLowerCase();
  if (ext) return `${ext.toUpperCase()} file`;
  if (attachment.category) return `${attachment.category.charAt(0).toUpperCase()}${attachment.category.slice(1)} file`;
  return 'file';
}

// ---------------------------------------------------------------------------
// FileContentArea
// ---------------------------------------------------------------------------

interface FileContentAreaProps {
  entry: CommandFileEntry;
}

const FileContentArea: React.FC<FileContentAreaProps> = ({ entry }) => {
  const content = useArtifactContent(entry.previewUrl, entry.attachment.type);

  if (!entry.previewUrl) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-gray-50/60 select-none">
        {getFileIcon(entry.attachment)}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">{entry.attachment.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{getFileTypeLabel(entry.attachment)}</p>
        </div>
        <p className="text-xs text-gray-400">Preview not available</p>
      </div>
    );
  }

  if (content.kind === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50/60">
        <SpinnerGap size={24} weight="bold" className="text-gray-400 animate-spin" />
      </div>
    );
  }

  if (content.kind === 'error') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-gray-50/60 px-6">
        <WarningCircle size={24} weight="regular" className="text-gray-400" />
        <p className="text-sm text-gray-500 text-center">{content.message}</p>
      </div>
    );
  }

  if (content.kind === 'unsupported') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-gray-50/60 select-none">
        {getFileIcon(entry.attachment)}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">{entry.attachment.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{getFileTypeLabel(entry.attachment)}</p>
        </div>
        <p className="text-xs text-gray-400">Preview not available</p>
      </div>
    );
  }

  if (content.kind === 'pdf') return <PdfViewer url={content.url} />;
  if (content.kind === 'text') return <TextViewer text={content.text} />;
  if (content.kind === 'docx') return <DocxViewer buffer={content.buffer} />;
  if (content.kind === 'spreadsheet') {
    return <HtmlSpreadsheetViewer sheets={content.sheets} truncated={content.truncated} />;
  }

  return null;
};

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

export const CommandFilesPreviewPanel: React.FC<CommandFilesPreviewPanelProps> = ({
  commandName,
  files,
  initialIndex = 0,
  isOpen,
  onClose,
}) => {
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.min(initialIndex, Math.max(0, files.length - 1))
  );

  // Sync to the newly clicked file chip whenever initialIndex changes from the parent.
  // Using initialIndex (not files.length) as the sole dependency intentionally:
  // the user's own tab selections update activeIndex via setActiveIndex and must
  // not be overridden by an unrelated files.length change.
  useEffect(() => {
    setActiveIndex(Math.min(initialIndex, Math.max(0, files.length - 1)));
  }, [initialIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeEntry = files[activeIndex];

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && files.length > 0 && (
        <motion.div
          className="fixed top-0 right-0 h-full p-2"
          style={{ width: 600, maxWidth: '90vw', zIndex: 100 }}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          <div className="h-full flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-1.5 min-w-0 text-sm text-gray-500">
                <span className="font-medium text-gray-700 truncate max-w-[140px]" title={commandName}>
                  {commandName}
                </span>
                <span className="text-gray-300 shrink-0">/</span>
                <span className="truncate text-gray-500" title={activeEntry?.attachment.name}>
                  {activeEntry?.attachment.name}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0 ml-2"
                aria-label="Close file preview"
              >
                <X size={14} />
              </button>
            </div>

            {/* Tabs */}
            {files.length > 1 && (
              <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 overflow-x-auto shrink-0 scrollbar-hide">
                {files.map((entry, idx) => (
                  <button
                    key={entry.attachment.id}
                    onClick={() => setActiveIndex(idx)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                      idx === activeIndex
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    {getTabIcon(entry.attachment)}
                    <span className="max-w-[140px] truncate">{entry.attachment.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
              <AnimatePresence mode="wait">
                {activeEntry && (
                  <motion.div
                    key={activeEntry.attachment.id}
                    className="absolute inset-0 flex flex-col"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                  >
                    <FileContentArea entry={activeEntry} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default CommandFilesPreviewPanel;
