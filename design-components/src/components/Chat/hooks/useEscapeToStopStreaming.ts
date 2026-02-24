import { useEffect, useCallback, type RefObject } from 'react';

/**
 * Hook that listens for the Escape key on a container element
 * and triggers the stop streaming callback when streaming is active.
 *
 * The listener is attached to the container ref (not document.body)
 * so it won't conflict with other Escape behaviors like closing modals.
 */
export function useEscapeToStopStreaming({
  containerRef,
  isStreaming,
  onStop,
}: {
  containerRef: RefObject<HTMLElement | null>;
  isStreaming: boolean;
  onStop: () => void;
}) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isStreaming) {
        e.preventDefault();
        e.stopPropagation();
        onStop();
      }
    },
    [isStreaming, onStop]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, handleKeyDown]);
}
