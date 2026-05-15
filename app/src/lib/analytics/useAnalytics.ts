import { track, report } from "./tracker";

/**
 * Returns track() and report.* for use inside React hooks and callbacks.
 * For code outside React, import track/report directly from tracker.ts.
 */
export function useAnalytics() {
  return { track, report };
}
