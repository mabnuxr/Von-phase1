/**
 * ArtifactViewerPanel — Resizable side panel for previewing agent-generated artifacts
 *
 * Rendering is fully client-side (no data sent to external services):
 * - PDF: native browser iframe
 * - MD/TXT: TipTap readonly editor
 * - DOCX: docx-preview → rendered in DOM
 * - XLSX/CSV: SheetJS → HTML table preview
 */

import React, { useState } from 'react';
import {
  XIcon,
  DownloadSimpleIcon,
  FileDocIcon,
  PresentationChartIcon,
  TableIcon,
  SpinnerGapIcon,
  WarningCircleIcon,
  ArrowSquareOutIcon,
} from '@phosphor-icons/react';
import { Tooltip } from '../Tooltip';
import driveLogo from '../../assets/drive-logo.svg';
import { useHorizontalResize } from '../ArtifactViewer/hooks/useHorizontalResize';
import { useArtifactContent } from './hooks/useArtifactContent';
import { TextViewer } from './viewers/TextViewer';
import { DocxViewer } from './viewers/DocxViewer';
import { HtmlSpreadsheetViewer } from './viewers/HtmlSpreadsheetViewer';
import { PdfViewer } from './viewers/PdfViewer';

// ============================================================================
// Types
// ============================================================================

export interface ArtifactViewerPanelProps {
  fileName: string;
  artifactType: string;
  mimeType?: string;
  downloadUrl?: string;
  pdfDownloadUrl?: string;
  onClose: () => void;
  onDownload?: () => void;
  onGoogleDriveClick?: () => void;
  isDriveEnabled?: boolean;
  isDriveConnected?: boolean;
  driveTooltip?: string;
  isDriveLoading?: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  document: {
    icon: <FileDocIcon size={20} weight="regular" className="text-gray-500" />,
    label: 'Document',
  },
  slides: {
    icon: <PresentationChartIcon size={20} weight="regular" className="text-gray-500" />,
    label: 'Presentation',
  },
  spreadsheet: {
    icon: <TableIcon size={20} weight="regular" className="text-gray-500" />,
    label: 'Spreadsheet',
  },
};

const DEFAULT_CONFIG = {
  icon: <FileDocIcon size={20} weight="regular" className="text-gray-500" />,
  label: 'File',
};

// ============================================================================
// Component
// ============================================================================

export const ArtifactViewerPanel: React.FC<ArtifactViewerPanelProps> = ({
  fileName,
  artifactType,
  mimeType,
  downloadUrl,
  pdfDownloadUrl,
  onClose,
  onDownload,
  onGoogleDriveClick,
  isDriveEnabled,
  isDriveConnected,
  driveTooltip,
  isDriveLoading,
}) => {
  const config = TYPE_CONFIG[artifactType] ?? DEFAULT_CONFIG;
  const content = useArtifactContent(downloadUrl, mimeType, pdfDownloadUrl);
  const [showDrivePopup, setShowDrivePopup] = useState(false);

  const { width, handleProps } = useHorizontalResize({
    initialWidth: 480,
    minWidth: 380,
    maxWidth: 800,
    storageKey: 'artifact-viewer-panel-width',
  });

  return (
    <div className="h-full shrink-0 relative" style={{ width: `${width}px` }}>
      {/* Resize handle — sits in the gap between chat and panel */}
      <div
        {...handleProps}
        className="absolute -left-2 top-0 bottom-0 w-4 z-10 cursor-ew-resize group"
      >
        <div className="absolute left-0.75 top-2 bottom-2 w-0.75 rounded-full bg-transparent group-hover:bg-gray-300 group-active:bg-blue-400 transition-colors" />
      </div>

      {/* Panel */}
      <div className="h-full w-full flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Title bar — styled to match ArtifactCard */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="shrink-0 w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
            {config.icon}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-medium text-gray-900 truncate">{fileName}</h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className="relative"
              onMouseEnter={() =>
                isDriveEnabled && isDriveConnected === false && setShowDrivePopup(true)
              }
              onMouseLeave={() => setShowDrivePopup(false)}
            >
              {isDriveEnabled && isDriveConnected === false ? (
                <>
                  <button
                    disabled={isDriveLoading}
                    onClick={() => onGoogleDriveClick?.()}
                    className={`w-8 h-8 rounded-lg border border-gray-100 flex items-center justify-center transition-colors ${
                      isDriveLoading ? 'cursor-wait' : 'opacity-60 hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    {isDriveLoading ? (
                      <SpinnerGapIcon
                        size={16}
                        weight="bold"
                        className="text-gray-600 animate-spin"
                      />
                    ) : (
                      <img src={driveLogo} alt="Google Drive" width={16} height={16} />
                    )}
                  </button>
                  {showDrivePopup && (
                    <div className="absolute right-0 top-full pt-1.5 z-10">
                      <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 whitespace-nowrap">
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            onGoogleDriveClick?.();
                          }}
                          className="flex items-center gap-1.5 text-sm text-von-purple hover:text-von-purple-dark hover:underline"
                        >
                          <img src={driveLogo} alt="" width={14} height={14} />
                          Connect Google Drive
                          <ArrowSquareOutIcon size={13} weight="bold" />
                        </a>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Tooltip content={driveTooltip ?? 'Open in Drive (Coming soon)'} placement="top">
                  <button
                    disabled={!isDriveEnabled || isDriveLoading}
                    onClick={() => onGoogleDriveClick?.()}
                    className={`w-8 h-8 rounded-lg border border-gray-100 flex items-center justify-center transition-colors ${
                      isDriveLoading
                        ? 'cursor-wait'
                        : !isDriveEnabled
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    {isDriveLoading ? (
                      <SpinnerGapIcon
                        size={16}
                        weight="bold"
                        className="text-gray-600 animate-spin"
                      />
                    ) : (
                      <img src={driveLogo} alt="Google Drive" width={16} height={16} />
                    )}
                  </button>
                </Tooltip>
              )}
            </div>
            {onDownload && (
              <button
                onClick={onDownload}
                className="w-8 h-8 rounded-lg border border-gray-100 text-gray-800 hover:bg-gray-50 transition-colors flex items-center justify-center cursor-pointer"
                title="Download"
              >
                <DownloadSimpleIcon size={16} weight="regular" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-gray-100 text-gray-800 hover:bg-gray-50 transition-colors flex items-center justify-center cursor-pointer"
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

          {content.kind === 'pdf' && <PdfViewer url={content.url} />}

          {content.kind === 'text' && <TextViewer text={content.text} />}

          {content.kind === 'docx' && <DocxViewer buffer={content.buffer} />}

          {content.kind === 'spreadsheet' && (
            <HtmlSpreadsheetViewer sheets={content.sheets} truncated={content.truncated} />
          )}

          {content.kind === 'unsupported' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-gray-50 text-gray-500">
              {config.icon}
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
