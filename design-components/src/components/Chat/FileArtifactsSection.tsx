import { Fragment } from 'react';
import { FileArtifactCard, type FileArtifact } from './ArtifactCards';

interface FileArtifactsSectionProps {
  artifacts: FileArtifact[];
  onFileArtifactClick?: (
    fileId: string,
    fileName: string,
    artifactType: string,
    mimeType: string,
    pdfPreviewFileId?: string
  ) => void;
  onArtifactDownload?: (fileId: string) => void;
  onGoogleDriveClick?: (fileId: string) => void;
  isDriveEnabled?: boolean;
  isDriveConnected?: boolean;
  driveTooltip?: string;
  driveLoadingFileId?: string | null;
  renderArtifactCard?: (artifact: FileArtifact) => React.ReactNode | null;
}

export const FileArtifactsSection: React.FC<FileArtifactsSectionProps> = ({
  artifacts,
  onFileArtifactClick,
  onArtifactDownload,
  onGoogleDriveClick,
  isDriveEnabled,
  isDriveConnected,
  driveTooltip,
  driveLoadingFileId,
  renderArtifactCard,
}) => {
  return (
    <div className="mt-3 space-y-3">
      {artifacts.map((artifact) => {
        // Allow app layer to override rendering for specific artifact types (e.g. email_draft)
        if (renderArtifactCard) {
          const custom = renderArtifactCard(artifact);
          if (custom) return <Fragment key={artifact.fileId}>{custom}</Fragment>;
        }

        const handleOpen = onFileArtifactClick
          ? () =>
              onFileArtifactClick(
                artifact.fileId,
                artifact.fileName,
                artifact.artifactType,
                artifact.mimeType,
                artifact.pdfPreview?.id
              )
          : undefined;

        return (
          <FileArtifactCard
            key={artifact.fileId}
            artifact={artifact}
            onClick={handleOpen}
            onOpen={handleOpen}
            onDownload={onArtifactDownload ? () => onArtifactDownload(artifact.fileId) : undefined}
            onGoogleDriveClick={
              onGoogleDriveClick ? () => onGoogleDriveClick(artifact.fileId) : undefined
            }
            isDriveEnabled={isDriveEnabled}
            isDriveConnected={isDriveConnected}
            driveTooltip={driveTooltip}
            isDriveLoading={driveLoadingFileId === artifact.fileId}
          />
        );
      })}
    </div>
  );
};
