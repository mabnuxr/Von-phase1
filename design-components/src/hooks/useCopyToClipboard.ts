import { useState, useCallback, useRef } from 'react';

export interface UseCopyToClipboardReturn {
  /** Copy text to clipboard. Returns true on success, false on failure. */
  copy: (text: string) => Promise<boolean>;
  /** Whether the last copy was successful (resets after `resetDelay` ms) */
  copied: boolean;
}

/**
 * useCopyToClipboard
 *
 * Safe clipboard write that handles non-secure contexts and permission denial.
 * Sets `copied` to true on success and auto-resets after `resetDelay` ms.
 */
export function useCopyToClipboard(resetDelay = 2000): UseCopyToClipboardReturn {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        if (!window.isSecureContext || !navigator.clipboard?.writeText) {
          // Fallback for non-HTTPS / unsupported environments
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          const ok = document.execCommand('copy');
          document.body.removeChild(textarea);
          if (!ok) return false;
        } else {
          await navigator.clipboard.writeText(text);
        }

        setCopied(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), resetDelay);
        return true;
      } catch {
        return false;
      }
    },
    [resetDelay],
  );

  return { copy, copied };
}
