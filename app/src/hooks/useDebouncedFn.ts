import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a stable debounced version of `fn` that fires `delay` ms after the
 * last call. `fn` is stored in a ref so the timeout always invokes the latest
 * version — no deps array needed, no stale-closure risk.
 */
export function useDebouncedFn<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number,
): (...args: Args) => void {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    },
    [],
  );

  return useCallback(
    (...args: Args) => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        fnRef.current(...(args as Args));
      }, delay);
    },
    [delay],
  );
}
