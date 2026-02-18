/**
 * ArtifactViewerPanel — Resizable side panel for previewing agent-generated artifacts
 *
 * Rendering is fully client-side (no data sent to external services):
 * - PDF: native browser iframe
 * - MD/TXT: TipTap readonly editor
 * - DOCX: docx-preview → rendered in DOM
 * - XLSX/CSV: SheetJS → HTML table preview
 */

import React from 'react';
import {
  X as XIcon,
  DownloadSimple as DownloadSimpleIcon,
  FileDoc as FileDocIcon,
  PresentationChart as PresentationChartIcon,
  Table as TableIcon,
  SpinnerGap as SpinnerGapIcon,
  WarningCircle as WarningCircleIcon,
} from '@phosphor-icons/react';
import { useHorizontalResize } from '../ArtifactViewer/hooks/useHorizontalResize';
import { useArtifactContent } from './hooks/useArtifactContent';
import { TextViewer } from './viewers/TextViewer';
import { DocxViewer } from './viewers/DocxViewer';
import { HtmlSpreadsheetViewer } from './viewers/HtmlSpreadsheetViewer';

// ============================================================================
// Types
// ============================================================================

export interface ArtifactViewerPanelProps {
  fileName: string;
  artifactType: string;
  mimeType?: string;
  downloadUrl?: string;
  onClose: () => void;
  onDownload?: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

const TYPE_ICONS: Record<string, React.ReactNode> = {
  document: <FileDocIcon size={18} weight="regular" className="text-gray-500" />,
  slides: <PresentationChartIcon size={18} weight="regular" className="text-gray-500" />,
  spreadsheet: <TableIcon size={18} weight="regular" className="text-gray-500" />,
};

// ============================================================================
// Component
// ============================================================================

export const ArtifactViewerPanel: React.FC<ArtifactViewerPanelProps> = ({
  fileName,
  artifactType,
  mimeType,
  downloadUrl,
  onClose,
  onDownload,
}) => {
  const icon = TYPE_ICONS[artifactType] ?? TYPE_ICONS.document;
  const content = useArtifactContent(downloadUrl, mimeType);

  const { width, handleProps } = useHorizontalResize({
    initialWidth: 480,
    minWidth: 380,
    maxWidth: 800,
    storageKey: 'artifact-viewer-panel-width',
  });

  return (
    <div className="h-full flex-shrink-0 relative" style={{ width: `${width}px` }}>
      {/* Resize handle on left edge — wide hit area with thin visible line */}
      <div
        {...handleProps}
        className="absolute left-0 top-0 bottom-0 w-3 z-10 cursor-ew-resize group"
      >
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-transparent group-hover:bg-gray-300 transition-colors" />
      </div>

      {/* Panel */}
      <div className="h-full w-full flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {icon}
            <h2 className="text-sm font-medium text-gray-900 truncate">{fileName}</h2>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {onDownload && (
              <button
                onClick={onDownload}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                title="Download"
              >
                <DownloadSimpleIcon size={18} weight="regular" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Close"
            >
              <XIcon size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          {content.kind === 'loading' && (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <SpinnerGapIcon size={24} weight="bold" className="text-gray-400 animate-spin" />
            </div>
          )}

          {content.kind === 'error' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-gray-50 text-gray-500 px-6">
              <WarningCircleIcon size={24} weight="regular" />
              <p className="text-sm text-center">{content.message}</p>
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="text-sm text-blue-600 hover:text-blue-700 underline cursor-pointer"
                >
                  Download to view
                </button>
              )}
            </div>
          )}

          {content.kind === 'pdf' && (
            <iframe
              src={content.url}
              className="w-full h-full border-0 flex-1"
              title={`Preview: ${fileName}`}
            />
          )}

          {content.kind === 'text' && <TextViewer text={content.text} />}

          {content.kind === 'docx' && <DocxViewer buffer={content.buffer} />}

          {content.kind === 'spreadsheet' && (
            <HtmlSpreadsheetViewer sheets={content.sheets} truncated={content.truncated} />
          )}

          {content.kind === 'unsupported' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-gray-50 text-gray-500">
              {icon}
              <p className="text-sm">Preview not available for this file type</p>
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="text-sm text-blue-600 hover:text-blue-700 underline cursor-pointer"
                >
                  Download to view
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
