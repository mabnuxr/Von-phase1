/**
 * Ensure an ISO-8601 date string is interpreted as UTC.
 * Appends 'Z' if the string has no timezone designator.
 */
export function ensureUTC(dateStr: string): string {
  if (/Z$|[+-]\d{2}:\d{2}$|[+-]\d{4}$/.test(dateStr)) return dateStr;
  return dateStr + 'Z';
}
