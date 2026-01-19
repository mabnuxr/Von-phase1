import { useQuery, useQueries } from "@tanstack/react-query";
import {
  conversationsService,
  type MessageArtifactsResponse,
  type ArtifactResponse,
} from "../services/conversationsService";
import {
  ARTIFACT_STALE_TIME,
  ARTIFACT_GC_TIME,
  ARTIFACT_RETRY_COUNT,
  ARTIFACT_MAX_RETRY_DELAY,
} from "../config/constants";

/**
 * Hook for fetching the list of artifacts for a message/run
 *
 * Used for the transparency drawer to show all data sources
 * for a specific assistant response.
 *
 * @param conversationId - ID of the conversation
 * @param runId - Run ID of the message (null to disable query)
 * @returns React Query result with artifacts list
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useMessageArtifacts(
 *   conversationId,
 *   message.runId
 * );
 * ```
 */
export function useMessageArtifacts(
  conversationId: string | null,
  runId: string | null,
) {
  return useQuery({
    queryKey: ["message-artifacts", conversationId, runId],
    queryFn: async () => {
      if (!conversationId || !runId) {
        throw new Error("Missing required parameters for artifacts fetch");
      }
      return conversationsService.getMessageArtifacts(conversationId, runId);
    },
    enabled: !!(conversationId && runId),
    staleTime: ARTIFACT_STALE_TIME,
    gcTime: ARTIFACT_GC_TIME,
    retry: ARTIFACT_RETRY_COUNT,
    retryDelay: (attemptIndex) =>
      Math.min(1000 * 2 ** attemptIndex, ARTIFACT_MAX_RETRY_DELAY),
  });
}

/**
 * Hook for fetching full content of multiple artifacts
 *
 * Fetches all artifacts in parallel for the transparency drawer.
 * Uses React Query's useQueries for parallel data fetching.
 *
 * @param conversationId - ID of the conversation
 * @param runId - Run ID of the message
 * @param artifactIds - Array of artifact IDs to fetch
 * @returns Array of React Query results with artifact content
 *
 * @example
 * ```tsx
 * const results = useArtifactContents(
 *   conversationId,
 *   runId,
 *   artifacts.map(a => a.artifact_id)
 * );
 * ```
 */
export function useArtifactContents(
  conversationId: string | null,
  runId: string | null,
  artifactIds: string[],
) {
  return useQueries({
    queries: artifactIds.map((artifactId) => ({
      queryKey: ["artifact-content", conversationId, runId, artifactId],
      queryFn: async () => {
        if (!conversationId || !runId || !artifactId) {
          throw new Error("Missing required parameters for artifact fetch");
        }
        return conversationsService.getArtifactByRunId(
          conversationId,
          runId,
          artifactId,
        );
      },
      enabled: !!(conversationId && runId && artifactId),
      staleTime: ARTIFACT_STALE_TIME,
      gcTime: ARTIFACT_GC_TIME,
      retry: ARTIFACT_RETRY_COUNT,
      retryDelay: (attemptIndex: number) =>
        Math.min(1000 * 2 ** attemptIndex, ARTIFACT_MAX_RETRY_DELAY),
    })),
  });
}

/**
 * Combined hook that fetches artifact list and then all their contents
 *
 * This is the main hook for the transparency drawer integration.
 * It first fetches the list of artifacts, then fetches all their
 * full content in parallel.
 *
 * @param conversationId - ID of the conversation
 * @param runId - Run ID of the message (null to disable)
 * @returns Combined result with list and contents
 */
export function useTransparencyArtifacts(
  conversationId: string | null,
  runId: string | null,
) {
  // First fetch the list of artifacts
  const listQuery = useMessageArtifacts(conversationId, runId);

  // Extract artifact IDs from the list
  const artifactIds = listQuery.data?.artifacts.map((a) => a.artifact_id) ?? [];

  // Fetch all artifact contents in parallel
  const contentQueries = useArtifactContents(
    conversationId,
    runId,
    artifactIds,
  );

  // Combine the results
  const isLoading =
    listQuery.isLoading || contentQueries.some((q) => q.isLoading);
  const isError = listQuery.isError || contentQueries.some((q) => q.isError);
  const error =
    listQuery.error || contentQueries.find((q) => q.error)?.error || null;

  // Build the artifacts with content
  const artifactsWithContent: ArtifactResponse[] = [];
  if (listQuery.data?.artifacts) {
    listQuery.data.artifacts.forEach((_artifact, index) => {
      const contentQuery = contentQueries[index];
      if (contentQuery?.data) {
        artifactsWithContent.push(contentQuery.data);
      }
    });
  }

  return {
    // List metadata
    conversationId: listQuery.data?.conversation_id,
    runId: listQuery.data?.run_id,
    totalCount: listQuery.data?.total_count ?? 0,
    // Artifact summaries (without content)
    artifactSummaries: listQuery.data?.artifacts ?? [],
    // Full artifacts with content
    artifacts: artifactsWithContent,
    // Loading states
    isLoading,
    isListLoading: listQuery.isLoading,
    isContentLoading: contentQueries.some((q) => q.isLoading),
    // Error states
    isError,
    error,
    // Refetch function
    refetch: listQuery.refetch,
  };
}

/**
 * Hook for fetching a single artifact's content on demand
 *
 * Used for lazy loading artifact content when the user clicks on
 * a specific artifact in the transparency drawer.
 *
 * @param conversationId - ID of the conversation
 * @param runId - Run ID of the message
 * @param artifactId - ID of the artifact to fetch (null to disable)
 * @returns React Query result with artifact content
 */
export function useLazyArtifactContent(
  conversationId: string | null,
  runId: string | null,
  artifactId: string | null,
) {
  return useQuery({
    queryKey: ["artifact-content", conversationId, runId, artifactId],
    queryFn: async () => {
      if (!conversationId || !runId || !artifactId) {
        throw new Error("Missing required parameters for artifact fetch");
      }
      return conversationsService.getArtifactByRunId(
        conversationId,
        runId,
        artifactId,
      );
    },
    enabled: !!(conversationId && runId && artifactId),
    staleTime: ARTIFACT_STALE_TIME,
    gcTime: ARTIFACT_GC_TIME,
    retry: ARTIFACT_RETRY_COUNT,
    retryDelay: (attemptIndex) =>
      Math.min(1000 * 2 ** attemptIndex, ARTIFACT_MAX_RETRY_DELAY),
  });
}

/**
 * Hook for lazy loading artifacts - only fetches list initially,
 * then content is fetched on demand when user clicks on an artifact
 *
 * @param conversationId - ID of the conversation
 * @param runId - Run ID of the message (null to disable)
 * @returns Result with artifact summaries and function to fetch content
 */
export function useLazyTransparencyArtifacts(
  conversationId: string | null,
  runId: string | null,
) {
  // Only fetch the list of artifacts initially
  const listQuery = useMessageArtifacts(conversationId, runId);

  return {
    // List metadata
    conversationId: listQuery.data?.conversation_id ?? conversationId,
    runId: listQuery.data?.run_id ?? runId,
    totalCount: listQuery.data?.total_count ?? 0,
    // Artifact summaries (without content)
    artifactSummaries: listQuery.data?.artifacts ?? [],
    // Loading states
    isLoading: listQuery.isLoading,
    isListLoading: listQuery.isLoading,
    // Error states
    isError: listQuery.isError,
    error: listQuery.error,
    // Refetch function
    refetch: listQuery.refetch,
  };
}

/**
 * Type re-exports for convenience
 */
export type { MessageArtifactsResponse, ArtifactResponse };
