export type ArtifactType = 'document' | 'slides' | 'spreadsheet' | 'dashboard' | 'email_draft';

export interface EmailDraftArtifact {
  draftId: string;
  subject: string;
  body: string;
  to?: string;
  gmailUrl?: string;
  isPending?: boolean;
}

export interface FileArtifact {
  fileId: string;
  fileName: string;
  artifactType: string;
  mimeType: string;
  isPending?: boolean;
  pdfPreview?: { id: string; fileName: string };
}
