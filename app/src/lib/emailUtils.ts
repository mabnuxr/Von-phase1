import PostalMime from "postal-mime";

/**
 * Convert HTML to plain text preserving line breaks.
 * Renders into a hidden element and uses innerText for accurate visual representation.
 */
function htmlToPlainText(html: string): string {
  const el = document.createElement("div");
  el.style.position = "fixed";
  el.style.left = "-9999px";
  el.style.whiteSpace = "pre-wrap";
  el.innerHTML = html;
  document.body.appendChild(el);
  const text = el.innerText;
  document.body.removeChild(el);
  return text.trim();
}

/** Shape of the draft_card payload returned by the backend tool result */
export interface DraftCard {
  type: "email_draft";
  to: string;
  subject: string;
  body_preview: string;
  body_full: string;
  /** Plain text version of the body for copy-to-clipboard */
  body_plain: string;
  /** Whether body_full contains HTML (true for new drafts, false for legacy plain text) */
  isHtml: boolean;
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
  let email;
  try {
    const parser = new PostalMime();
    email = await parser.parse(emlBytes);
  } catch {
    return null;
  }

  const to =
    email.to
      ?.map((a) =>
        a.address
          ? a.name
            ? `${a.name} <${a.address}>`
            : a.address
          : a.name || "",
      )
      .filter(Boolean)
      .join(", ") ?? "";
  const subject = email.subject ?? "";
  if (!to && !subject) return null;

  const htmlBody = email.html || "";
  const textBody = email.text || "";
  // Prefer HTML for rendering; fall back to plain text for old drafts
  const body = htmlBody || textBody;
  const toAddrs = (list?: { address?: string }[]) => {
    const addrs = list
      ?.map((a) => a.address)
      .filter((addr): addr is string => !!addr);
    return addrs?.length ? addrs : undefined;
  };

  const isHtml = !!htmlBody;
  // For plain text copy: use text part if available, otherwise convert HTML properly
  const plainText = textBody || htmlToPlainText(htmlBody);

  return {
    to,
    subject,
    body_preview:
      plainText.length > 500 ? plainText.slice(0, 497) + "..." : plainText,
    body_full: body,
    body_plain: plainText,
    isHtml,
    cc: toAddrs(email.cc),
    bcc: toAddrs(email.bcc),
    crm_context: email.headers?.find((h) => h.key === "x-crm-context")?.value,
  };
}
