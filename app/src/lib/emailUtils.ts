import type { EmailDraftArtifact } from "@vonlabs/design-components";

/** Shape of the draft_card payload returned by the backend tool result */
export interface DraftCard {
  type: "email_draft";
  to: string;
  subject: string;
  body_preview: string;
  body_full: string;
  cc?: string[];
  bcc?: string[];
  crm_context?: string;
}

/**
 * Build a Gmail compose URL from a DraftCard payload.
 * Opens a pre-filled compose window — no backend call needed.
 */
export function buildGmailComposeUrl(card: DraftCard): string {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: card.to,
    su: card.subject,
    body: card.body_full,
  });
  if (card.cc?.length) params.set("cc", card.cc.join(","));
  if (card.bcc?.length) params.set("bcc", card.bcc.join(","));
  return `https://mail.google.com/mail/?${params.toString()}`;
}

/**
 * Convert a backend DraftCard payload into an EmailDraftArtifact for the UI.
 */
export function draftCardToArtifact(
  card: DraftCard,
  messageId: string,
): EmailDraftArtifact {
  return {
    draftId: messageId,
    to: card.to,
    subject: card.subject,
    bodyPreview: card.body_preview,
    bodyFull: card.body_full,
    cc: card.cc,
    bcc: card.bcc,
    crmContext: card.crm_context,
    gmailUrl: buildGmailComposeUrl(card),
  };
}
