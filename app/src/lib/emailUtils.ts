import type { EmailDraftArtifact } from "@vonlabs/design-components";

/** Decode a quoted-printable encoded string (RFC 2045). */
function decodeQuotedPrintable(text: string): string {
  return text
    .replace(/=\r?\n/g, "") // soft line breaks
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
}

/**
 * Parse an RFC 2822 EML file into a DraftCard-compatible shape.
 * Handles folded headers, both \r\n and \n line endings, and
 * quoted-printable body encoding.
 * Returns null if the content is not a recognisable email.
 */
export function parseEmlContent(
  emlText: string,
): Omit<DraftCard, "type"> | null {
  const normalized = emlText.replace(/\r\n/g, "\n");
  const splitIdx = normalized.indexOf("\n\n");
  if (splitIdx === -1) return null;

  const headerSection = normalized.slice(0, splitIdx);
  const rawBody = normalized.slice(splitIdx + 2).trim();

  // Unfold headers (continuation lines start with whitespace)
  const unfolded = headerSection.replace(/\n[ \t]+/g, " ");
  const headers: Record<string, string> = {};
  for (const line of unfolded.split("\n")) {
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (match) headers[match[1].toLowerCase().trim()] = match[2].trim();
  }

  const to = headers["to"] ?? "";
  const subject = headers["subject"] ?? "";
  if (!to && !subject) return null;

  const isQP =
    headers["content-transfer-encoding"]?.toLowerCase() === "quoted-printable";
  const body = isQP ? decodeQuotedPrintable(rawBody) : rawBody;

  const splitList = (v?: string) =>
    v
      ? v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

  return {
    to,
    subject,
    body_preview: body.length > 500 ? body.slice(0, 497) + "..." : body,
    body_full: body,
    cc: splitList(headers["cc"]),
    bcc: splitList(headers["bcc"]),
    crm_context: headers["x-crm-context"] || undefined,
  };
}

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
