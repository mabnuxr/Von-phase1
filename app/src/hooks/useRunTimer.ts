import { useCallback, useEffect, useRef, useState } from "react";

export interface UseRunTimerReturn {
  elapsedTime: number;
  /** Reset to 0 and begin counting. */
  start: () => void;
  /** Stop counting and freeze the value (run finished). */
  stop: () => void;
  /** Freeze the value temporarily (e.g. awaiting approval). */
  pause: () => void;
  /** Resume counting from the current value. */
  play: () => void;
  /** Overwrite the displayed value (e.g. from server-derived elapsed time). */
  set: (value: number) => void;
}

export function useRunTimer(): UseRunTimerReturn {
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimer();
    setElapsedTime(0);
    intervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  }, [clearTimer]);

  const stop = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const play = useCallback(() => {
    if (intervalRef.current) return; // already running
    intervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  }, []);

  const set = useCallback((value: number) => {
    setElapsedTime(value);
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return { elapsedTime, start, stop, pause, play, set };
}
