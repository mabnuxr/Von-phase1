import { useRef, useState, useLayoutEffect, useCallback } from 'react';

/**
 * Return type for useIsTruncated hook
 */
export interface UseIsTruncatedReturn<T extends HTMLElement = HTMLElement> {
  /** Ref to attach to the element that may be truncated */
  ref: React.RefObject<T | null>;
  /** Whether the element's content is currently truncated */
  isTruncated: boolean;
}

/**
 * useIsTruncated - Detects whether an element's text content is truncated via CSS.
 *
 * Works with `text-overflow: ellipsis`, `truncate` (Tailwind), or any overflow-hidden
 * clipping. Uses ResizeObserver to re-evaluate when the element or its container resizes.
 *
 * @example
 * ```tsx
 * const { ref, isTruncated } = useIsTruncated<HTMLSpanElement>();
 *
 * return (
 *   <div className="relative group">
 *     <span ref={ref} className="truncate max-w-[120px]">
 *       {longText}
 *     </span>
 *     {isTruncated && (
 *       <span className="opacity-0 group-hover:opacity-100 ...">
 *         {longText}
 *       </span>
 *     )}
 *   </div>
 * );
 * ```
 */
export function useIsTruncated<T extends HTMLElement = HTMLElement>(): UseIsTruncatedReturn<T> {
  const ref = useRef<T>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const checkTruncation = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setIsTruncated(el.scrollWidth > el.clientWidth);
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Initial check
    checkTruncation();

    // Re-check on resize (container or element width changes)
    const observer = new ResizeObserver(checkTruncation);
    observer.observe(el);

    return () => observer.disconnect();
  }, [checkTruncation]);

  return { ref, isTruncated };
}
