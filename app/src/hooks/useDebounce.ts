import { useEffect, useRef, useCallback } from "react";

/**
 * Custom debounce hook to delay function execution
 *
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds (default: 2000ms)
 * @returns Debounced function
 *
 * @example
 * const debouncedSave = useDebounce(() => saveMutation.mutate(data), 2000);
 */
export function useDebounce<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number = 2000,
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  );
}
