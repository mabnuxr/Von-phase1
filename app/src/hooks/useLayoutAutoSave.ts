import { useCallback, useEffect, useRef } from "react";
import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type { LayoutItem } from "@vonlabs/design-components";
import {
  dashboardService,
  type DashboardMetadataApiResponse,
} from "../services/dashboardService";
import { ApiError } from "../services/apiClient";
import { dashboardKeys } from "./useDashboardQuery";
import { writeDashboardEditState } from "./useDashboardMetadata";
import { useToast } from "./useToast";

const AUTOSAVE_DEBOUNCE_MS = 500;

type PanelLayouts = Record<
  string,
  { x: number; y: number; w: number; h: number }
>;

function toPanelLayouts(layout: readonly LayoutItem[]): PanelLayouts {
  const out: PanelLayouts = {};
  for (const item of layout) {
    out[String(item.i)] = {
      x: Number(item.x),
      y: Number(item.y),
      w: Number(item.w),
      h: Number(item.h),
    };
  }
  return out;
}

function layoutsEqual(a: PanelLayouts, b: PanelLayouts): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    const ai = a[k];
    const bi = b[k];
    if (!bi) return false;
    if (ai.x !== bi.x || ai.y !== bi.y || ai.w !== bi.w || ai.h !== bi.h) {
      return false;
    }
  }
  return true;
}

/**
 * Apply a `PATCH /dashboards/{id}` response to the query cache.
 *
 * The endpoint returns the flat `DashboardMetadataResponse` (the service
 * mistypes it as the wrapped envelope — cast here; the runtime payload is
 * flat). When a layout edit *created* the first draft (BE draft-on-first-edit),
 * `editable_version` now points at that draft and `is_editable` is true, so we
 * forward the four edit-state fields to the shared `writeDashboardEditState`
 * (patch metadata cache + refetch render) rather than discarding the response.
 */
function applyMetadataResponseToCache(
  queryClient: QueryClient,
  dashboardId: string,
  response: unknown,
): void {
  // `updateDashboard` is declared as the wrapped envelope but returns the flat
  // payload (tech debt), so the cast below is unverified. Validate the runtime
  // shape first — otherwise an unexpected response would spread `undefined`
  // over the cached edit-state and silently drop the user out of edit mode.
  // Fall back to a full refetch instead.
  if (
    !response ||
    typeof response !== "object" ||
    !("dashboard_id" in response)
  ) {
    queryClient.invalidateQueries({
      queryKey: dashboardKeys.detail(dashboardId),
    });
    return;
  }
  const meta = response as DashboardMetadataApiResponse;
  writeDashboardEditState(queryClient, dashboardId, {
    is_editable: meta.is_editable,
    editable_version: meta.editable_version,
    latest_published_version: meta.latest_published_version,
    edit_lock: meta.edit_lock,
  });
}

/**
 * Persists drag/resize changes to `ui_config.panel_layouts` via PATCH.
 * Debounces consecutive changes so a single drag gesture fires one PATCH.
 *
 * The hook is intentionally stateless w.r.t. positions — react-grid-layout
 * owns the in-flight layout; we just forward the final shape server-side.
 */
export function useLayoutAutoSave(
  dashboardId: string,
  isEditMode: boolean,
  layout: readonly LayoutItem[],
) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pendingRef = useRef<PanelLayouts | null>(null);

  // The layout the server most recently rejected. `flushNow` refuses to
  // re-fire an identical layout (circuit-breaker) so a persistent rejection —
  // e.g. `APP_DASHBOARD_NOT_EDITABLE` while auto-fit keeps re-reporting the
  // same height delta — can't storm the PATCH endpoint (the customer-reported
  // "Failed to save layout" toast flood). Cleared on the next successful save.
  const lastFailedRef = useRef<PanelLayouts | null>(null);

  // Seed the saved baseline once from the layout the hook was first called
  // with. Without this, entering edit mode triggers RGL's
  // `static: true → false` reconcile, which fires `onLayoutChange` with
  // unchanged positions; the equality guard in `flushNow` would otherwise
  // short-circuit on a null baseline and PATCH the layout back to the
  // server unnecessarily.
  //
  // We deliberately don't re-seed from later `layout` prop changes —
  // overwriting the baseline with stale server data while a save is in
  // flight (refetch lag) would trick `flushNow` into re-PATCHing work
  // that's already in flight. After mount, `lastSavedRef` is owned by
  // `mutation.onSuccess`. Both call sites of this hook gate rendering on
  // the dashboard query resolving, so the very first `layout` we see is
  // the authoritative server layout. `useRef`'s initial-value argument is
  // captured at first render and ignored on subsequent renders, which is
  // exactly the seed-once semantics we want.
  const lastSavedRef = useRef<PanelLayouts | null>(toPanelLayouts(layout));

  // Mirror the latest `layout` prop into a ref so `flushNow` can
  // compare a pending change against what's currently rendered — not
  // just against the original baseline. RGL fires `onLayoutChange`
  // when its `static` flag toggles on edit-mode entry, emitting the
  // editable version's layout into `pendingRef`. If the user quickly
  // exits (discard / save-draft) before the debounce fires, the
  // `isEditMode → false` flush sees that pending value vs the new
  // (post-discard) layout. Without this ref, the equality check is
  // only vs the original seed, so the stale pending PATCH still
  // fires — exactly the spurious post-discard `ui_config` write the
  // bug report flagged.
  const layoutPropRef = useRef<readonly LayoutItem[]>(layout);
  useEffect(() => {
    layoutPropRef.current = layout;
  }, [layout]);

  // Mirror the live `isEditMode` into a ref so the actual PATCH call sites can
  // hard-gate on the *current* edit state, not a stale closure. `flushNow`
  // runs from a debounce `setTimeout` and the teardown cleanup runs detached
  // from render — neither observes the latest `isEditMode` prop, and a
  // Pusher-driven refetch can flip `dashboard.isEditable` (→ `isEditMode`)
  // false while a save is queued. The layout PATCH requires the edit lock, so
  // firing it outside edit mode 409s → "Failed to save layout." toast.
  // Declared before the leave-effect below so the ref is already fresh when
  // that effect runs on the edit-mode transition.
  const isEditModeRef = useRef(isEditMode);
  useEffect(() => {
    isEditModeRef.current = isEditMode;
  }, [isEditMode]);

  const mutation = useMutation({
    mutationFn: (panelLayouts: PanelLayouts) =>
      dashboardService.updateDashboard(dashboardId, {
        ui_config: { panel_layouts: panelLayouts },
      }),
    onSuccess: (response, panelLayouts) => {
      lastSavedRef.current = panelLayouts;
      // A success means the dashboard is genuinely editable again — let a
      // later identical layout retry if it ever fails.
      lastFailedRef.current = null;
      applyMetadataResponseToCache(queryClient, dashboardId, response);
    },
    onError: (error: unknown, panelLayouts: PanelLayouts) => {
      console.error("[useLayoutAutoSave] PATCH failed:", error);
      showToast({
        message: "Failed to save layout. Please try again.",
        variant: "error",
      });
      const status = error instanceof ApiError ? error.statusCode : undefined;
      if (status !== undefined && status >= 400 && status < 500) {
        // A 4xx won't succeed on an identical retry (not in edit mode, invalid
        // payload, forbidden, or gone). Circuit-break this exact layout so
        // auto-fit can't re-fire it into a storm; keep `lastSavedRef` intact so
        // the dedupe guard still holds.
        lastFailedRef.current = panelLayouts;
        if (status === 409) {
          // Not in edit mode (`APP_DASHBOARD_NOT_EDITABLE`). Refetch so a fresh
          // `is_editable: false` disables auto-fit and ends the loop at the
          // source, rather than only suppressing this one layout.
          queryClient.invalidateQueries({
            queryKey: dashboardKeys.detail(dashboardId),
          });
        }
        return;
      }
      // Transient failure (5xx / network / unknown): clear the saved baseline
      // so a subsequent identical layout still retries.
      lastSavedRef.current = null;
    },
  });

  const flushNow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    const next = pendingRef.current;
    if (!next) return;
    pendingRef.current = null;
    // Hard gate: never PATCH the layout outside edit mode. The write needs
    // the edit lock, which only exists in edit mode; a debounce timer armed
    // mid-edit can fire after a Pusher refetch dropped the lock. Drop the
    // pending change rather than 409 → "Failed to save layout." toast.
    if (!isEditModeRef.current) return;
    // No-op when pending matches the last server-confirmed save.
    if (lastSavedRef.current && layoutsEqual(lastSavedRef.current, next)) {
      return;
    }
    // No-op when pending matches what's actually on screen right
    // now. After a discard / save-draft / lock-acquire, the `layout`
    // prop swaps to a different snapshot and any stale `pendingRef`
    // (from the static-toggle RGL reconcile that fired on the prior
    // transition) no longer represents a real user gesture. PATCHing
    // it would either fail the BE lock check or stomp the displayed
    // layout — neither is what the user asked for.
    if (layoutsEqual(toPanelLayouts(layoutPropRef.current), next)) {
      return;
    }
    // Circuit-breaker: don't re-fire a layout the server already rejected.
    // Without this, auto-fit re-reporting the same height delta against a
    // dashboard the BE won't accept produces an unbounded ~1/sec PATCH+toast
    // loop. Cleared by `mutation.onSuccess`.
    if (lastFailedRef.current && layoutsEqual(lastFailedRef.current, next)) {
      return;
    }
    mutation.mutate(next);
  }, [mutation]);

  const handleLayoutChange = useCallback(
    (layout: readonly LayoutItem[]) => {
      // Only forward when the caller actually holds the lock. RGL fires
      // `onLayoutChange` as part of layout-prop reconciliation — after a
      // discard / save-draft refetch swaps the dashboard's layout to a
      // different snapshot, that reconciliation looks like a layout
      // change to us. Without this gate we'd debounce a PATCH that the
      // BE rejects with 409 (no lock). User drags are already gated by
      // RGL's `static: !isEditMode`, and auto-fit only runs inside edit
      // mode too — so nothing legitimate is dropped here.
      if (!isEditMode) return;
      const next = toPanelLayouts(layout);
      pendingRef.current = next;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flushNow, AUTOSAVE_DEBOUNCE_MS);
    },
    [flushNow, isEditMode],
  );

  // Leaving edit mode: discard any un-flushed drag instead of saving it. The
  // layout PATCH needs the edit lock, which is already gone once we're out of
  // edit mode (explicit save/discard, or a Pusher refetch that reassigned or
  // expired the lock). Cancel the debounce and clear pending so the armed
  // timer can't fire a doomed PATCH. `flushNow`'s edit-mode gate is the
  // race-proof backstop; this is the prompt cleanup. Also reset the
  // circuit-breaker so the next edit session starts clean — a layout that was
  // rejected in a prior session shouldn't stay suppressed after re-entering.
  useEffect(() => {
    if (isEditMode) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    pendingRef.current = null;
    lastFailedRef.current = null;
  }, [isEditMode]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const pending = pendingRef.current;
      // Clear pending so a `dashboardId`-prop change (which re-runs this
      // effect without unmounting) can't leak the old dashboard's layout
      // into the new one's mutation.
      pendingRef.current = null;
      if (!pending) return;
      // Hard gate: only persist on teardown while we still hold edit mode (and
      // thus the lock). Reading the ref (not a closure) keeps this correct for
      // the `dashboardId`-change re-run, which fires before the next render
      // syncs the ref — so it reflects the edit state of the dashboard being
      // torn down.
      if (!isEditModeRef.current) return;
      if (lastSavedRef.current && layoutsEqual(lastSavedRef.current, pending)) {
        return;
      }
      // Fire-and-forget on unmount. Errors will only appear in the console —
      // users won't see a toast for a tab they just closed. `queryClient`
      // outlives the component, so applying the response here (same as
      // `onSuccess`) keeps the metadata/render cache in sync even though we
      // bypass the mutation observer's `onSuccess`.
      dashboardService
        .updateDashboard(dashboardId, {
          ui_config: { panel_layouts: pending },
        })
        .then((response) => {
          applyMetadataResponseToCache(queryClient, dashboardId, response);
        })
        .catch((error) => {
          console.error("[useLayoutAutoSave] unmount PATCH failed:", error);
        });
    },
    [dashboardId, queryClient],
  );

  return { handleLayoutChange, isSaving: mutation.isPending };
}
