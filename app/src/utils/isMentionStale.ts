import { ensureUTC } from "@vonlabs/design-components";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Returns true when the given mention timestamp is at least 24 hours old.
 *
 * Used to gate the "this dashboard was mentioned" hint icon in the chat picker:
 * recent mentions (<24h) are obvious to the user and don't need the indicator.
 *
 * Returns false for null/undefined/unparseable inputs — the caller treats those
 * the same as "no mention" rather than surfacing a misleading indicator.
 */
export function isMentionStale(
  lastMentionedAt: string | null | undefined,
): boolean {
  if (!lastMentionedAt) return false;
  const parsed = new Date(ensureUTC(lastMentionedAt)).getTime();
  if (Number.isNaN(parsed)) return false;
  // Inclusive boundary: a mention exactly 24h old is treated as stale.
  return Date.now() - parsed >= TWENTY_FOUR_HOURS_MS;
}
