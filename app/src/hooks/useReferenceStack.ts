import { useState, useCallback, useMemo } from "react";
import type { MessageReference } from "../types/conversation";
import type { ReferenceContext } from "@vonlabs/design-components";

/**
 * A stack-based context manager for the Analytics/Dashboard chat.
 *
 * - The base layer (e.g. dashboard) is always present and cannot be removed.
 * - Additional layers (e.g. widget) can be pushed on top and removed.
 * - The context bar in the input always shows the topmost (deepest) context.
 * - Removing the top layer falls back to the layer beneath it.
 * - `references` returns the full stack formatted for the backend API.
 *
 * Pass `null` when there is no reference context (e.g. standalone chat).
 * All return values degrade gracefully — activeContext becomes undefined.
 */

export interface ReferenceStackLayer {
  /** Display context shown in the input bar */
  display: ReferenceContext;
  /** Backend reference attached to messages */
  reference: MessageReference;
}

export interface UseReferenceStackReturn {
  /** The topmost display context (shown in the input bar) — undefined when no base */
  activeContext: ReferenceContext | undefined;
  /** Whether the active context can be removed (false for base layer or no base) */
  canRemove: boolean;
  /** Remove the topmost layer, falls back to the one below */
  removeTop: () => void;
  /** Push a new layer onto the stack */
  push: (layer: ReferenceStackLayer) => void;
  /** All references for the backend API (full stack) */
  references: MessageReference[];
}

/**
 * @param base - The base layer that is always present (e.g. dashboard context), or null
 */
export function useReferenceStack(
  base: ReferenceStackLayer | null,
): UseReferenceStackReturn {
  const [overlays, setOverlays] = useState<ReferenceStackLayer[]>([]);

  const push = useCallback((layer: ReferenceStackLayer) => {
    setOverlays((prev) => [...prev, layer]);
  }, []);

  const removeTop = useCallback(() => {
    setOverlays((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  }, []);

  const activeContext =
    overlays.length > 0
      ? overlays[overlays.length - 1].display
      : base?.display;

  const canRemove = overlays.length > 0;

  const references = useMemo(
    () => [
      ...(base ? [base.reference] : []),
      ...overlays.map((o) => o.reference),
    ],
    [base, overlays],
  );

  return { activeContext, canRemove, removeTop, push, references };
}
