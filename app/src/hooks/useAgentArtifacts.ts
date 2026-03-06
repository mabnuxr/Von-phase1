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

        // 1. MongoDB first (existing call, unchanged)
        const response = await fileUploadService.listFiles(
          conversationId,
          1,
          100,
          "agent_generated",
          runId,
        );
        if (response.data.length > 0) return response.data;

        // 2. MongoDB empty → check Redis for in-flight artifacts
        const inflight = await fileUploadService.getInflightArtifacts(
          conversationId,
          runId,
        );
        if (!inflight) return []; // no Redis key → genuinely no artifacts

        // 3. Artifacts in flight → return placeholders
        return inflight.artifacts.map((a) => ({
          id: `pending:${runId}:${a.file_name}`,
          fileName: a.file_name,
          mimeType: "application/octet-stream",
          sizeBytes: 0,
          status: "processing",
          source: "agent_generated",
          createdAt: new Date().toISOString(),
          artifactType: a.artifact_type ?? "document",
          runId,
          isPending: true,
        }));
      },
      enabled: !!conversationId,
      staleTime: Infinity,
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
