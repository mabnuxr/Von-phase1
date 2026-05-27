/**
 * The messages browsers use when fetch() fails at the network layer — i.e. the
 * request never received an HTTP response (offline, DNS failure, CORS, or an
 * ad blocker / privacy extension / VPN / firewall blocking it).
 *
 * Anchored so they match ONLY the bare browser message, never an app-authored
 * message that merely contains the same words — e.g. "Failed to fetch
 * opportunity stages from Salesforce" or "Failed to fetch OAuth state: HTTP
 * 500", which are actionable and must still reach Sentry. Sentry appends the
 * failing host in parentheses on Chromium ("Failed to fetch (api-v3...)"), so
 * that optional suffix is allowed.
 *
 *   Chrome/Chromium: "Failed to fetch"  (sometimes "Failed to fetch (host)")
 *   Safari:          "Load failed"
 *   Firefox:         "NetworkError when attempting to fetch resource."
 *   Some polyfills:  "Network request failed"
 */
export const NETWORK_ERROR_PATTERNS: RegExp[] = [
  /^Failed to fetch(?: \(.+\))?$/,
  /^Load failed$/,
  /^NetworkError when attempting to fetch resource\.?$/,
  /^Network request failed$/,
];

/**
 * True when `error` is a browser fetch network-layer failure: a TypeError whose
 * message is one of the known browser network messages. This deliberately
 * excludes other TypeErrors (a bad header value, URL, or request body — which
 * are real bugs, not connectivity issues) and SyntaxErrors (malformed JSON in
 * an otherwise-OK response), so neither gets mislabeled as "couldn't reach the
 * server".
 */
export function isBrowserNetworkError(error: unknown): error is TypeError {
  return (
    error instanceof TypeError &&
    NETWORK_ERROR_PATTERNS.some((pattern) => pattern.test(error.message))
  );
}
