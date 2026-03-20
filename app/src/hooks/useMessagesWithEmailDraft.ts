import { useMemo } from "react";
import type { Message } from "@vonlabs/design-components";
import type { EmailDraftArtifact } from "@vonlabs/design-components";

/**
 * Post-processes a message list to attach an email draft artifact to the last
 * assistant message. Kept separate from dashboardUtils so the email-draft
 * concern doesn't bleed into the core message-transformation logic.
 */
export function useMessagesWithEmailDraft(
  messages: Message[],
  emailDraftArtifact: EmailDraftArtifact | null | undefined,
): Message[] {
  return useMemo(() => {
    if (!emailDraftArtifact) return messages;

    // Find the last assistant message
    let lastAssistantIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === "assistant") {
        lastAssistantIdx = i;
        break;
      }
    }

    if (lastAssistantIdx === -1) return messages;

    return messages.map((msg, idx) => {
      if (idx !== lastAssistantIdx) return msg;
      return { ...msg, emailDraftArtifacts: [emailDraftArtifact] };
    });
  }, [messages, emailDraftArtifact]);
}
