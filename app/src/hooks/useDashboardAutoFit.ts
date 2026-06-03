import { useCallback, useEffect, useMemo, useRef } from "react";
import type {
  AutoFitController,
  AutoFitReport,
  LayoutItem,
} from "@vonlabs/design-components";

interface UseDashboardAutoFitOptions {
  layout: readonly LayoutItem[];
  /** Forwarded to useLayoutAutoSave's handleLayoutChange. */
  onLayoutChange: (next: readonly LayoutItem[]) => void;
  /**
   * Auto-fit only fires when this is true. The caller folds in all the
   * required conditions — typically `isPreview && isEditMode`. When false,
   * widget reports are dropped on the floor (no measurement, no flush, no
   * PATCH) and the persisted layout is treated as authoritative.
   */
  isEnabled: boolean;
}

interface UseDashboardAutoFitResult {
  /** Handed to AutoFitContext.Provider. */
  controller: AutoFitController;
  /** Wraps useLayoutAutoSave's handler so user resizes pin auto-fit. */
  handleLayoutChange: (next: readonly LayoutItem[]) => void;
}

type PinState = "auto" | "user";

function layoutsShallowEqual(
  a: readonly LayoutItem[],
  b: readonly LayoutItem[],
): boolean {
  if (a.length !== b.length) return false;
  // Order-independent compare keyed by `i`.
  const map = new Map(a.map((it) => [String(it.i), it]));
  for (const it of b) {
    const peer = map.get(String(it.i));
    if (!peer) return false;
    if (
      peer.x !== it.x ||
      peer.y !== it.y ||
      peer.w !== it.w ||
      peer.h !== it.h
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Coordinates content-driven height adjustments from individual widgets.
 *
 * Widgets call `controller.report({ panelId, desiredH, fingerprint })`. The
 * coordinator:
 *  - flips the panel's pin to "auto" when the fingerprint changes (agent
 *    regenerated content), so a new measurement can override a previous user
 *    drag from a stale content state;
 *  - drops the report when the panel is currently user-pinned;
 *  - drops the report when desiredH equals the current h;
 *  - on the first measurement of a panel (no prior fingerprint), only grows —
 *    never shrinks — so a hard reload of a manually enlarged widget doesn't
 *    immediately PATCH it back down;
 *  - coalesces multiple in-flight reports via microtask flush, applies all h
 *    changes to the latest layout snapshot, runs `verticalCompactor.compact`,
 *    and forwards the result to `onLayoutChange` (which is wired to
 *    useLayoutAutoSave for debounced PATCH).
 *
 * `handleLayoutChange` mirrors RGL's onLayoutChange. We diff vs our last
 * programmatic layout: anything that changed and isn't echoing our own
 * write is treated as a user resize → that panel pins to "user".
 */
export function useDashboardAutoFit({
  layout,
  onLayoutChange,
  isEnabled,
}: UseDashboardAutoFitOptions): UseDashboardAutoFitResult {
  // Mirror the enable gate into a ref so the memoized `report` callback
  // always reads the current value without forcing every consumer to rebind
  // when the gate flips.
  const isEnabledRef = useRef(isEnabled);
  useEffect(() => {
    isEnabledRef.current = isEnabled;
  }, [isEnabled]);
  const layoutRef = useRef<readonly LayoutItem[]>(layout);
  const pinRef = useRef<Map<string, PinState>>(new Map());
  const fpRef = useRef<Map<string, string>>(new Map());
  const seenRef = useRef<Set<string>>(new Set());
  const pendingRef = useRef<Map<string, AutoFitReport>>(new Map());
  const flushScheduledRef = useRef(false);
  const lastProgrammaticRef = useRef<readonly LayoutItem[] | null>(null);

  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  const flush = useCallback(() => {
    flushScheduledRef.current = false;
    const pending = pendingRef.current;
    if (pending.size === 0) return;

    const current = layoutRef.current;
    const next = current.slice();
    let changed = false;

    pending.forEach((report, panelId) => {
      const idx = next.findIndex((it) => String(it.i) === panelId);
      if (idx === -1) return;
      const item = next[idx];
      if (item.h === report.desiredH) return;
      next[idx] = { ...item, h: report.desiredH };
      changed = true;
    });
    pending.clear();
    if (!changed) return;

    // Compaction is intentionally NOT applied here. Auto-fit only runs when
    // the manual-layout flow is active (preview + edit + flag), and that
    // flow disables compaction in DashboardGrid so n/w/corner resize handles
    // behave as the user expects. Compacting here would re-introduce the
    // same y-snap fight on auto-fit-driven height changes.

    lastProgrammaticRef.current = next;
    onLayoutChange(next);
  }, [onLayoutChange]);

  const report = useCallback(
    (r: AutoFitReport) => {
      // Auto-fit only fires when the consumer's gate is true (preview pane +
      // edit mode + drag-drop flag). Otherwise the persisted layout is
      // authoritative — drop the report without recording state so the
      // dashboard doesn't drift / PATCH while the user is just looking at it.
      if (!isEnabledRef.current) return;

      const current = layoutRef.current.find(
        (it) => String(it.i) === r.panelId,
      );
      if (!current) return;

      const priorFp = fpRef.current.get(r.panelId);
      const firstSighting = !seenRef.current.has(r.panelId);
      if (firstSighting) {
        seenRef.current.add(r.panelId);
        fpRef.current.set(r.panelId, r.fingerprint);
        // First mount: never shrink. Allow grow if the widget reports it
        // needs more vertical room than persisted.
        if (r.desiredH <= current.h) return;
      } else if (priorFp !== r.fingerprint) {
        // Content changed (agent regenerated) — re-engage auto-fit.
        pinRef.current.set(r.panelId, "auto");
        fpRef.current.set(r.panelId, r.fingerprint);
      }

      if (pinRef.current.get(r.panelId) === "user") return;
      if (current.h === r.desiredH) return;

      pendingRef.current.set(r.panelId, r);
      if (!flushScheduledRef.current) {
        flushScheduledRef.current = true;
        queueMicrotask(flush);
      }
    },
    [flush],
  );

  const handleLayoutChange = useCallback(
    (next: readonly LayoutItem[]) => {
      const programmatic = lastProgrammaticRef.current;
      const isProgrammaticEcho =
        programmatic !== null && layoutsShallowEqual(programmatic, next);

      if (!isProgrammaticEcho) {
        // Compare against the previous app-known layout to detect user-driven
        // h/w changes. Anything the user just resized → pin to "user".
        const prev = layoutRef.current;
        const prevMap = new Map(prev.map((it) => [String(it.i), it]));
        for (const it of next) {
          const peer = prevMap.get(String(it.i));
          if (!peer) continue;
          if (peer.w !== it.w || peer.h !== it.h) {
            pinRef.current.set(String(it.i), "user");
          }
        }
      }

      // Forward unconditionally — useLayoutAutoSave handles dedupe via its
      // equality check, and we want both user resizes and auto-fit PATCHes
      // to flow through the same debounced pipe.
      onLayoutChange(next);
    },
    [onLayoutChange],
  );

  const controller = useMemo<AutoFitController>(() => ({ report }), [report]);

  return { controller, handleLayoutChange };
}
