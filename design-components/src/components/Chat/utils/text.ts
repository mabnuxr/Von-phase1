/**
 * Extracts plain text from a value that may be HTML (TipTap) or plain text (legacy textarea).
 * Uses a temporary DOM element so all HTML entities and nested tags are handled correctly.
 */
export function getPlainText(value: string): string {
  if (value.includes('<') && value.includes('>')) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = value;
    return tempDiv.textContent || tempDiv.innerText || '';
  }
  return value;
}

/**
 * Strips mention chip HTML spans from markdown, replacing them with plain `@Label` text.
 * This preserves markdown formatting (bold, links, lists) while converting mention nodes
 * that tiptap-markdown serializes as raw `<span>` HTML into readable plain text.
 */
export function stripMentionHtml(markdown: string): string {
  return markdown.replace(/<span[^>]*data-type="mention"[^>]*>@?([^<]*)<\/span>/g, '@$1');
}
