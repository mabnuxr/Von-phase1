/**
 * Canonical artifact_type taxonomy — single source of truth, kept in sync
 * with the backend.
 *
 * Backend sources of truth:
 *   - File artifacts: agents-v2/workflows/activities/artifact_upload.py
 *     (ARTIFACT_TYPE_MAP)
 *   - Tool-result artifacts: agents-v2/utils/streaming/artifact_storage/
 *     storage.py (ArtifactStorage.detect_artifact_type)
 *
 * Whenever the backend adds a new artifact_type, add a member here. Do NOT
 * fall back to `string` or `T | string` at call sites — renderers and
 * dispatchers should pattern-match on this union so TS catches missing
 * branches.
 *
 * Usage:
 *   import { ArtifactType } from '...';
 *   if (artifactType === ArtifactType.Image) { ... }
 *   const a: ArtifactType = ArtifactType.Document;
 *
 * Follows the project's const-object pattern (see MentionItemType in
 * components/Mentions/constants.ts) — gives enum-like ergonomics without
 * TS `enum` runtime overhead and tree-shakes correctly.
 */
export const ArtifactType = {
  // Tool-result artifacts (Pipeline 1, MongoDB-backed)
  Table: 'table',
  Json: 'json',
  Text: 'text',
  Values: 'values',
  Metrics: 'metrics',
  Schema: 'schema',
  Query: 'query',
  Statistics: 'statistics',
  TableList: 'table_list',
  Memory: 'memory',
  CallSearchUnion: 'call_search_union',
  FetchConversation: 'fetch_conversation',
  // File artifacts (Pipeline 2, S3-backed)
  Document: 'document',
  Slides: 'slides',
  Spreadsheet: 'spreadsheet',
  SlidePreviewPdf: 'slide_preview_pdf',
  Dashboard: 'dashboard',
  EmailDraft: 'email_draft',
  SlackMessageDraft: 'slack_message_draft',
  Image: 'image',
  Web: 'web',
  Data: 'data',
  Archive: 'archive',
  Notebook: 'notebook',
  AiField: 'ai_field',
} as const;

export type ArtifactType = (typeof ArtifactType)[keyof typeof ArtifactType];

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
  gmailUrl: string;
  isPending?: boolean;
}

export interface FileArtifact {
  fileId: string;
  fileName: string;
  artifactType: ArtifactType;
  mimeType: string;
  isPending?: boolean;
  pdfPreview?: { id: string; fileName: string };
  sendState?: { sent_at: string; result: Record<string, unknown> } | null;
}
