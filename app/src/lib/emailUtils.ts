/** Decode a quoted-printable encoded string (RFC 2045) with proper UTF-8 support. */
function decodeQuotedPrintable(text: string): string {
  // Remove soft line breaks first
  const cleaned = text.replace(/=\r?\n/g, "");

  // Collect all bytes (encoded =XX → byte value, plain ASCII → char code),
  // then decode the whole buffer as UTF-8 so multi-byte sequences work.
  const bytes: number[] = [];
  let i = 0;
  while (i < cleaned.length) {
    if (
      cleaned[i] === "=" &&
      i + 2 < cleaned.length &&
      /^[0-9A-Fa-f]{2}$/.test(cleaned.slice(i + 1, i + 3))
    ) {
      bytes.push(parseInt(cleaned.slice(i + 1, i + 3), 16));
      i += 3;
    } else {
      bytes.push(cleaned.charCodeAt(i));
      i += 1;
    }
  }
  return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
}

/** Decode RFC 2047 encoded-words in email headers (e.g. =?utf-8?q?...?= or =?utf-8?b?...?=). */
function decodeRfc2047(header: string): string {
  return header.replace(
    /=\?([^?]+)\?(Q|B)\?([^?]*)\?=/gi,
    (_, charset: string, encoding: string, encoded: string) => {
      let bytes: Uint8Array;
      if (encoding.toUpperCase() === "B") {
        // Base64
        const binary = atob(encoded);
        bytes = new Uint8Array(binary.length);
        for (let j = 0; j < binary.length; j++) {
          bytes[j] = binary.charCodeAt(j);
        }
      } else {
        // Q-encoding: underscores → spaces, =XX → byte
        const raw = encoded.replace(/_/g, " ");
        const byteArr: number[] = [];
        let k = 0;
        while (k < raw.length) {
          if (
            raw[k] === "=" &&
            k + 2 < raw.length &&
            /^[0-9A-Fa-f]{2}$/.test(raw.slice(k + 1, k + 3))
          ) {
            byteArr.push(parseInt(raw.slice(k + 1, k + 3), 16));
            k += 3;
          } else {
            byteArr.push(raw.charCodeAt(k));
            k += 1;
          }
        }
        bytes = new Uint8Array(byteArr);
      }
      try {
        return new TextDecoder(charset).decode(bytes);
      } catch {
        return new TextDecoder("utf-8").decode(bytes);
      }
    },
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

  const to = decodeRfc2047(headers["to"] ?? "");
  const subject = decodeRfc2047(headers["subject"] ?? "");
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
