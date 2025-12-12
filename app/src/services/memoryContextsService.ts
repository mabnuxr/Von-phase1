import { apiClient } from "./apiClient";
import type {
  MemoryContext,
  PaginatedMemoryContextsResponse,
  MemoryContextUpdateRequest,
} from "../types/memoryContext";

/**
 * Service for managing memory contexts (business insights)
 */
class MemoryContextsService {
  /**
   * Fetch paginated list of memory contexts
   */
  async getMemoryContexts(
    accessLevel: "tenant" | "user" = "tenant",
    page: number = 1,
    limit: number = 5,
  ): Promise<PaginatedMemoryContextsResponse> {
    return apiClient.get<PaginatedMemoryContextsResponse>(
      `/api/v1/memory-contexts?access_level=${accessLevel}&page=${page}&limit=${limit}`,
    );
  }

  /**
   * Update a memory context
   */
  async updateMemoryContext(
    id: string,
    data: MemoryContextUpdateRequest,
  ): Promise<MemoryContext> {
    return apiClient.patch<MemoryContext>(
      `/api/v1/memory-contexts/${id}`,
      data,
    );
  }

  /**
   * Delete a memory context (soft delete)
   */
  async deleteMemoryContext(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/memory-contexts/${id}`);
  }
}

// Singleton instance
export const memoryContextsService = new MemoryContextsService();
