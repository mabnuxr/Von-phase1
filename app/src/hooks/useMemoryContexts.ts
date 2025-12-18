import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { memoryContextsService } from "../services";
import type {
  MemoryContextUpdateRequest,
  MemoryContextCreateRequest,
} from "../types/memoryContext";

/**
 * Query keys for memory contexts
 */
export const memoryContextKeys = {
  all: ["memoryContexts"] as const,
  list: (accessLevel: "tenant" | "user", page: number) =>
    [...memoryContextKeys.all, accessLevel, page] as const,
  infinite: (accessLevel: "tenant" | "user") =>
    [...memoryContextKeys.all, "infinite", accessLevel] as const,
};

/**
 * Fetch paginated memory contexts
 *
 * Uses standard pagination (not infinite scroll) with explicit page control
 */
export function useMemoryContexts(
  accessLevel: "tenant" | "user" = "tenant",
  page: number = 1,
  limit: number = 5,
) {
  return useQuery({
    queryKey: memoryContextKeys.list(accessLevel, page),
    queryFn: () =>
      memoryContextsService.getMemoryContexts(accessLevel, page, limit),
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: true,
  });
}

/**
 * Fetch memory contexts with infinite scroll
 */
export function useInfiniteMemoryContexts(
  accessLevel: "tenant" | "user" = "tenant",
  limit: number = 5,
) {
  return useInfiniteQuery({
    queryKey: memoryContextKeys.infinite(accessLevel),
    queryFn: ({ pageParam = 1 }) =>
      memoryContextsService.getMemoryContexts(accessLevel, pageParam, limit),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.page + 1
        : undefined,
    initialPageParam: 1,
    staleTime: 60000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Update a memory context
 */
export function useUpdateMemoryContext() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: MemoryContextUpdateRequest;
    }) => memoryContextsService.updateMemoryContext(id, data),
    onSuccess: async () => {
      // Reset infinite queries to refetch from the beginning
      await queryClient.resetQueries({
        queryKey: memoryContextKeys.all,
      });
    },
  });
}

/**
 * Delete a memory context
 */
export function useDeleteMemoryContext() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => memoryContextsService.deleteMemoryContext(id),
    onSuccess: async () => {
      // Reset infinite queries to refetch from the beginning
      await queryClient.resetQueries({
        queryKey: memoryContextKeys.all,
      });
    },
  });
}

/**
 * Create a new memory context
 */
export function useCreateMemoryContext() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MemoryContextCreateRequest) =>
      memoryContextsService.createMemoryContext(data),
    onSuccess: async () => {
      // Reset infinite queries to refetch from the beginning
      await queryClient.resetQueries({
        queryKey: memoryContextKeys.all,
      });
    },
  });
}
