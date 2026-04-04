import { Fragment, useMemo } from 'react';
import { FileArtifactCard, type FileArtifact } from './ArtifactCards';

function isEmailArtifact(artifact: FileArtifact): boolean {
  return artifact.artifactType === 'email_draft' || (artifact.fileName?.endsWith('.eml') ?? false);
}

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
  /** Render all email_draft artifacts as a single grouped component (e.g. EmailComposer with tabs) */
  renderGroupedEmailArtifacts?: (artifacts: FileArtifact[]) => React.ReactNode | null;
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
  renderGroupedEmailArtifacts,
}) => {
  const { emailArtifacts, otherArtifacts } = useMemo(() => {
    if (!renderGroupedEmailArtifacts) return { emailArtifacts: [], otherArtifacts: artifacts };
    const email: FileArtifact[] = [];
    const other: FileArtifact[] = [];
    for (const a of artifacts) {
      if (isEmailArtifact(a)) email.push(a);
      else other.push(a);
    }
    return { emailArtifacts: email, otherArtifacts: other };
  }, [artifacts, renderGroupedEmailArtifacts]);

  return (
    <div className="mt-3 space-y-3">
      {/* Render grouped email artifacts as a single component */}
      {emailArtifacts.length > 0 && renderGroupedEmailArtifacts?.(emailArtifacts)}

      {otherArtifacts.map((artifact) => {
        // Allow app layer to override rendering for specific artifact types
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
