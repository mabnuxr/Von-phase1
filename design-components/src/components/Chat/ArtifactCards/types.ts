export type ArtifactType = 'document' | 'slides' | 'spreadsheet' | 'dashboard' | 'email_draft';

export interface EmailDraftArtifact {
  draftId: string;
  to: string;
  subject: string;
  /** First ~500 chars — shown by default */
  bodyPreview: string;
  /** Full body — revealed on "Show More" */
  bodyFull: string;
  cc?: string[];
  bcc?: string[];
  /** e.g. "Opportunity: Acme Q2 | Stage: Proposal | Amount: $120k" */
  crmContext?: string;
  gmailUrl: string;
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
