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
