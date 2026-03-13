/**
 * FileArtifactCard — pre-composed card for file artifacts (document / slides / spreadsheet).
 *
 * Renders Google Drive, download, preview, and open actions.
 */

import React, { useState } from 'react';
import {
  DownloadSimpleIcon,
  FileDocIcon,
  PresentationChartIcon,
  TableIcon,
  ArrowRightIcon,
  ArrowsOutIcon,
  SpinnerGapIcon,
  ArrowSquareOutIcon,
} from '@phosphor-icons/react';
import { Tooltip } from '../../Tooltip';
import driveLogo from '../../../assets/drive-logo.svg';
import { BaseArtifactCard, ActionButton } from './BaseArtifactCard';
import type { FileArtifact } from './types';

// ============================================================================
// Icon config per file type
// ============================================================================

const FILE_ICON_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
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

const DEFAULT_FILE_CONFIG = {
  icon: <FileDocIcon size={20} weight="regular" className="text-gray-500" />,
  label: 'File',
};

// ============================================================================
// Component
// ============================================================================

export interface FileArtifactCardProps {
  artifact: FileArtifact;
  onOpen?: () => void;
  onPreview?: () => void;
  onDownload?: () => void;
  onGoogleDriveClick?: () => void;
  isDriveEnabled?: boolean;
  isDriveConnected?: boolean;
  driveTooltip?: string;
  isDriveLoading?: boolean;
}

export const FileArtifactCard: React.FC<FileArtifactCardProps> = ({
  artifact,
  onOpen,
  onPreview,
  onDownload,
  onGoogleDriveClick,
  isDriveEnabled,
  isDriveConnected,
  driveTooltip,
  isDriveLoading,
}) => {
  const config = FILE_ICON_CONFIG[artifact.artifactType] ?? DEFAULT_FILE_CONFIG;
  const [showDrivePopup, setShowDrivePopup] = useState(false);

  return (
    <BaseArtifactCard
      title={artifact.fileName}
      description={config.label}
      isPending={artifact.isPending}
    >
      <BaseArtifactCard.Icon>{config.icon}</BaseArtifactCard.Icon>

      <BaseArtifactCard.Actions>
        {/* Google Drive */}
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
                onClick={(e) => {
                  e.stopPropagation();
                  onGoogleDriveClick?.();
                }}
                className={`w-8 h-8 rounded-lg border border-gray-100 flex items-center justify-center transition-colors ${
                  isDriveLoading ? 'cursor-wait' : 'opacity-60 hover:bg-gray-50 cursor-pointer'
                }`}
              >
                {isDriveLoading ? (
                  <SpinnerGapIcon size={16} weight="bold" className="text-gray-600 animate-spin" />
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
                        e.stopPropagation();
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
                onClick={(e) => {
                  e.stopPropagation();
                  onGoogleDriveClick?.();
                }}
                className={`w-8 h-8 rounded-lg border border-gray-100 flex items-center justify-center transition-colors ${
                  isDriveLoading
                    ? 'cursor-wait'
                    : !isDriveEnabled
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-gray-50 cursor-pointer'
                }`}
              >
                {isDriveLoading ? (
                  <SpinnerGapIcon size={16} weight="bold" className="text-gray-600 animate-spin" />
                ) : (
                  <img src={driveLogo} alt="Google Drive" width={16} height={16} />
                )}
              </button>
            </Tooltip>
          )}
        </div>

        {/* Download */}
        {onDownload && (
          <ActionButton onClick={onDownload} title="Download">
            <DownloadSimpleIcon size={16} weight="regular" />
          </ActionButton>
        )}

        {/* Preview (expand) */}
        {onPreview && (
          <ActionButton onClick={onPreview} title="Preview full screen">
            <ArrowsOutIcon size={16} weight="regular" />
          </ActionButton>
        )}

        {/* Open (arrow right) */}
        {onOpen && (
          <ActionButton onClick={onOpen} title="Open">
            <ArrowRightIcon size={16} weight="regular" />
          </ActionButton>
        )}
      </BaseArtifactCard.Actions>
    </BaseArtifactCard>
  );
};
