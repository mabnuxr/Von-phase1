import PostalMime from "postal-mime";

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
 * Parse an EML file (as ArrayBuffer) into a DraftCard-compatible shape.
 * Uses postal-mime for RFC-compliant decoding of quoted-printable, base64,
 * multipart, RFC 2047 headers, and charset detection.
 */
export async function parseEmlContent(
  emlBytes: ArrayBuffer,
): Promise<Omit<DraftCard, "type"> | null> {
  const parser = new PostalMime();
  const email = await parser.parse(emlBytes);

  const to =
    email.to
      ?.map((a) => (a.name ? `${a.name} <${a.address}>` : a.address))
      .join(", ") ?? "";
  const subject = email.subject ?? "";
  if (!to && !subject) return null;

  const body = email.text ?? "";
  const toAddrs = (list?: { address?: string }[]) => {
    const addrs = list
      ?.map((a) => a.address)
      .filter((addr): addr is string => !!addr);
    return addrs?.length ? addrs : undefined;
  };

  return {
    to,
    subject,
    body_preview: body.length > 500 ? body.slice(0, 497) + "..." : body,
    body_full: body,
    cc: toAddrs(email.cc),
    bcc: toAddrs(email.bcc),
    crm_context: email.headers?.find((h) => h.key === "x-crm-context")?.value,
  };
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
