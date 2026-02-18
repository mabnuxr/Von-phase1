/**
 * ArtifactCard - Renders an agent-generated file artifact inline in chat
 *
 * Extracted from Jan17Demo/ChatViewV2.tsx and adapted for S3-backed artifacts.
 * Shows icon by type, file name, Google Drive / download / open buttons.
 */

import React from 'react';
import {
  DownloadSimple as DownloadSimpleIcon,
  FileDoc as FileDocIcon,
  PresentationChart as PresentationChartIcon,
  Table as TableIcon,
  ArrowsOut as ArrowsOutIcon,
} from '@phosphor-icons/react';
import driveLogo from '../../assets/drive-logo.svg';

// ============================================================================
// Types
// ============================================================================

export type ArtifactType = 'document' | 'slides' | 'spreadsheet';

export interface FileArtifact {
  fileId: string;
  fileName: string;
  artifactType: string;
  mimeType: string;
}

export interface ArtifactCardProps {
  artifact: FileArtifact;
  onOpen?: () => void;
  onDownload?: () => void;
  onGoogleDriveClick?: () => void;
}

// ============================================================================
// Config
// ============================================================================

const ARTIFACT_ICON_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
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

export const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact, onOpen, onDownload }) => {
  const config = ARTIFACT_ICON_CONFIG[artifact.artifactType] ?? DEFAULT_CONFIG;

  return (
    <div className="border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-gray-300 transition-colors">
      {/* Icon */}
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
        {config.icon}
      </div>

      {/* Title + Type label */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">{artifact.fileName}</h4>
        <p className="text-xs text-gray-500 truncate mt-0.5">{config.label}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          disabled
          className="w-8 h-8 rounded-lg border border-gray-100 flex items-center justify-center opacity-40 cursor-not-allowed transition-colors"
          title="Google Drive sync coming soon"
        >
          <img src={driveLogo} alt="Google Drive" width={16} height={16} />
        </button>
        {onDownload && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="w-8 h-8 rounded-lg border border-gray-100 text-gray-800 hover:bg-gray-50 transition-colors flex items-center justify-center cursor-pointer"
            title="Download"
          >
            <DownloadSimpleIcon size={16} weight="regular" />
          </button>
        )}
        {onOpen && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="w-8 h-8 rounded-lg border border-gray-100 text-gray-800 hover:bg-gray-50 transition-colors flex items-center justify-center cursor-pointer"
            title="Open preview"
          >
            <ArrowsOutIcon size={16} weight="regular" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ArtifactCard;
