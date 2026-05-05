/**
 * File attached to a memory context — read shape (BE → FE).
 *
 * Carries the fileId + denormalized display snapshot. The storage key
 * (s3Key) is intentionally NOT exposed; clients reference files by
 * fileId and the download endpoint resolves the storage path
 * server-side. This decoupling lets the BE re-partition / shard / swap
 * providers without breaking clients.
 */
export interface MemoryAttachment {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  extension: string;
  category: string;
}

/**
 * Memory attachment as the FE sends it on create/update — fileIds only.
 * The BE looks up each FileMetadata, validates ownership + memory
 * binding, and persists the denormalized snapshot.
 */
export interface MemoryAttachmentInput {
  fileId: string;
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
  /** Replacement set of attachments — fileIds only. The server resolves
   *  each FileMetadata, verifies ownership + memory binding, and stores
   *  the denormalized display snapshot. Org memory only. */
  attachments?: MemoryAttachmentInput[];
}

/**
 * Request body for creating a memory context
 */
export interface MemoryContextCreateRequest {
  /** Optional client-supplied 24-hex ObjectId. Required when
   *  `attachments` is non-empty since presign already bound each file
   *  to this id via FileMetadata.memory_id. */
  id?: string;
  key: string;
  description: string;
  value?: string;
  accessLevel?: "tenant" | "user";
  isDefault?: boolean;
  /** Files attached at create time — fileIds only. Each was
   *  presigned + uploaded + confirmed against the same `id` above.
   *  Org memory only. */
  attachments?: MemoryAttachmentInput[];
}

/**
 * Character limits for memory context fields
 */
export const MEMORY_CONTEXT_LIMITS = {
  key: 50,
  description: 150,
  value: 50000,
} as const;
