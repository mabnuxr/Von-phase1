import { useMemo } from "react";
import { track, report } from "./tracker";

/**
 * Returns stable references to track() and report.* for use inside
 * React hooks and callbacks. For code outside React, import track/report
 * directly from tracker.ts.
 */
export function useAnalytics() {
  return useMemo(() => ({ track, report }), []);
}
