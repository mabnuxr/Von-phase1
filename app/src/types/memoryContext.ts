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
}

/**
 * Request body for creating a memory context
 */
export interface MemoryContextCreateRequest {
  key: string;
  description: string;
  value?: string;
  accessLevel?: "tenant" | "user";
  isDefault?: boolean;
}

/**
 * Character limits for memory context fields
 */
export const MEMORY_CONTEXT_LIMITS = {
  key: 50,
  description: 150,
  value: 50000,
} as const;
