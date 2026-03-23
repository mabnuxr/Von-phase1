import { useMemo } from "react";
import type { Message } from "@vonlabs/design-components";
import type { EmailDraftArtifact } from "@vonlabs/design-components";

/**
 * Post-processes a message list to attach email draft artifacts to the correct
 * assistant message per runId. Each entry in `artifactsByRunId` is matched to
 * the last assistant message whose `runId` equals the map key. Falls back to
 * the last assistant message when no match is found.
 *
 * Kept separate from dashboardUtils so the email-draft concern doesn't bleed
 * into the core message-transformation logic.
 */
export function useMessagesWithEmailDraft(
  messages: Message[],
  artifactsByRunId: Map<string, EmailDraftArtifact[]>,
): Message[] {
  return useMemo(() => {
    if (artifactsByRunId.size === 0) return messages;

    let result = messages;

    for (const [runId, artifacts] of artifactsByRunId) {
      if (artifacts.length === 0) continue;

      // findLastIndex is ES2023+ — use a manual reverse scan for compat
      let targetIdx = -1;
      for (let i = result.length - 1; i >= 0; i--) {
        const m = result[i];
        if (m.type === "assistant" && m.runId === runId) {
          targetIdx = i;
          break;
        }
      }
      if (targetIdx === -1) {
        for (let i = result.length - 1; i >= 0; i--) {
          if (result[i].type === "assistant") {
            targetIdx = i;
            break;
          }
        }
      }
      if (targetIdx === -1) continue;

      result = result.map((msg, idx) => {
        if (idx !== targetIdx) return msg;
        return { ...msg, emailDraftArtifacts: artifacts };
      });
    }

    return result;
  }, [messages, artifactsByRunId]);
}
