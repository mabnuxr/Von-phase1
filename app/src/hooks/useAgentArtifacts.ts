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
import { recordArtifactDelivered } from "../lib/realtimeFileDeliveryObservability";

/** Query key factory. `forConversation` is a prefix matching every
 *  per-run query — pass to `invalidateQueries` to refresh all runs at once. */
export const agentArtifactKeys = {
  all: ["agent-artifacts"] as const,
  forConversation: (conversationId: string) =>
    ["agent-artifacts", conversationId] as const,
  run: (conversationId: string, runId: string) =>
    ["agent-artifacts", conversationId, runId] as const,
};

/** `isTerminal` mirrors the parent message status; when false, polling
 *  continues on empty data so a too-early initial fetch can't disarm us. */
export interface AgentArtifactTurn {
  runId: string;
  isTerminal: boolean;
}

/**
 * Fetches agent-generated artifacts per run, returning a Map<runId, artifacts[]>.
 *
 * @param conversationId - The conversation these runs belong to
 * @param turns - Per-turn { runId, isTerminal } extracted from assistant messages
 */
export function useAgentArtifacts(
  conversationId: string | null,
  turns: AgentArtifactTurn[],
) {
  const queries = useQueries({
    queries: turns.map((turn) => ({
      queryKey: agentArtifactKeys.run(conversationId ?? "", turn.runId),
      queryFn: async (): Promise<FileMetadataResponse[]> => {
        if (!conversationId) return [];
        const response = await fileUploadService.listFiles(
          conversationId,
          1,
          100,
          "agent_generated",
          turn.runId,
        );
        recordArtifactDelivered(
          conversationId,
          turn.runId,
          response.data,
          "api",
        );
        return response.data;
      },
      enabled: !!conversationId,
      staleTime: 0,
      // Tab-refocus recovery for missed RUN_FINISHED.
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchInterval: (query: {
        state: { data?: FileMetadataResponse[]; dataUpdateCount: number };
      }) => {
        if (query.state.dataUpdateCount >= ARTIFACT_INFLIGHT_MAX_POLLS)
          return false;
        const data = query.state.data;
        if (!data || data.length === 0) {
          return turn.isTerminal ? false : ARTIFACT_INFLIGHT_POLL_INTERVAL_MS;
        }
        if (data.some((a) => a.status !== "completed"))
          return ARTIFACT_INFLIGHT_POLL_INTERVAL_MS;
        return false;
      },
    })),
  });

  // Combine per-run query results into a single Map<runId, FileMetadataResponse[]>
  const agentArtifactsByRunId = useMemo(() => {
    const map = new Map<string, FileMetadataResponse[]>();
    for (let i = 0; i < turns.length; i++) {
      const result = queries[i];
      if (result?.data && result.data.length > 0) {
        map.set(turns[i].runId, result.data);
      }
    }
    return map;
  }, [turns, queries]);

  return agentArtifactsByRunId;
}
