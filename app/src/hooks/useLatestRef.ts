import { useRef } from "react";

/**
 * Returns a ref that always holds the latest value.
 * Useful for reading a reactive value inside effects or callbacks
 * without adding it to dependency arrays.
 */
export function useLatestRef<T>(value: T): React.RefObject<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
