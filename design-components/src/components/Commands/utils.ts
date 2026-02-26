/**
 * Converts arbitrary text to a URL-friendly slug while the user is typing.
 * Allows a trailing hyphen so the user can continue typing (e.g. "my-command-").
 */
export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-') // spaces → hyphens
    .replace(/[^a-z0-9-]/g, '') // strip everything except alphanum + hyphen
    .replace(/-{2,}/g, '-'); // collapse consecutive hyphens
}
