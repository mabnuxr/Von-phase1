/**
 * FilesPreviewPanel
 *
 * Generic slide-in panel for previewing one or more files with a tab strip.
 * Supports PDF, DOCX, XLSX/CSV, plain text, markdown, and images.
 *
 * Designed to be reusable across features — pass any object that satisfies
 * `PreviewableFile` together with a `previewUrl` and the panel handles the rest.
 *
 * previewUrl has three states:
 *   undefined — URL not yet fetched; panel shows a spinner and fires onRequestPreviewUrl
 *   null      — fetch was attempted and failed; panel shows "Preview not available"
 *   string    — URL is ready; panel loads and renders the file content
 */

import React, { useState, useEffect, useRef } from 'react';
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
  File as GenericFileIcon,
  SpinnerGap,
  WarningCircle,
} from '@phosphor-icons/react';
import { useArtifactContent } from '../Chat/hooks/useArtifactContent';
import { PdfViewer } from '../Chat/viewers/PdfViewer';
import { TextViewer } from '../Chat/viewers/TextViewer';
import { DocxViewer } from '../Chat/viewers/DocxViewer';
import { HtmlSpreadsheetViewer } from '../Chat/viewers/HtmlSpreadsheetViewer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal shape a file must satisfy to be previewed. */
export interface PreviewableFile {
  id: string;
  name: string;
  /** MIME type, e.g. "application/pdf" */
  type: string;
  extension?: string;
  category?: string;
  size?: number;
}

export interface FilePreviewEntry {
  file: PreviewableFile;
  /**
   * - `undefined` — URL not yet fetched (panel will call onRequestPreviewUrl)
   * - `null`      — URL fetch failed (panel shows "Preview not available")
   * - `string`    — URL is ready (panel loads the file content)
   */
  previewUrl?: string | null;
}

export interface FilesPreviewPanelProps {
  /**
   * Label shown in the breadcrumb before the file name.
   * e.g. the command name, deal name, or document title.
   */
  contextName: string;
  files: FilePreviewEntry[];
  /** Tab to open when the panel first appears (or the parent navigates to a new file). */
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  /**
   * Called when the active tab has no previewUrl yet (undefined).
   * The parent should fetch the URL and update the matching entry's previewUrl.
   * Set previewUrl to null if the fetch fails so the panel shows the error state.
   */
  onRequestPreviewUrl?: (fileId: string) => void;
}

// ---------------------------------------------------------------------------
// Animation constants
// ---------------------------------------------------------------------------

const SLIDE_TRANSITION = { type: 'spring', damping: 30, stiffness: 300 } as const;
const FADE_TRANSITION = { duration: 0.12 } as const;

// ---------------------------------------------------------------------------
// AttachmentIcon — unified file-type icon, parameterised by size and weight
// ---------------------------------------------------------------------------

interface AttachmentIconProps {
  file: PreviewableFile;
  size: number;
  weight?: 'thin' | 'duotone';
  className?: string;
}

const AttachmentIcon: React.FC<AttachmentIconProps> = ({
  file,
  size,
  weight = 'thin',
  className = '',
}) => {
  const ext = file.extension?.toLowerCase();
  const mime = file.type ?? '';
  const base = `shrink-0 ${className}`;

  if (file.category === 'image')
    return <FileImage size={size} weight={weight} className={`text-purple-400 ${base}`} />;
  if (mime === 'application/pdf' || ext === 'pdf')
    return <FilePdf size={size} weight={weight} className={`text-red-400 ${base}`} />;
  if (file.category === 'spreadsheet')
    return ext === 'csv' ? (
      <FileCsv size={size} weight={weight} className={`text-green-500 ${base}`} />
    ) : (
      <FileXls size={size} weight={weight} className={`text-green-500 ${base}`} />
    );
  if (file.category === 'presentation')
    return <FilePpt size={size} weight={weight} className={`text-orange-400 ${base}`} />;
  if (file.category === 'text')
    return <FileText size={size} weight={weight} className={`text-slate-400 ${base}`} />;
  if (ext === 'doc' || ext === 'docx')
    return <FileDoc size={size} weight={weight} className={`text-blue-400 ${base}`} />;
  return <GenericFileIcon size={size} weight={weight} className={`text-gray-400 ${base}`} />;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFileTypeLabel(file: PreviewableFile): string {
  const ext = file.extension?.toLowerCase();
  if (ext) return `${ext.toUpperCase()} file`;
  if (file.category)
    return `${file.category.charAt(0).toUpperCase()}${file.category.slice(1)} file`;
  return 'file';
}

// ---------------------------------------------------------------------------
// Shared states
// ---------------------------------------------------------------------------

const LoadingSpinner: React.FC = () => (
  <div className="flex-1 flex items-center justify-center bg-gray-50/60">
    <SpinnerGap size={24} weight="bold" className="text-gray-400 animate-spin" />
  </div>
);

interface UnsupportedPlaceholderProps {
  file: PreviewableFile;
  message?: string;
}

const UnsupportedPlaceholder: React.FC<UnsupportedPlaceholderProps> = ({
  file,
  message = 'Preview not available',
}) => (
  <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-gray-50/60 select-none">
    <AttachmentIcon file={file} size={40} weight="thin" />
    <div className="text-center">
      <p className="text-sm font-medium text-gray-700">{file.name}</p>
      <p className="text-xs text-gray-400 mt-0.5">{getFileTypeLabel(file)}</p>
    </div>
    <p className="text-xs text-gray-400">{message}</p>
  </div>
);

// ---------------------------------------------------------------------------
// FileContentArea
// ---------------------------------------------------------------------------

interface FileContentAreaProps {
  entry: FilePreviewEntry;
}

const FileContentArea: React.FC<FileContentAreaProps> = ({ entry }) => {
  const content = useArtifactContent(entry.previewUrl ?? undefined, entry.file.type);

  // undefined → URL not yet fetched; parent has been asked to supply it
  if (entry.previewUrl === undefined) {
    return <LoadingSpinner />;
  }

  // null → URL fetch failed
  if (entry.previewUrl === null) {
    return <UnsupportedPlaceholder file={entry.file} />;
  }

  switch (content.kind) {
    case 'loading':
      return <LoadingSpinner />;

    case 'error':
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-gray-50/60 px-6">
          <WarningCircle size={24} weight="regular" className="text-gray-400" />
          <p className="text-sm text-gray-500 text-center">{content.message}</p>
        </div>
      );

    case 'unsupported':
      return <UnsupportedPlaceholder file={entry.file} />;

    case 'image':
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50/60 p-4 overflow-auto">
          <img
            src={content.url}
            alt={entry.file.name}
            className="max-w-full max-h-full object-contain rounded-md shadow-sm"
          />
        </div>
      );

    case 'pdf':
      return <PdfViewer url={content.url} />;

    case 'text':
      return <TextViewer text={content.text} />;

    case 'docx':
      return <DocxViewer buffer={content.buffer} />;

    case 'spreadsheet':
      return <HtmlSpreadsheetViewer sheets={content.sheets} truncated={content.truncated} />;

    default:
      return null;
  }
};

// ---------------------------------------------------------------------------
// PanelHeader
// ---------------------------------------------------------------------------

interface PanelHeaderProps {
  contextName: string;
  fileName?: string;
  onClose: () => void;
}

const PanelHeader: React.FC<PanelHeaderProps> = ({ contextName, fileName, onClose }) => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
    <div className="flex items-center gap-1.5 min-w-0 text-sm text-gray-500">
      <span className="font-medium text-gray-700 truncate max-w-[140px]" title={contextName}>
        {contextName}
      </span>
      <span className="text-gray-300 shrink-0">/</span>
      <span className="truncate text-gray-500" title={fileName}>
        {fileName}
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
);

// ---------------------------------------------------------------------------
// FileTabs
// ---------------------------------------------------------------------------

interface FileTabsProps {
  files: FilePreviewEntry[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

const FileTabs: React.FC<FileTabsProps> = ({ files, activeIndex, onSelect }) => {
  if (files.length <= 1) return null;

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 overflow-x-auto shrink-0 scrollbar-hide">
      {files.map((entry, idx) => (
        <button
          key={entry.file.id}
          onClick={() => onSelect(idx)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
            idx === activeIndex
              ? 'bg-gray-100 text-gray-900 font-medium'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          }`}
        >
          <AttachmentIcon file={entry.file} size={13} weight="duotone" />
          <span className="max-w-[140px] truncate">{entry.file.name}</span>
        </button>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// FilesPreviewPanel
// ---------------------------------------------------------------------------

export const FilesPreviewPanel: React.FC<FilesPreviewPanelProps> = ({
  contextName,
  files,
  initialIndex = 0,
  isOpen,
  onClose,
  onRequestPreviewUrl,
}) => {
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.min(initialIndex, Math.max(0, files.length - 1))
  );

  // Sync active tab when the parent explicitly navigates to a new file.
  // We track the previous value so that unrelated changes to files.length
  // (e.g. an upload completing) don't override the user's own tab selection.
  const prevInitialIndexRef = useRef(initialIndex);
  useEffect(() => {
    if (initialIndex !== prevInitialIndexRef.current) {
      prevInitialIndexRef.current = initialIndex;
      setActiveIndex(Math.min(initialIndex, Math.max(0, files.length - 1)));
    }
  }, [initialIndex, files.length]);

  // Track which file IDs we've already requested a URL for to avoid duplicate calls.
  // Reset whenever the panel opens so a fresh open (e.g. editing a different command)
  // re-requests URLs that may have been cleared by the parent.
  const requestedIdsRef = useRef(new Set<string>());
  useEffect(() => {
    if (isOpen) requestedIdsRef.current = new Set();
  }, [isOpen]);

  // Fire onRequestPreviewUrl whenever the active entry has no URL yet (undefined).
  // Runs on initial mount, tab switches, and when the parent navigates via initialIndex.
  const activeEntry = files[activeIndex];
  useEffect(() => {
    if (!activeEntry || activeEntry.previewUrl !== undefined || !onRequestPreviewUrl) return;
    const id = activeEntry.file.id;
    if (requestedIdsRef.current.has(id)) return;
    requestedIdsRef.current.add(id);
    onRequestPreviewUrl(id);
  }, [activeEntry?.file.id, activeEntry?.previewUrl, onRequestPreviewUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && files.length > 0 && (
        <motion.div
          className="fixed top-0 right-0 h-full p-2"
          style={{ width: 600, maxWidth: '90vw', zIndex: 100 }}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={SLIDE_TRANSITION}
        >
          <div className="h-full flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <PanelHeader
              contextName={contextName}
              fileName={activeEntry?.file.name}
              onClose={onClose}
            />

            <FileTabs files={files} activeIndex={activeIndex} onSelect={setActiveIndex} />

            <div className="flex-1 relative overflow-hidden flex flex-col">
              <AnimatePresence mode="wait">
                {activeEntry && (
                  <motion.div
                    key={activeEntry.file.id}
                    className="absolute inset-0 flex flex-col"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={FADE_TRANSITION}
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

export default FilesPreviewPanel;
