/**
 * useAgentArtifacts - React Query hook for agent-generated file artifacts
 *
 * Fetches FileMetadata per runId using parallel queries (useQueries).
 * Each assistant message's runId gets its own cached query.
 *
 * Backend pipeline guarantees that by the time RUN_FINISHED fires, every
 * artifact this turn produced has a FileMetadata row in `processing` (or
 * `completed`). The list endpoint returns those rows directly — no Redis
 * fallback needed. Skeletons are rendered for `processing` rows and
 * refetchInterval polls until they flip to `completed`. Pusher
 * `artifact_created(completed)` events provide a low-latency override.
 */

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  ARTIFACT_INFLIGHT_MAX_POLLS,
  ARTIFACT_INFLIGHT_POLL_INTERVAL_MS,
} from "../config/constants";
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
      queryFn: async (): Promise<FileMetadataResponse[]> => {
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
      // staleTime is short rather than Infinity because rows transition
      // processing → completed asynchronously; refetches must be allowed.
      staleTime: 0,
      refetchInterval: (query: {
        state: { data?: FileMetadataResponse[]; dataUpdateCount: number };
      }) => {
        const data = query.state.data;
        if (!data || data.length === 0) return false;
        if (query.state.dataUpdateCount >= ARTIFACT_INFLIGHT_MAX_POLLS)
          return false;
        if (data.some((a) => a.status !== "completed"))
          return ARTIFACT_INFLIGHT_POLL_INTERVAL_MS;
        return false;
      },
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
