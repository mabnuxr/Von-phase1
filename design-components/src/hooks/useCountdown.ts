import { useState, useEffect, useRef, useCallback } from 'react';

export type CountdownPhase = 'safe' | 'warning' | 'urgent' | 'expired' | 'inactive';

export interface CountdownState {
  /** Milliseconds remaining */
  remaining: number;
  /** Formatted display string (e.g., "12:34") */
  display: string;
  /** Color phase based on remaining / total ratio */
  phase: CountdownPhase;
}

const EXPIRED_STATE: CountdownState = {
  remaining: 0,
  display: '00:00',
  phase: 'expired',
};

/** No TTL configured — approval has no expiry. Don't show countdown, don't fire onExpire. */
const INACTIVE_STATE: CountdownState = {
  remaining: Infinity,
  display: '',
  phase: 'inactive',
};

function formatDisplay(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getPhase(remainingMs: number, totalMs: number): CountdownPhase {
  if (remainingMs <= 0) return 'expired';
  if (totalMs <= 0) return 'expired';
  const ratio = remainingMs / totalMs;
  if (ratio > 2 / 3) return 'safe';
  if (ratio > 1 / 3) return 'warning';
  return 'urgent';
}

/**
 * Countdown timer hook for approval expiry.
 *
 * @param expiresAt - Epoch ms when the approval expires
 * @param ttlSeconds - Total TTL in seconds (for phase ratio calculation)
 * @param onExpire - Called once when countdown reaches 0
 */
export function useCountdown(
  expiresAt: number | undefined,
  ttlSeconds: number | undefined,
  onExpire?: () => void
): CountdownState {
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const expiredCalledRef = useRef(false);

  const computeState = useCallback((): CountdownState => {
    if (expiresAt == null || ttlSeconds == null) return INACTIVE_STATE;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) return EXPIRED_STATE;
    const totalMs = ttlSeconds * 1000;
    return {
      remaining,
      display: formatDisplay(remaining),
      phase: getPhase(remaining, totalMs),
    };
  }, [expiresAt, ttlSeconds]);

  const [state, setState] = useState<CountdownState>(computeState);

  useEffect(() => {
    expiredCalledRef.current = false;
    const initial = computeState();
    setState(initial);

    if (initial.phase === 'expired' || initial.phase === 'inactive') {
      if (initial.phase === 'expired' && !expiredCalledRef.current) {
        expiredCalledRef.current = true;
        onExpireRef.current?.();
      }
      return;
    }

    const intervalId = setInterval(() => {
      const next = computeState();
      setState(next);

      if (next.phase === 'expired' && !expiredCalledRef.current) {
        expiredCalledRef.current = true;
        onExpireRef.current?.();
        clearInterval(intervalId);
      }
    }, 1000);

    // Browsers throttle setInterval to ~1/min in background tabs.
    // Recalculate immediately when the tab regains focus so the display
    // is accurate and onExpire fires without delay.
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const next = computeState();
        setState(next);
        if (next.phase === 'expired' && !expiredCalledRef.current) {
          expiredCalledRef.current = true;
          onExpireRef.current?.();
          clearInterval(intervalId);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [computeState]);

  return state;
}
