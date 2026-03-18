import type { EmailDraftArtifact } from "@vonlabs/design-components";

export interface ParsedEmailDraft {
  artifact: EmailDraftArtifact;
  /** Text before the To: line — displayed above the GmailDraftCard */
  preText: string;
}

/**
 * Strip common markdown syntax from email body text so it renders as plain text.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")   // **bold** → bold
    .replace(/\*(.+?)\*/g, "$1")        // *italic* → italic
    .replace(/^[-*]\s+/gm, "• ")        // - item → • item
    .replace(/^#{1,6}\s+/gm, "")        // ## heading → heading
    .replace(/`(.+?)`/g, "$1");         // `code` → code
}

/**
 * Parse an email draft from agent message content.
 * Detects To:/Subject: patterns and builds an EmailDraftArtifact with a
 * pre-filled Gmail compose URL — no backend required.
 * Also returns the text that should be displayed (everything before To:).
 */
export function parseEmailDraftFromContent(
  content: string,
  messageId: string,
): ParsedEmailDraft | null {
  if (!content) return null;

  const toMatch = content.match(/\*{0,2}To:\*{0,2}\s+([^\n]+)/i);
  const subjectMatch = content.match(/\*{0,2}Subject:\*{0,2}\s+([^\n]+)/i);
  if (!toMatch || !subjectMatch) return null;

  const toRaw = toMatch[1].trim();
  const emailMatch = toRaw.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
  const to = emailMatch ? emailMatch[0] : toRaw;
  const subject = subjectMatch[1].trim();

  // Text displayed above the card = everything before the To: line
  const toIndex = content.indexOf(toMatch[0]);
  const preText = toIndex > 0 ? content.slice(0, toIndex).trim() : "";

  // Body = everything after the Subject line, minus trailing assistant offer
  const subjectEnd = content.indexOf(subjectMatch[0]) + subjectMatch[0].length;
  let body = content.slice(subjectEnd).trim();
  const trailingMatch = body.match(
    /\n\n(Want me to|Would you like|Let me know if you want|Feel free to|Is there anything)/i,
  );
  if (trailingMatch) {
    body = body.slice(0, body.lastIndexOf(trailingMatch[0])).trim();
  }
  if (!body) return null;

  // Strip markdown syntax so the card body renders as plain email text
  body = stripMarkdown(body);

  // Build a Gmail compose URL so "Open in Gmail" works without backend
  const gmailUrl =
    `https://mail.google.com/mail/?view=cm&fs=1` +
    `&to=${encodeURIComponent(to)}` +
    `&su=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;

  return { artifact: { draftId: messageId, subject, body, to, gmailUrl }, preText };
}
