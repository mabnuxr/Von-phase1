import { useCallback, useEffect, useRef, type RefObject } from 'react';

const EDGE_ZONE_PX = 60;
const MIN_VELOCITY_PX = 2;
const MAX_VELOCITY_PX = 16;

function findScrollableAncestor(start: HTMLElement | null): HTMLElement | null {
  let node: HTMLElement | null = start?.parentElement ?? null;
  while (node && node !== document.body) {
    const overflowY = window.getComputedStyle(node).overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  const root = (document.scrollingElement ?? document.documentElement) as HTMLElement | null;
  if (root && root.scrollHeight > root.clientHeight) {
    return root;
  }
  return null;
}

/**
 * Auto-scrolls the nearest scrollable ancestor of `containerRef` while a drag
 * or resize is active and the pointer is near the top/bottom edge.
 *
 * Returns lifecycle callbacks to wire into `<GridLayout>`. Drag/resize trigger
 * the same machinery — only one can be active at a time.
 */
export function useDragAutoScroll(containerRef: RefObject<HTMLElement | null>) {
  const scrollerRef = useRef<HTMLElement | null>(null);
  const lastClientYRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const stopLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const scroller = scrollerRef.current;
    const clientY = lastClientYRef.current;
    if (!scroller || clientY === null) {
      rafIdRef.current = null;
      return;
    }

    const rect = scroller.getBoundingClientRect();
    const distanceFromTop = clientY - rect.top;
    const distanceFromBottom = rect.bottom - clientY;

    let velocity = 0;
    if (distanceFromTop < EDGE_ZONE_PX && distanceFromTop >= 0) {
      const ramp = 1 - distanceFromTop / EDGE_ZONE_PX;
      velocity = -(MIN_VELOCITY_PX + (MAX_VELOCITY_PX - MIN_VELOCITY_PX) * ramp);
    } else if (distanceFromBottom < EDGE_ZONE_PX && distanceFromBottom >= 0) {
      const ramp = 1 - distanceFromBottom / EDGE_ZONE_PX;
      velocity = MIN_VELOCITY_PX + (MAX_VELOCITY_PX - MIN_VELOCITY_PX) * ramp;
    }

    if (velocity === 0) {
      rafIdRef.current = null;
      return;
    }

    const atTop = scroller.scrollTop <= 0 && velocity < 0;
    const atBottom =
      scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight && velocity > 0;
    if (!atTop && !atBottom) {
      scroller.scrollBy(0, velocity);
    }

    rafIdRef.current = requestAnimationFrame(tick);
  }, []);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      lastClientYRef.current = e.clientY;
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(tick);
      }
    },
    [tick]
  );

  const handlePointerLeave = useCallback(() => {
    stopLoop();
  }, [stopLoop]);

  const start = useCallback(
    (event: Event, element?: HTMLElement) => {
      const origin = element ?? containerRef.current;
      const scroller = findScrollableAncestor(origin ?? null);
      if (!scroller) return;

      scrollerRef.current = scroller;
      if (event instanceof PointerEvent || event instanceof MouseEvent) {
        lastClientYRef.current = event.clientY;
      }

      window.addEventListener('pointermove', handlePointerMove);
      document.documentElement.addEventListener('pointerleave', handlePointerLeave);
    },
    [containerRef, handlePointerMove, handlePointerLeave]
  );

  const stop = useCallback(() => {
    stopLoop();
    window.removeEventListener('pointermove', handlePointerMove);
    document.documentElement.removeEventListener('pointerleave', handlePointerLeave);
    scrollerRef.current = null;
    lastClientYRef.current = null;
  }, [stopLoop, handlePointerMove, handlePointerLeave]);

  useEffect(() => {
    return () => {
      stopLoop();
      window.removeEventListener('pointermove', handlePointerMove);
      document.documentElement.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [stopLoop, handlePointerMove, handlePointerLeave]);

  const onDragStart = useCallback(
    (
      _layout: unknown,
      _oldItem: unknown,
      _newItem: unknown,
      _placeholder: unknown,
      event: Event,
      element?: HTMLElement
    ) => {
      start(event, element);
    },
    [start]
  );

  const onDragStop = useCallback(() => {
    stop();
  }, [stop]);

  return {
    onDragStart,
    onDragStop,
    onResizeStart: onDragStart,
    onResizeStop: onDragStop,
  };
}
