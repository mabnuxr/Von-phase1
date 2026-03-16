export type ArtifactType = 'document' | 'slides' | 'spreadsheet' | 'dashboard';

export interface FileArtifact {
  fileId: string;
  fileName: string;
  artifactType: string;
  mimeType: string;
  isPending?: boolean;
  pdfPreview?: { id: string; fileName: string };
}
