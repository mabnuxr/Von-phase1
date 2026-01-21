// Regex to match {{placeholder}} patterns
export const PLACEHOLDER_REGEX = /\{\{(\w+)\}\}/g;

/**
 * Check if text contains any placeholders
 */
export function hasPlaceholders(text: string): boolean {
  const regex = /\{\{(\w+)\}\}/;
  return regex.test(text);
}

/**
 * For backwards compatibility - just returns the value as-is
 * since we no longer store separate placeholder values
 */
export function buildResolvedText(value: string): string {
  return value;
}
