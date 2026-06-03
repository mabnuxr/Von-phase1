import { Fragment, useMemo } from 'react';
import { FileArtifactCard, type FileArtifact } from './ArtifactCards';

/** Normalize artifactType — `.eml` files predate the artifactType field and still flow through. */
function effectiveArtifactType(artifact: FileArtifact): string {
  if (artifact.artifactType === 'email_draft') return 'email_draft';
  if (artifact.fileName?.endsWith('.eml')) return 'email_draft';
  return artifact.artifactType;
}

export type GroupedArtifactRenderer = (artifacts: FileArtifact[]) => React.ReactNode | null;

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
  isDriveConnected?: boolean;
  driveTooltip?: string;
  driveLoadingFileId?: string | null;
  onBoxClick?: (fileId: string) => void;
  isBoxConnected?: boolean;
  boxTooltip?: string;
  boxLoadingFileId?: string | null;
  renderArtifactCard?: (artifact: FileArtifact) => React.ReactNode | null;
  /**
   * Per-artifact-type grouped renderers. Each key is an artifactType (e.g.
   * `"email_draft"`, `"slack_message_draft"`); artifacts of that type are
   * collected and passed to the matching renderer as a single batch (e.g.
   * EmailComposer with tabs, SlackMessageComposer with tabs). Artifact types
   * absent from the map fall through to per-card rendering via
   * `renderArtifactCard` / `FileArtifactCard`.
   */
  groupedArtifactRenderers?: Record<string, GroupedArtifactRenderer>;
}

export const FileArtifactsSection: React.FC<FileArtifactsSectionProps> = ({
  artifacts,
  onFileArtifactClick,
  onArtifactDownload,
  onGoogleDriveClick,
  isDriveConnected,
  driveTooltip,
  driveLoadingFileId,
  onBoxClick,
  isBoxConnected,
  boxTooltip,
  boxLoadingFileId,
  renderArtifactCard,
  groupedArtifactRenderers,
}) => {
  const { groups, otherArtifacts } = useMemo(() => {
    if (!groupedArtifactRenderers) {
      return {
        groups: new Map<string, FileArtifact[]>(),
        otherArtifacts: artifacts,
      };
    }
    const grouped = new Map<string, FileArtifact[]>();
    const other: FileArtifact[] = [];
    for (const a of artifacts) {
      const type = effectiveArtifactType(a);
      if (groupedArtifactRenderers[type]) {
        const bucket = grouped.get(type);
        if (bucket) bucket.push(a);
        else grouped.set(type, [a]);
      } else {
        other.push(a);
      }
    }
    return { groups: grouped, otherArtifacts: other };
  }, [artifacts, groupedArtifactRenderers]);

  return (
    <div className="mt-3 space-y-3">
      {/* Per-artifact-type grouped renderers (EmailComposer, SlackMessageComposer, …) */}
      {Array.from(groups.entries()).map(([type, group]) => (
        <Fragment key={`group-${type}`}>{groupedArtifactRenderers?.[type]?.(group)}</Fragment>
      ))}

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
            isDriveConnected={isDriveConnected}
            driveTooltip={driveTooltip}
            isDriveLoading={driveLoadingFileId === artifact.fileId}
            onBoxClick={onBoxClick ? () => onBoxClick(artifact.fileId) : undefined}
            isBoxConnected={isBoxConnected}
            boxTooltip={boxTooltip}
            isBoxLoading={boxLoadingFileId === artifact.fileId}
          />
        );
      })}
    </div>
  );
};
