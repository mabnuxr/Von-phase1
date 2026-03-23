import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import type { EmailDraftArtifact } from "@vonlabs/design-components";
import { draftCardToArtifact, type DraftCard } from "../lib/emailUtils";
import { conversationsService } from "../services/conversationsService";

const ARTIFACT_STALE_TIME = 5 * 60 * 1000;
const ARTIFACT_GC_TIME = 10 * 60 * 1000;
const ARTIFACT_RETRY_COUNT = 3;

/**
 * Fetches all email_draft artifacts for a run and converts them to EmailDraftArtifact[].
 * Uses useQueries so each fetch is independent and cached individually.
 */
export function useEmailDraftArtifact(
  conversationId: string | null,
  refs: { artifactId: string; runId: string }[],
): EmailDraftArtifact[] {
  const results = useQueries({
    queries: refs.map((ref) => ({
      queryKey: ["artifact-content", conversationId, ref.runId, ref.artifactId],
      queryFn: async () => {
        if (!conversationId) throw new Error("Missing conversationId");
        return conversationsService.getArtifactByRunId(
          conversationId,
          ref.runId,
          ref.artifactId,
        );
      },
      enabled: !!conversationId,
      staleTime: ARTIFACT_STALE_TIME,
      gcTime: ARTIFACT_GC_TIME,
      retry: ARTIFACT_RETRY_COUNT,
      retryDelay: (attemptIndex: number) =>
        Math.min(1000 * 2 ** attemptIndex, 30_000),
    })),
  });

  return useMemo(() => {
    const artifacts: EmailDraftArtifact[] = [];
    for (let i = 0; i < results.length; i++) {
      const data = results[i].data;
      if (!data) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const draftCard = (data.content as any)?.draft_card as
        | DraftCard
        | undefined;
      if (!draftCard?.type || draftCard.type !== "email_draft") continue;
      artifacts.push(draftCardToArtifact(draftCard, refs[i].artifactId));
    }
    return artifacts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);
}
