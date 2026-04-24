import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { LayoutItem } from "@vonlabs/design-components";
import { dashboardService } from "../services/dashboardService";
import { dashboardKeys } from "./useDashboardQuery";
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
 * Persists drag/resize changes to `ui_config.panel_layouts` via PATCH.
 * Debounces consecutive changes so a single drag gesture fires one PATCH.
 *
 * The hook is intentionally stateless w.r.t. positions — react-grid-layout
 * owns the in-flight layout; we just forward the final shape server-side.
 */
export function useLayoutAutoSave(dashboardId: string, isEditMode: boolean) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pendingRef = useRef<PanelLayouts | null>(null);
  const lastSavedRef = useRef<PanelLayouts | null>(null);

  const mutation = useMutation({
    mutationFn: async (panelLayouts: PanelLayouts) => {
      await dashboardService.updateDashboard(dashboardId, {
        ui_config: { panel_layouts: panelLayouts },
      });
    },
    onSuccess: (_, panelLayouts) => {
      lastSavedRef.current = panelLayouts;
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
    },
    onError: (error: unknown) => {
      console.error("[useLayoutAutoSave] PATCH failed:", error);
      showToast({
        message: "Failed to save layout. Please try again.",
        variant: "error",
      });
      // Reset lastSaved so a subsequent identical layout still retries.
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
    if (lastSavedRef.current && layoutsEqual(lastSavedRef.current, next)) {
      return;
    }
    mutation.mutate(next);
  }, [mutation]);

  const handleLayoutChange = useCallback(
    (layout: readonly LayoutItem[]) => {
      if (!isEditMode) return;
      const next = toPanelLayouts(layout);
      pendingRef.current = next;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flushNow, AUTOSAVE_DEBOUNCE_MS);
    },
    [isEditMode, flushNow],
  );

  // Flush any pending change when leaving edit mode or unmounting, so the
  // server always ends up in sync with the last user gesture.
  useEffect(() => {
    if (!isEditMode) flushNow();
  }, [isEditMode, flushNow]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const pending = pendingRef.current;
      if (!pending) return;
      if (lastSavedRef.current && layoutsEqual(lastSavedRef.current, pending)) {
        return;
      }
      // Fire-and-forget on unmount. Errors will only appear in the console —
      // users won't see a toast for a tab they just closed.
      dashboardService
        .updateDashboard(dashboardId, {
          ui_config: { panel_layouts: pending },
        })
        .catch((error) => {
          console.error("[useLayoutAutoSave] unmount PATCH failed:", error);
        });
    },
    [dashboardId],
  );

  return { handleLayoutChange, isSaving: mutation.isPending };
}
