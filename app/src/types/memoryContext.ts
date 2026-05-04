/**
 * File attached to a memory context. Mirrors the backend's
 * FileAttachmentSchema 1:1 — same shape on read and write so the FE can
 * round-trip the array without translation.
 */
export interface MemoryAttachment {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  extension: string;
  category: string;
  s3Key: string;
}

/**
 * Memory context entity from backend
 */
export interface MemoryContext {
  id: string;
  accessLevel: "tenant" | "user";
  key: string;
  description: string;
  value: string;
  isDefault: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  /** Files attached to this memory (org memory only). Defaults to []. */
  attachments?: MemoryAttachment[];
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Paginated response for memory contexts
 */
export interface PaginatedMemoryContextsResponse {
  data: MemoryContext[];
  pagination: PaginationMeta;
}

/**
 * Request body for updating a memory context
 */
export interface MemoryContextUpdateRequest {
  key?: string;
  description?: string;
  value?: string;
  /** Replacement set of attachments — commands-style, the server takes
   *  whatever the FE sends as the new state. Each entry was pre-uploaded
   *  via the presign endpoint. Org memory only. */
  attachments?: MemoryAttachment[];
}

/**
 * Request body for creating a memory context
 */
export interface MemoryContextCreateRequest {
  /** Optional client-supplied 24-hex ObjectId. Used by the FE pre-create
   *  attachment-upload flow so files can be uploaded against a known id
   *  before the memory is created. */
  id?: string;
  key: string;
  description: string;
  value?: string;
  accessLevel?: "tenant" | "user";
  isDefault?: boolean;
  /** Files attached at create time — each was pre-uploaded via presign.
   *  Org memory only. */
  attachments?: MemoryAttachment[];
}

/**
 * Character limits for memory context fields
 */
export const MEMORY_CONTEXT_LIMITS = {
  key: 50,
  description: 150,
  value: 50000,
} as const;
