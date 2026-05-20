import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useVisibilityToggle } from "@vonlabs/design-components";
import {
  dashboardService,
  type DashboardMetadataApiResponse,
  type ShareDashboardV2Request,
} from "../services/dashboardService";
import { ApiError } from "../services/apiClient";
import { dashboardKeys } from "./useDashboardQuery";
import { dashboardMetadataKey } from "./useDashboardMetadata";
import { folderKeys } from "./folders";
import { useMutationPhase } from "./useMutationPhase";
import { useToast } from "./useToast";
import type {
  Dashboard,
  DashboardUserGrant,
  RefreshInfo,
} from "../types/dashboard";

/**
 * Local mirror of `useDashboardQuery`'s cached shape. The query stores
 * the adapted `{ dashboard, refreshInfo, activeFilters }` tuple directly
 * (not wrapped in a `data` envelope), so optimistic writes have to match.
 */
interface DashboardQueryCacheShape {
  dashboard: Dashboard;
  refreshInfo: RefreshInfo;
  activeFilters: Record<string, unknown>;
}

const SAVE_TOAST_DURATION_MS = 3000;

/**
 * Hook that provides all action handlers for AnalyticsView toolbar.
 * Used by both the Analytics page and DashboardPreviewPane.
 */
export function useAnalyticsTools(dashboardId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // ─── Save ─────────────────────────────────────────────────────
  // The in-canvas top-center toast is shared by two flows now:
  //   - Publish first time (handleSave + isFirstSave) → "Dashboard is created …"
  //   - Publish subsequent  (handleSave)              → "Published. Your changes …"
  //   - Save as draft       (handleSaveDraft)         → "Draft saved. Editors or owners …"
  // `saveToastKindRef` + `isFirstSaveRef` together pick the copy. Both
  // are refs (not state) because `showSaveToast` is the visibility
  // flag that drives re-renders — flipping it already re-runs the
  // caller with the latest `current` values.
  const saveToastKindRef = useRef<"publish" | "draft">("publish");
  const isFirstSaveRef = useRef(false);
  const {
    isVisible: showSaveToast,
    show: showToastNow,
    hide: hideToastNow,
  } = useVisibilityToggle(false);
  const saveToastTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(saveToastTimerRef.current), []);

  const saveMutation = useMutation({
    mutationFn: async (version?: number) => {
      await dashboardService.publishDashboard(dashboardId, version);
      await queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
    },
    onSuccess: () => {
      // Refresh the sidebar's unfiled-dashboards + every folder's contents
      // since publishing a dashboard can flip its `status` (draft → published)
      // and that can change which subset surfaces.
      queryClient.invalidateQueries({
        queryKey: folderKeys.unfiled("dashboard"),
      });
      queryClient.invalidateQueries({
        queryKey: [...folderKeys.all, "contents"],
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
    },
  });

  const handleSave = useCallback(
    ({
      isFirstSave,
      onSuccess,
    }: { isFirstSave?: boolean; onSuccess?: () => void } = {}) => {
      isFirstSaveRef.current = isFirstSave ?? false;
      saveMutation.mutate(undefined, {
        onSuccess: () => {
          onSuccess?.();
          saveToastKindRef.current = "publish";
          showToastNow();
          clearTimeout(saveToastTimerRef.current);
          saveToastTimerRef.current = setTimeout(
            hideToastNow,
            SAVE_TOAST_DURATION_MS,
          );
        },
        onError: (error) => {
          console.error("[useAnalyticsTools] Save failed:", error);
          showToast({
            message: "Failed to save dashboard. Please try again.",
            variant: "error",
          });
        },
      });
    },
    [saveMutation, showToast, showToastNow, hideToastNow],
  );

  const savePhase = useMutationPhase(
    saveMutation.isPending,
    saveMutation.isSuccess,
  );

  // ─── Share — unified scope + user_grants + data-scope ─────────
  //
  // Backend M2 (VON-1283) collapses scope changes, per-user grant edits, and
  // data-scope toggles into a single full-state POST. The share dialog
  // builds the desired state and calls this mutation for every change
  // (add/update/remove grant, scope toggle, data-scope toggle).
  //
  // Backend echoes structured error codes via ApiError; the caller surfaces
  // human messages so the share dialog can localise per code in the future.
  // Render-cache prefix — matches the version-suffixed render queries
  // emitted by `useDashboardQuery` regardless of which version is
  // active. Used with `getQueriesData` / `setQueriesData` so optimistic
  // share-mutation updates don't need to know the current version.
  const renderCachePrefix = [
    ...dashboardKeys.all,
    dashboardId,
    "render",
  ] as const;

  const shareV2Mutation = useMutation<
    Awaited<ReturnType<typeof dashboardService.shareDashboardV2>>,
    Error,
    ShareDashboardV2Request,
    {
      previousRenders: Array<
        readonly [readonly unknown[], DashboardQueryCacheShape | undefined]
      >;
      previousMetadata: DashboardMetadataApiResponse | undefined;
    }
  >({
    mutationFn: (payload) =>
      dashboardService.shareDashboardV2(dashboardId, payload),
    // Sharing changes don't affect widget data, so a network refetch is
    // wasteful. We optimistically update both the dashboard render cache
    // (drives the Created-by chip + outside-modal state) and the
    // metadata cache (drives the open share dialog) so the user sees
    // their change instantly without a flicker behind the modal.
    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
      const previousRenders =
        queryClient.getQueriesData<DashboardQueryCacheShape>({
          queryKey: renderCachePrefix,
        });
      const previousMetadata =
        queryClient.getQueryData<DashboardMetadataApiResponse>(
          dashboardMetadataKey(dashboardId),
        );

      const now = new Date().toISOString();
      const baseGrants =
        previousMetadata?.user_grants ??
        previousRenders.find(([, v]) => v?.dashboard)?.[1]?.dashboard
          .userGrants ??
        [];
      const nextGrants: DashboardUserGrant[] = (payload.user_grants ?? []).map(
        (g) => {
          // Preserve `granted_by` / `granted_at` for unchanged entries
          // (same user_id + same role). Mirrors the BE's diff semantics.
          const unchanged = baseGrants.find(
            (e) => e.user_id === g.user_id && e.role === g.role,
          );
          return (
            unchanged ?? {
              user_id: g.user_id,
              role: g.role,
              granted_by: "",
              granted_at: now,
            }
          );
        },
      );

      queryClient.setQueriesData<DashboardQueryCacheShape>(
        { queryKey: renderCachePrefix },
        (prev) => {
          if (!prev?.dashboard) return prev;
          const nextDashboard: Dashboard = {
            ...prev.dashboard,
            isSharedWithTenant: payload.is_shared_with_tenant,
            scope: payload.is_shared_with_tenant ? "tenant" : "restricted",
            sharedDataScope: (payload.shared_data_scope ??
              null) as Dashboard["sharedDataScope"],
            userGrants: nextGrants,
          };
          return { ...prev, dashboard: nextDashboard };
        },
      );

      if (previousMetadata) {
        const nextMetadata: DashboardMetadataApiResponse = {
          ...previousMetadata,
          scope: payload.is_shared_with_tenant ? "tenant" : "restricted",
          is_shared_with_tenant: payload.is_shared_with_tenant,
          shared_data_scope: payload.shared_data_scope ?? null,
          user_grants: nextGrants,
        };
        queryClient.setQueryData<DashboardMetadataApiResponse>(
          dashboardMetadataKey(dashboardId),
          nextMetadata,
        );
      }

      return { previousRenders, previousMetadata };
    },
    onError: (_err, _payload, context) => {
      // Roll back both optimistic updates — the BE rejected the change.
      if (context?.previousRenders) {
        for (const [key, value] of context.previousRenders) {
          queryClient.setQueryData(key, value);
        }
      }
      if (context?.previousMetadata) {
        queryClient.setQueryData(
          dashboardMetadataKey(dashboardId),
          context.previousMetadata,
        );
      }
    },
    onSuccess: (response) => {
      // The share endpoint returns the same flat metadata payload as
      // GET /metadata. Drop it straight into the metadata cache so the
      // open dialog picks up authoritative `granted_by` / `granted_at`
      // stamps without an extra round-trip. The service's typing still
      // claims the wrapped FE `DashboardMetadataResponse` shape — that's
      // pre-existing tech debt; the runtime payload is flat.
      const flat = response as unknown as DashboardMetadataApiResponse;
      if (flat && typeof flat === "object" && "dashboard_id" in flat) {
        queryClient.setQueryData<DashboardMetadataApiResponse>(
          dashboardMetadataKey(dashboardId),
          flat,
        );
      }

      // Success feedback now lives inside the share modal itself — the
      // dialog reads `shareV2Phase === "success"` to flash an "Access
      // updated" pill at its bottom (matches the Google Sheets pattern
      // and keeps the success cue scoped to the surface where the user
      // just performed the action). The global top-right toast stays
      // wired for errors only.
    },
  });

  const handleShareV2 = useCallback(
    async (payload: ShareDashboardV2Request) => {
      // Serialize: drop new calls while a prior share is in flight.
      // Concurrent mutations would corrupt the rollback context —
      // mutation B's onMutate would snapshot the cache *after* A's
      // optimistic write, so A failing then B succeeding would
      // overwrite B's response with A's pre-state on rollback. The
      // dialog already disables the scope toggle on pending
      // (`isSavingShare`); this guards the per-row paths too. Users
      // see no response for the dropped click and can retry once the
      // spinner clears.
      //
      // Throw (rather than silently resolve) so awaiting callers can
      // distinguish "dropped" from "succeeded". Resolving here was
      // making `handleAddPeopleSubmit` / `handleSavePendingChanges`
      // flash the "Access updated" pill and close the modal even
      // though no mutation actually fired. The dialog's `catch { }`
      // arms already swallow this for the awaiting paths; the
      // non-awaiting per-row handlers in `useDashboardShareV2`
      // explicitly attach `.catch(() => {})` to silence the rejection.
      if (shareV2Mutation.isPending) {
        throw new Error("share_v2_in_flight");
      }
      try {
        await shareV2Mutation.mutateAsync(payload);
      } catch (error) {
        console.error("[useAnalyticsTools] Share V2 failed:", error);
        let message = "Failed to update sharing settings. Please try again.";
        if (error instanceof ApiError) {
          const response = error.response as {
            error?: { code?: string; message?: string };
          };
          const code = response?.error?.code;
          const detail = response?.error?.message ?? "";
          if (code === "APP_DASHBOARD_ACCESS_DENIED") {
            message = "You don't have access to share this dashboard.";
          } else if (code === "APP_DASHBOARD_FORBIDDEN") {
            // BE M2 §3.3 — the message carries a tag like
            // `forbidden_data_scope_change` or
            // `forbidden_editor_operation:<uid>`. Surface the tag-specific
            // message so the user knows exactly why the action was rejected.
            if (detail.includes("forbidden_data_scope_change")) {
              message = "Only editors and the owner can change the data scope.";
            } else if (detail.includes("forbidden_editor_operation")) {
              message =
                "Only editors and the owner can add or remove editor access.";
            } else {
              message =
                detail ||
                "You don't have permission for that change. Refresh to see the latest sharing state.";
            }
          } else if (code === "APP_DASHBOARD_INVALID_GRANTS") {
            message =
              detail ||
              "That grant isn't allowed — check for duplicate users or the owner being in the list.";
          } else if (code === "APP_DASHBOARD_INVALID_SHARE_USER") {
            message = "One of the selected users isn't in your workspace.";
          } else if (code === "APP_DASHBOARD_NOT_FOUND") {
            message = "This dashboard no longer exists.";
          }
        }
        showToast({ message, variant: "error" });
        // Re-throw so callers (e.g. the share dialog's Add-People
        // submit) can distinguish success from failure and act on it
        // — close on success, stay open on error.
        throw error;
      }
    },
    [shareV2Mutation, showToast],
  );

  // 2500ms — long enough for the in-modal "Access updated" pill to
  // read as a deliberate confirmation rather than a flash. The legacy
  // 1500ms default felt rushed once the cue moved off the global
  // top-right toast and into the dialog itself.
  const shareV2Phase = useMutationPhase(
    shareV2Mutation.isPending,
    shareV2Mutation.isSuccess,
    2500,
  );

  // ─── Edit Lock (M1 — VON-1281) ────────────────────────────────
  //
  // The 200 path silently transitions the caller into edit mode
  // (next dashboard refetch carries the new `edit_lock`, which the
  // adapter surfaces as `dashboard.isEditable=true`). The 409
  // `LOCK_HELD_BY_OTHER` path bubbles up so the caller can open the
  // existing EditLockModal. The 409 `ALREADY_HELD` path is benign — we
  // already own the lock — so we treat it as success.
  const acquireLockMutation = useMutation({
    mutationFn: () => dashboardService.acquireEditLock(dashboardId),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
    },
    onSuccess: (response) => {
      // The lock response carries everything needed to flip the FE
      // into edit mode without a follow-up /metadata round-trip:
      // `editable_version` (which snapshot is editable), the canonical
      // nested `edit_lock` object (matches the shape on /metadata and
      // /render), and `last_edited_by` (drives the EditLockBadge
      // attribution). Prefer the nested `edit_lock` when present;
      // fall back to the flat fields for BE deploys that haven't
      // shipped PR #1109 yet.
      const lockObject = response.edit_lock ?? {
        user_id: response.user_id,
        acquired_at: response.acquired_at,
      };

      // Patch the metadata cache so `useDashboardQuery` sees the new
      // editable state. Falls back to a full invalidate when no
      // metadata is cached yet (e.g. initial load raced with Edit).
      const cachedMetadata =
        queryClient.getQueryData<DashboardMetadataApiResponse>(
          dashboardMetadataKey(dashboardId),
        );
      if (cachedMetadata) {
        queryClient.setQueryData<DashboardMetadataApiResponse>(
          dashboardMetadataKey(dashboardId),
          {
            ...cachedMetadata,
            is_editable: true,
            editable_version: response.editable_version,
            latest_published_version:
              response.latest_published_version ??
              cachedMetadata.latest_published_version,
            edit_lock: lockObject,
            // Only overwrite when the lock response carries the field —
            // BE deploys without PR #1109 omit it, in which case the
            // previous value is the freshest we have.
            ...(response.last_edited_by !== undefined && {
              last_edited_by: response.last_edited_by,
            }),
            ...(response.last_edited_at !== undefined && {
              last_edited_at: response.last_edited_at,
            }),
          },
        );
      } else {
        queryClient.invalidateQueries({
          queryKey: dashboardKeys.detail(dashboardId),
        });
      }

      // Patch any cached render entries so `dashboard.editLock` /
      // `dashboard.lastEditedBy` reflect the acquire immediately —
      // the EditLockBadge reads them before the next refetch lands.
      queryClient.setQueriesData<DashboardQueryCacheShape>(
        { queryKey: renderCachePrefix },
        (prev) => {
          if (!prev?.dashboard) return prev;
          return {
            ...prev,
            dashboard: {
              ...prev.dashboard,
              isEditable: true,
              editLock: {
                userId: lockObject.user_id,
                acquiredAt: lockObject.acquired_at,
              },
              ...(response.last_edited_by !== undefined && {
                lastEditedBy: response.last_edited_by,
              }),
              ...(response.last_edited_at !== undefined && {
                lastEditedAt: response.last_edited_at,
              }),
            },
          };
        },
      );

      // Invalidate every render entry under this dashboard. A previous
      // save/discard cycle may have populated the now-active version
      // key with view-mode data (`is_editable: false`); without this
      // invalidate the second Edit-click would serve that stale entry
      // and the UI would stay in view mode despite the lock being held.
      queryClient.invalidateQueries({
        queryKey: [...dashboardKeys.all, dashboardId, "render"],
      });
    },
  });

  const handleAcquireLock = useCallback(
    async (callbacks?: {
      onSuccess?: () => void;
      onHeldByOther?: () => void;
      onUnknownError?: (error: unknown) => void;
    }) => {
      try {
        await acquireLockMutation.mutateAsync();
        // Lock acquired — `onSuccess` runs side effects that should only
        // happen on the 200 path (e.g. opening the chat panel). A 409
        // HELD_BY_OTHER takes the catch branch below instead.
        callbacks?.onSuccess?.();
      } catch (error) {
        const code =
          error instanceof ApiError
            ? (error.response as { error?: { code?: string } })?.error?.code
            : undefined;
        if (code === "APP_DASHBOARD_LOCK_ALREADY_HELD") {
          // No-op — we already hold the lock. Refresh so the FE state
          // catches up if it was stale, then treat as success so the
          // caller's success side effects still run.
          queryClient.invalidateQueries({
            queryKey: dashboardKeys.detail(dashboardId),
          });
          callbacks?.onSuccess?.();
          return;
        }
        if (code === "APP_DASHBOARD_LOCK_HELD_BY_OTHER") {
          // Refresh so the embedded `edit_lock` reflects the new holder,
          // then let the caller surface the modal.
          queryClient.invalidateQueries({
            queryKey: dashboardKeys.detail(dashboardId),
          });
          callbacks?.onHeldByOther?.();
          return;
        }
        console.error("[useAnalyticsTools] Acquire lock failed:", error);
        showToast({
          message: "Couldn't enter edit mode. Please try again.",
          variant: "error",
        });
        callbacks?.onUnknownError?.(error);
      }
    },
    [acquireLockMutation, queryClient, dashboardId, showToast],
  );

  const acquireLockPhase = useMutationPhase(
    acquireLockMutation.isPending,
    acquireLockMutation.isSuccess,
  );

  const releaseLockMutation = useMutation({
    mutationFn: () => dashboardService.releaseEditLock(dashboardId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
    },
  });

  const handleReleaseLock = useCallback(async () => {
    try {
      await releaseLockMutation.mutateAsync();
    } catch (error) {
      console.error("[useAnalyticsTools] Release lock failed:", error);
    }
  }, [releaseLockMutation]);

  // ─── Discard draft (M1 — VON-1282) ───────────────────────────────
  //
  // Owns the `Discard` button in the edit-mode triad. BE soft-deletes
  // the active draft (or just releases the lock for an unedited clone)
  // and returns 204. We invalidate the dashboard detail so the cascade
  // refetch lands the new state — `editLock` clears, `isEditable`
  // flips false, and the published version surfaces back if the draft
  // was the only edited copy.
  const discardDraftMutation = useMutation({
    mutationFn: () => dashboardService.discardDraft(dashboardId),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
      showToast({
        message: "Dashboard reverted to last saved version.",
        variant: "success",
      });
    },
  });

  const handleDiscardDraft = useCallback(async () => {
    try {
      await discardDraftMutation.mutateAsync();
    } catch (error) {
      console.error("[useAnalyticsTools] Discard draft failed:", error);
      const code =
        error instanceof ApiError
          ? (error.response as { error?: { code?: string } })?.error?.code
          : undefined;
      // 409 LOCK_REQUIRED / LOCK_HELD_BY_OTHER both mean "the lock state
      // we showed you is stale" — refetch so the toolbar reconciles
      // (Edit button reappears, triad cluster hides) and the user can
      // recover.
      if (
        code === "APP_DASHBOARD_LOCK_REQUIRED" ||
        code === "APP_DASHBOARD_LOCK_HELD_BY_OTHER"
      ) {
        queryClient.invalidateQueries({
          queryKey: dashboardKeys.detail(dashboardId),
        });
        showToast({
          message:
            code === "APP_DASHBOARD_LOCK_HELD_BY_OTHER"
              ? "Another user is now editing this dashboard."
              : "Your edit session expired. Please re-enter edit mode.",
          variant: "warning",
        });
        return;
      }
      if (code === "APP_DASHBOARD_NOT_FOUND") {
        showToast({
          message: "This dashboard no longer exists.",
          variant: "error",
        });
        return;
      }
      showToast({
        message: "Failed to discard draft. Please try again.",
        variant: "error",
      });
    }
  }, [discardDraftMutation, queryClient, dashboardId, showToast]);

  const discardDraftPhase = useMutationPhase(
    discardDraftMutation.isPending,
    discardDraftMutation.isSuccess,
  );

  // ─── Save draft (M1 — VON-1282) ──────────────────────────────────
  //
  // Owns the `Save as draft` button in the edit-mode triad. The BE
  // freezes the active draft as a `draft_saved` snapshot, inserts a
  // fresh unedited clone, and releases the lock — all in one call. The
  // response carries the post-save `is_editable` (false), version pair,
  // and `edit_lock` (null), so we can write them straight into the
  // metadata cache. That flips `useDashboardQuery`'s version key to
  // `latest_published_version` and the render auto-refetches — no
  // metadata round-trip needed.
  const saveDraftMutation = useMutation({
    mutationFn: () => dashboardService.saveDraft(dashboardId),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
    },
    onSuccess: (response) => {
      const cached = queryClient.getQueryData<DashboardMetadataApiResponse>(
        dashboardMetadataKey(dashboardId),
      );
      if (cached) {
        queryClient.setQueryData<DashboardMetadataApiResponse>(
          dashboardMetadataKey(dashboardId),
          {
            ...cached,
            is_editable: response.is_editable,
            editable_version: response.editable_version,
            latest_published_version: response.latest_published_version,
            edit_lock: response.edit_lock,
          },
        );
      } else {
        queryClient.invalidateQueries({
          queryKey: dashboardKeys.detail(dashboardId),
        });
      }
      // Invalidate every render entry under this dashboard. The version
      // we're about to render at (`latest_published_version`) may
      // already be in the cache from the initial load — without this
      // invalidate it'd be served stale. Forcing a refetch guarantees
      // the user sees the dashboard state as the BE sees it post-save.
      queryClient.invalidateQueries({
        queryKey: [...dashboardKeys.all, dashboardId, "render"],
      });
    },
  });

  const handleSaveDraft = useCallback(async () => {
    try {
      await saveDraftMutation.mutateAsync();
      // Reuse the in-canvas centered toast so success feedback for
      // Save-as-draft matches the Publish surface.
      saveToastKindRef.current = "draft";
      showToastNow();
      clearTimeout(saveToastTimerRef.current);
      saveToastTimerRef.current = setTimeout(
        hideToastNow,
        SAVE_TOAST_DURATION_MS,
      );
    } catch (error) {
      console.error("[useAnalyticsTools] Save draft failed:", error);
      const code =
        error instanceof ApiError
          ? (error.response as { error?: { code?: string } })?.error?.code
          : undefined;
      if (
        code === "APP_DASHBOARD_LOCK_REQUIRED" ||
        code === "APP_DASHBOARD_LOCK_HELD_BY_OTHER"
      ) {
        queryClient.invalidateQueries({
          queryKey: dashboardKeys.detail(dashboardId),
        });
        showToast({
          message:
            code === "APP_DASHBOARD_LOCK_HELD_BY_OTHER"
              ? "Another user is now editing this dashboard."
              : "Your edit session expired. Please re-enter edit mode.",
          variant: "warning",
        });
        return;
      }
      if (code === "APP_DASHBOARD_NOT_FOUND") {
        showToast({
          message: "This dashboard no longer exists.",
          variant: "error",
        });
        return;
      }
      showToast({
        message: "Failed to save draft. Please try again.",
        variant: "error",
      });
    }
  }, [
    saveDraftMutation,
    queryClient,
    dashboardId,
    showToast,
    showToastNow,
    hideToastNow,
  ]);

  const saveDraftPhase = useMutationPhase(
    saveDraftMutation.isPending,
    saveDraftMutation.isSuccess,
  );

  // ─── Refresh ───────────────────────────────────────────────────
  const refreshMutation = useMutation({
    mutationFn: () => dashboardService.triggerRefresh(dashboardId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
    },
    gcTime: 0,
  });

  const handleRefresh = useCallback(async () => {
    try {
      await refreshMutation.mutateAsync();
    } catch (error) {
      console.error("[useAnalyticsTools] Refresh failed:", error);
      if (error instanceof ApiError) {
        const errorCode = (error.response as { error?: { code?: string } })
          ?.error?.code;

        if (errorCode === "APP_DASHBOARD_REFRESH_IN_PROGRESS") {
          showToast({
            message:
              "A refresh is already in progress. Please wait and try again.",
            variant: "warning",
          });
        } else if (errorCode === "APP_DASHBOARD_REFRESH_COOLDOWN") {
          showToast({
            message: error.message,
            variant: "warning",
          });
        } else {
          showToast({
            message: "Failed to refresh dashboard. Please try again.",
            variant: "error",
          });
        }
      } else {
        showToast({
          message: "Failed to refresh dashboard. Please try again.",
          variant: "error",
        });
      }
    }
  }, [refreshMutation, showToast]);

  return {
    handleSave,
    savePhase,
    saveMutation,
    // In-canvas centered toast — same surface for Publish + Save Draft.
    showSaveToast,
    saveToastKind: saveToastKindRef.current,
    isFirstSave: isFirstSaveRef.current,
    handleShareV2,
    shareV2Mutation,
    shareV2Phase,
    handleAcquireLock,
    acquireLockMutation,
    acquireLockPhase,
    handleReleaseLock,
    releaseLockMutation,
    handleDiscardDraft,
    discardDraftMutation,
    discardDraftPhase,
    handleSaveDraft,
    saveDraftMutation,
    saveDraftPhase,
    handleRefresh,
    refreshMutation,
  };
}
