import { useMemo } from "react";
import type { EmailDraftArtifact } from "@vonlabs/design-components";
import { useLazyArtifactContent } from "./useMessageArtifacts";
import { draftCardToArtifact, type DraftCard } from "../lib/emailUtils";

/**
 * Fetches an email_draft artifact by reference and converts it to EmailDraftArtifact.
 *
 * Used when the TOOL_CALL_RESULT event contains a _artifact reference instead of
 * an inline draft_card (new backend format).
 */
export function useEmailDraftArtifact(
  conversationId: string | null,
  ref: { artifactId: string; runId: string } | null,
): EmailDraftArtifact | null {
  const { data } = useLazyArtifactContent(
    conversationId,
    ref?.runId ?? null,
    ref?.artifactId ?? null,
  );

  return useMemo(() => {
    if (!data || !ref) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const draftCard = (data.content as any)?.draft_card as DraftCard | undefined;
    if (!draftCard?.type || draftCard.type !== "email_draft") return null;
    return draftCardToArtifact(draftCard, ref.artifactId);
  }, [data, ref]);
}
