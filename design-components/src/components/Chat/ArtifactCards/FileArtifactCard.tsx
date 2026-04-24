/**
 * FileArtifactCard — pre-composed card for file artifacts (document / slides / spreadsheet).
 *
 * Renders a unified storage-export dropdown, download, preview, and open actions.
 */

import React from 'react';
import {
  DownloadSimpleIcon,
  FileDocIcon,
  PresentationChartIcon,
  TableIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react';
import { BaseArtifactCard, ActionButton } from './BaseArtifactCard';
import { StorageExportButton, buildStorageServices } from '../StorageExportButton';
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
  onClick?: () => void;
  onOpen?: () => void;
  onDownload?: () => void;
  onGoogleDriveClick?: () => void;
  isDriveEnabled?: boolean;
  isDriveConnected?: boolean;
  driveTooltip?: string;
  isDriveLoading?: boolean;
  onBoxClick?: () => void;
  isBoxEnabled?: boolean;
  isBoxConnected?: boolean;
  boxTooltip?: string;
  isBoxLoading?: boolean;
}

export const FileArtifactCard: React.FC<FileArtifactCardProps> = ({
  artifact,
  onClick,
  onOpen,
  onDownload,
  onGoogleDriveClick,
  isDriveEnabled,
  isDriveConnected,
  isDriveLoading,
  onBoxClick,
  isBoxEnabled,
  isBoxConnected,
  isBoxLoading,
}) => {
  const config = FILE_ICON_CONFIG[artifact.artifactType] ?? DEFAULT_FILE_CONFIG;

  const storageServices = buildStorageServices({
    onGoogleDriveClick,
    isDriveEnabled,
    isDriveConnected,
    isDriveLoading,
    onBoxClick,
    isBoxEnabled,
    isBoxConnected,
    isBoxLoading,
  });

  return (
    <BaseArtifactCard
      title={artifact.fileName}
      description={config.label}
      isPending={artifact.isPending}
      onClick={onClick}
    >
      <BaseArtifactCard.Icon>{config.icon}</BaseArtifactCard.Icon>

      <BaseArtifactCard.Actions>
        {/* Storage export dropdown (Drive / Box) — only shows connected services */}
        <StorageExportButton services={storageServices} stopPropagation />

        {/* Download */}
        {onDownload && (
          <ActionButton onClick={onDownload} title="Download">
            <DownloadSimpleIcon size={16} weight="regular" />
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
