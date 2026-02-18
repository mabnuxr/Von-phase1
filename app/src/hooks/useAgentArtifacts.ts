/**
 * useAgentArtifacts - React Query hook for agent-generated file artifacts
 *
 * Fetches FileMetadata per runId using parallel queries (useQueries).
 * Each assistant message's runId gets its own cached query. Artifacts are
 * immutable once created, so staleTime is Infinity — only Pusher events
 * (via useArtifactCreatedEvent) trigger refetches for specific runs.
 */

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  fileUploadService,
  type FileMetadataResponse,
} from "../services/fileUploadService";

/** Query key factory for agent artifact queries */
export const agentArtifactKeys = {
  all: ["agent-artifacts"] as const,
  run: (conversationId: string, runId: string) =>
    ["agent-artifacts", conversationId, runId] as const,
};

/**
 * Fetches agent-generated artifacts per run, returning a Map<runId, artifacts[]>.
 *
 * @param conversationId - The conversation these runs belong to
 * @param runIds - Unique runIds extracted from assistant messages
 */
export function useAgentArtifacts(
  conversationId: string | null,
  runIds: string[],
) {
  const queries = useQueries({
    queries: runIds.map((runId) => ({
      queryKey: agentArtifactKeys.run(conversationId ?? "", runId),
      queryFn: async () => {
        if (!conversationId) return [];
        const response = await fileUploadService.listFiles(
          conversationId,
          1,
          100,
          "agent_generated",
          runId,
        );
        return response.data;
      },
      enabled: !!conversationId,
      staleTime: Infinity,
    })),
  });

  // Combine per-run query results into a single Map<runId, FileMetadataResponse[]>
  const agentArtifactsByRunId = useMemo(() => {
    const map = new Map<string, FileMetadataResponse[]>();
    for (let i = 0; i < runIds.length; i++) {
      const result = queries[i];
      if (result?.data && result.data.length > 0) {
        map.set(runIds[i], result.data);
      }
    }
    return map;
  }, [runIds, queries]);

  return agentArtifactsByRunId;
}
