import { useCallback, useEffect, useRef, type DependencyList } from "react";

/**
 * Returns a debounced version of `fn` that fires `delay` ms after the last call.
 * Mirrors the useCallback API — pass deps to control when the debounced
 * function is recreated.
 */
export function useDebouncedFn<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number,
  deps: DependencyList,
): (...args: Args) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((...args: Args) => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      fn(...args as Args);
    }, delay);
  }, deps);
}
