import { useCallback, useEffect, useRef } from "react";

const CLEANUP_INTERVAL_MS = 30_000;
const STALE_THRESHOLD_MS = 10_000;
const DOWNLOAD_ANCHOR_SELECTOR = "a[data-download-timestamp]";

const scheduleIdleTask =
  typeof requestIdleCallback !== "undefined"
    ? requestIdleCallback
    : (cb: () => void) => setTimeout(cb, 0);

function cleanupStaleAnchors() {
  const now = Date.now();
  const anchors = document.querySelectorAll<HTMLAnchorElement>(
    DOWNLOAD_ANCHOR_SELECTOR,
  );
  anchors.forEach((a) => {
    const timestamp = Number(a.dataset.downloadTimestamp);
    if (now - timestamp > STALE_THRESHOLD_MS) {
      URL.revokeObjectURL(a.href);
      a.remove();
    }
  });
}

/**
 * useFileDownload — reusable hook for blob-based file downloads.
 *
 * Creates a hidden anchor with `data-download-timestamp`, clicks it to trigger
 * the browser's save dialog, then relies on an idle-scheduled cleanup loop
 * (every 30s) to revoke object URLs and remove stale anchors.
 */
export function useFileDownload() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      scheduleIdleTask(cleanupStaleAnchors);
    }, CLEANUP_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Eagerly clean up on unmount
      const anchors = document.querySelectorAll<HTMLAnchorElement>(
        DOWNLOAD_ANCHOR_SELECTOR,
      );
      anchors.forEach((a) => {
        URL.revokeObjectURL(a.href);
        a.remove();
      });
    };
  }, []);

  const downloadBlob = useCallback(
    async (url: string, fileName: string) => {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`Download failed (${response.status})`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      a.style.display = "none";
      a.dataset.downloadTimestamp = String(Date.now());
      document.body.appendChild(a);
      a.click();
    },
    [],
  );

  return { downloadBlob };
}
