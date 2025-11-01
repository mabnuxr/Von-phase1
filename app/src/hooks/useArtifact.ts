import { useQuery } from "@tanstack/react-query";
import {
  conversationsService,
  type ArtifactResponse,
} from "../services/conversationsService";
import {
  ARTIFACT_STALE_TIME,
  ARTIFACT_GC_TIME,
  ARTIFACT_RETRY_COUNT,
  ARTIFACT_MAX_RETRY_DELAY,
} from "../config/constants";

/**
 * Hook for fetching artifact (tool call result) content
 *
 * Artifacts are large tool results stored separately from messages
 * to avoid Pusher message size limits. This hook provides lazy loading
 * with React Query caching and retry logic.
 *
 * @param conversationId - ID of the conversation
 * @param messageId - ID of the message containing the tool call
 * @param artifactId - ID of the artifact to fetch (null to disable query)
 * @returns React Query result with artifact data
 *
 * @example
 * ```tsx
 * const { data: artifact, isLoading, error } = useArtifact(
 *   conversationId,
 *   messageId,
 *   toolCall.artifact?.artifact_id
 * );
 * ```
 */
export function useArtifact(
  conversationId: string | null,
  messageId: string | null,
  artifactId: string | null,
) {
  return useQuery({
    queryKey: ["artifact", conversationId, messageId, artifactId],
    queryFn: async () => {
      if (!conversationId || !messageId || !artifactId) {
        throw new Error("Missing required parameters for artifact fetch");
      }
      return conversationsService.getArtifact(
        conversationId,
        messageId,
        artifactId,
      );
    },
    enabled: !!(conversationId && messageId && artifactId),
    staleTime: ARTIFACT_STALE_TIME,
    gcTime: ARTIFACT_GC_TIME,
    retry: ARTIFACT_RETRY_COUNT,
    retryDelay: (attemptIndex) =>
      Math.min(1000 * 2 ** attemptIndex, ARTIFACT_MAX_RETRY_DELAY),
  });
}

/**
 * Type re-export for convenience
 */
export type { ArtifactResponse };
