import { apiClient } from "./apiClient";
import type {
  DashboardMetadataResponse,
  WidgetDataRequest,
  WidgetDataResponse,
  PanelRenderRequest,
  PanelRenderResponse,
  DrilldownV2Request,
  DrilldownV2Response,
  ScheduleConfigRequest,
  DashboardScheduleResponse,
  FilterPatchPayload,
  FilterPatchResponse,
} from "../types/dashboard";

/**
 * Summary item returned by the dashboard list endpoint.
 */
export interface DashboardListItem {
  dashboard_id: string;
  dashboard_name: string;
  status: "draft" | "published" | "archived";
  dashboard_version: number;
  /** @deprecated Use `access_level === "owner"` (BE M2 — VON-1283). */
  is_owner: boolean;
  /** @deprecated Use `scope === "tenant"` (BE M2 — VON-1283). */
  is_shared_with_tenant: boolean;
  /** Caller's resolved level on this dashboard (M2). */
  access_level?: "viewer" | "editor" | "owner";
  /** Sharing scope (M2). */
  scope?: "restricted" | "tenant";
  /** Current edit-lock holder (M1). `null` when nobody holds the lock.
   *  `user_grants` is intentionally NOT on list items — fetch the metadata
   *  endpoint when the full roster is needed. */
  edit_lock?: { user_id: string; acquired_at: string } | null;
  updated_at: string;
}

export interface DashboardListResponse {
  data: DashboardListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface DashboardUpdateRequest {
  dashboard_name?: string;
  description?: string;
  is_editable?: boolean;
  ui_config?: {
    [key: string]: unknown;
  };
}

/**
 * Wire shape for a single row in the `GET /versions` response (M1 —
 * VON-1282). Both `drafts` and `published` arrays carry this row;
 * `status` discriminates between them. Server-controlled sort
 * (descending by `dashboard_version`); FE must not re-sort.
 */
export interface DashboardVersionEntry {
  id: string;
  /**
   * Float — drafts are decimals (e.g. 3.0001), published are integers
   * (e.g. 3). FE only uses this for stable identity / sort visualisation.
   */
  dashboard_version: number;
  /** Published lineage this row belongs to. `null` on pre-migration rows. */
  published_version: number | null;
  /** Save Draft sequence within the lineage; `null` on the active draft. */
  draft_save_seq: number | null;
  status: "draft" | "draft_saved" | "published";
  change_summary: string | null;
  /** ISO datetime — `null` on edge-case pre-migration rows. */
  updated_at: string | null;
  /** Author user_id — `null` when the row pre-dates author tracking. */
  updated_by: string | null;
}

export interface DashboardVersionsResponse {
  dashboard_id: string;
  /**
   * `status: "draft"` (singleton active editing slot) followed by
   * `status: "draft_saved"` history rows for the current lineage.
   */
  drafts: DashboardVersionEntry[];
  /**
   * Singleton currently-live `status: "published"` row. Empty array when
   * the dashboard has never been published. Archived rows are excluded.
   */
  published: DashboardVersionEntry[];
}

/**
 * Wire shape for the unified `POST /share` endpoint introduced in M2
 * (VON-1283). The backend treats this as a full-state replace:
 *   - `user_grants` is the complete desired list; omissions drop grants.
 *     `null` and `[]` are both "no grants" (clears all explicit access).
 *   - `is_shared_with_tenant` stays on the request body during the
 *     rollout window per the BE handoff — backend derives the canonical
 *     `scope` enum from it (`true` → "tenant" / `false` → "restricted").
 *     The eventual cleanup PR (§3.5) will swap this for a `scope` field;
 *     that is the only breaking step still pending.
 *   - `shared_data_scope` applies only to viewers (and tenant-scope
 *     users); editor+ is required to change it.
 */
export interface DashboardUserGrantRequest {
  user_id: string;
  role: "editor" | "viewer";
}

export interface ShareDashboardV2Request {
  is_shared_with_tenant: boolean;
  user_grants: DashboardUserGrantRequest[] | null;
  shared_data_scope?: string | null;
}

/**
 * Flat wire shape returned by `POST /api/v1/dashboards/{id}/draft/save`
 * (M1 — VON-1282). Mirrors
 * `app/api/v1/schemas/dashboard_schemas.py::DashboardSaveDraftResponse`
 * verbatim. The four post-save state fields (`is_editable`,
 * `editable_version`, `latest_published_version`, `edit_lock`) are
 * intentionally redundant with a follow-up `GET /metadata`: returning
 * them inline lets the FE refresh the dashboard render without a
 * second round-trip.
 */
export interface DashboardSaveDraftApiResponse {
  dashboard_id: string;
  dashboard_version: number | null;
  saved: boolean;
  is_editable: boolean;
  editable_version: number | null;
  latest_published_version: number | null;
  edit_lock: { user_id: string; acquired_at: string } | null;
}

/**
 * Flat wire shape returned by `GET /api/v1/dashboards/{id}/metadata`
 * (and by every endpoint that returns `DashboardMetadataResponse` server
 * side — share, publish, revert, update, archive, etc.). Mirrors
 * `app/api/v1/schemas/dashboard_schemas.py::DashboardMetadataResponse`
 * verbatim.
 *
 * Distinct from the wrapped FE `DashboardMetadataResponse` type in
 * `types/dashboard.ts` — that one is a render-style `{ success, data: {
 * dashboard, refreshInfo } }` envelope and does **not** match the wire
 * payload here. Use this flat shape for share-state reads.
 */
export interface DashboardMetadataApiResponse {
  dashboard_id: string;
  dashboard_name: string;
  description: string | null;
  access_level: "viewer" | "editor" | "owner";
  is_editable: boolean;
  /** Version FE should render when the caller holds the edit lock. */
  editable_version: number | null;
  /** Version FE should render when the caller is in read mode. */
  latest_published_version: number | null;
  edit_lock: { user_id: string; acquired_at: string } | null;
  scope: "restricted" | "tenant";
  user_grants: Array<{
    user_id: string;
    role: "viewer" | "editor";
    granted_by: string;
    granted_at: string;
  }>;
  is_shared_with_tenant: boolean;
  shared_data_scope: string | null;
  workflow_definition_id: string | null;
  workflow_execution_id: string | null;
  conversation_id: string | null;
  last_refreshed_at: string | null;
  created_by: string;
  created_at: string | null;
  updated_at: string | null;
  dashboard_version: number | null;
  status: string | null;
  configuration: Record<string, unknown> | null;
  change_summary: string | null;
  /** BE PR #1109 — last meaningful editor (commit / publish / discard).
   *  `null` on pre-deploy dashboards until their next lifecycle event. */
  last_edited_by?: string | null;
  /** Timestamp of the last meaningful edit — pairs with `last_edited_by`.
   *  Drives the EditLockBadge's relative-time chip ("Edited 5m ago").
   *  `null` on pre-deploy dashboards; the badge falls back to the lock's
   *  `acquired_at` when this is missing so something coherent still
   *  renders. */
  last_edited_at?: string | null;
}

/**
 * Service for dashboard API endpoints.
 */
class DashboardService {
  /**
   * List dashboards with optional status filter.
   * Scoped by backend access rules (owner, shared_with_tenant, shared_with_users).
   */
  async getDashboards(
    status?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<DashboardListResponse> {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("limit", String(limit));
    return apiClient.get<DashboardListResponse>(
      `/api/v1/dashboards?${params.toString()}`,
    );
  }

  async getDashboardWithRenderData(
    dashboardId: string,
    version?: number | null,
  ) {
    // The BE accepts `?version=<float>` and returns that exact snapshot.
    // FE now drives this from the metadata response: `editable_version` when
    // the caller holds the lock, `latest_published_version` otherwise.
    // Omitted entirely (no `?version=`) when null/undefined so the BE falls
    // back to its "latest" default, matching legacy behavior.
    const qs =
      version !== undefined && version !== null ? `?version=${version}` : "";
    return apiClient.get(`/api/v1/dashboards/${dashboardId}/render${qs}`);
  }

  /**
   * Fetch the sharing/lock-focused metadata payload — flat response,
   * cheap (no widgets / queries). Used by the share dialog so every
   * open re-reads the authoritative sharing state instead of relying on
   * cached render data, which can drift if another collaborator changed
   * access while this tab was idle.
   */
  async getDashboardMetadata(
    dashboardId: string,
  ): Promise<DashboardMetadataApiResponse> {
    return apiClient.get<DashboardMetadataApiResponse>(
      `/api/v1/dashboards/${dashboardId}/metadata`,
    );
  }

  async getWidgetData(
    dashboardId: string,
    request: WidgetDataRequest,
  ): Promise<WidgetDataResponse> {
    return apiClient.post<WidgetDataResponse>(
      `/api/v1/dashboards/${dashboardId}/widgets/data`,
      request,
    );
  }

  async triggerRefresh(dashboardId: string): Promise<{ jobId: string }> {
    return apiClient.post<{ jobId: string }>(
      `/api/v1/dashboards/${dashboardId}/refresh`,
    );
  }

  async getRefreshStatus(
    dashboardId: string,
  ): Promise<{ refreshStatus: string; lastRefreshedAt: string }> {
    return apiClient.get(`/api/v1/dashboards/${dashboardId}/refresh-status`);
  }

  /**
   * Fetch the dashboard's version history (M1 — VON-1282). Split into
   * `drafts` (the active draft + `draft_saved` snapshots) and
   * `published` (the singleton live published row). Both lists are
   * sorted server-side by `dashboard_version` descending.
   */
  async getVersions(dashboardId: string): Promise<DashboardVersionsResponse> {
    return apiClient.get<DashboardVersionsResponse>(
      `/api/v1/dashboards/${dashboardId}/versions`,
    );
  }

  /**
   * Acquire the dashboard's edit lock (M1 — VON-1281). On success the
   * caller becomes the exclusive editor — only they can autosave / Save
   * Draft / Discard / Publish until the lock is released.
   *
   * Error codes (409):
   *   - `APP_DASHBOARD_LOCK_HELD_BY_OTHER` — another user holds the lock.
   *   - `APP_DASHBOARD_LOCK_ALREADY_HELD`  — caller already holds it.
   */
  async acquireEditLock(dashboardId: string): Promise<{
    dashboard_id: string;
    /** @deprecated Prefer `edit_lock.user_id` — same value, canonical shape. */
    user_id: string;
    /** @deprecated Prefer `edit_lock.acquired_at` — same value, canonical shape. */
    acquired_at: string;
    editable_version: number | null;
    latest_published_version: number | null;
    /**
     * Canonical nested lock object (BE PR #1109). Mirrors the shape on
     * the other dashboard surfaces (metadata / render) so the FE can
     * write it straight into those caches without re-shaping.
     */
    edit_lock?: { user_id: string; acquired_at: string } | null;
    /**
     * Last meaningful editor at the time the lock was acquired
     * (BE PR #1109). Lets the FE refresh the EditLockBadge
     * attribution without a follow-up /metadata round-trip.
     */
    last_edited_by?: string | null;
    /** Timestamp of the last meaningful edit — pairs with
     *  `last_edited_by` and drives the chip's relative-time copy. */
    last_edited_at?: string | null;
  }> {
    return apiClient.post<{
      dashboard_id: string;
      user_id: string;
      acquired_at: string;
      editable_version: number | null;
      latest_published_version: number | null;
      edit_lock?: { user_id: string; acquired_at: string } | null;
      last_edited_by?: string | null;
      last_edited_at?: string | null;
    }>(`/api/v1/dashboards/${dashboardId}/lock`);
  }

  /**
   * Release the dashboard's edit lock (M1 — VON-1281). Holder-only and
   * idempotent (204 when no lock is set).
   */
  async releaseEditLock(dashboardId: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/dashboards/${dashboardId}/lock`);
  }

  /**
   * Discard the active draft (M1 — VON-1282). If the active had edits
   * the BE soft-deletes it (status="discarded", `is_deleted=true`),
   * clears `latest_draft_version`, and releases the lock. If the active
   * was an unedited clone the BE just releases the lock. 204 either way.
   *
   * Errors (409):
   *   - `APP_DASHBOARD_LOCK_REQUIRED`     — caller doesn't hold a lock.
   *   - `APP_DASHBOARD_LOCK_HELD_BY_OTHER` — another user holds it.
   */
  async discardDraft(dashboardId: string): Promise<void> {
    return apiClient.post<void>(
      `/api/v1/dashboards/${dashboardId}/draft/discard`,
    );
  }

  /**
   * Save the active draft as a snapshot (M1 — VON-1282). BE freezes the
   * active draft as a `draft_saved` history row, inserts a fresh
   * unedited clone, and releases the lock. `saved=false` means the
   * active was an unedited clone — lock still released, no snapshot.
   *
   * The four post-save state fields mirror what a follow-up metadata
   * fetch would return, so the FE can update its cache in a single
   * round-trip and re-render with the right version.
   *
   * Errors (409):
   *   - `APP_DASHBOARD_LOCK_REQUIRED`     — caller doesn't hold a lock.
   *   - `APP_DASHBOARD_LOCK_HELD_BY_OTHER` — another user holds it.
   */
  async saveDraft(dashboardId: string): Promise<DashboardSaveDraftApiResponse> {
    return apiClient.post<DashboardSaveDraftApiResponse>(
      `/api/v1/dashboards/${dashboardId}/draft/save`,
    );
  }

  /**
   * Unified share endpoint (M2 — VON-1283). Sends the full desired sharing
   * state in one round-trip: scope + complete user_grants list + data scope.
   * Owner-only on the backend; non-owners receive 403.
   */
  async shareDashboardV2(
    dashboardId: string,
    payload: ShareDashboardV2Request,
  ): Promise<DashboardMetadataResponse> {
    return apiClient.post<DashboardMetadataResponse>(
      `/api/v1/dashboards/${dashboardId}/share`,
      payload,
    );
  }

  async publishDashboard(
    dashboardId: string,
    version?: number,
  ): Promise<DashboardMetadataResponse> {
    const params = version != null ? `?version=${version}` : "";
    return apiClient.post<DashboardMetadataResponse>(
      `/api/v1/dashboards/${dashboardId}/publish${params}`,
    );
  }

  async renderPanels(
    dashboardId: string,
    request: PanelRenderRequest,
  ): Promise<PanelRenderResponse> {
    return apiClient.post<PanelRenderResponse>(
      `/api/v1/dashboards/${dashboardId}/panels/render`,
      request,
    );
  }

  async updateDashboard(
    dashboardId: string,
    data: DashboardUpdateRequest,
  ): Promise<DashboardMetadataResponse> {
    return apiClient.patch<DashboardMetadataResponse>(
      `/api/v1/dashboards/${dashboardId}`,
      data,
    );
  }

  /**
   * Drilldown — pyramid model with variants, justifications, and
   * cumulative drill_filters across the click chain.
   *
   * Every panel authored by the current dashboard-creation flow has
   * ``drilldown_v2`` populated; the V1 endpoint at
   * ``/panels/drilldown`` is deprecated and may still exist on the
   * backend for legacy support but is no longer reachable from this FE.
   */
  async drilldownPanelV2(
    dashboardId: string,
    request: DrilldownV2Request,
  ): Promise<DrilldownV2Response> {
    return apiClient.post<DrilldownV2Response>(
      `/api/v1/dashboards/${dashboardId}/panels/drilldown/v2`,
      request,
    );
  }

  // ─── Schedule ───────────────────────────────────────────────────

  async getSchedule(dashboardId: string): Promise<DashboardScheduleResponse> {
    return apiClient.get<DashboardScheduleResponse>(
      `/api/v1/dashboards/${dashboardId}/schedule`,
    );
  }

  async createSchedule(
    dashboardId: string,
    config: ScheduleConfigRequest,
  ): Promise<DashboardScheduleResponse> {
    return apiClient.post<DashboardScheduleResponse>(
      `/api/v1/dashboards/${dashboardId}/schedule`,
      config,
    );
  }

  async updateSchedule(
    dashboardId: string,
    config: Partial<ScheduleConfigRequest>,
  ): Promise<DashboardScheduleResponse> {
    return apiClient.patch<DashboardScheduleResponse>(
      `/api/v1/dashboards/${dashboardId}/schedule`,
      config,
    );
  }

  async pauseSchedule(dashboardId: string): Promise<DashboardScheduleResponse> {
    return apiClient.post<DashboardScheduleResponse>(
      `/api/v1/dashboards/${dashboardId}/schedule/pause`,
    );
  }

  async resumeSchedule(
    dashboardId: string,
  ): Promise<DashboardScheduleResponse> {
    return apiClient.post<DashboardScheduleResponse>(
      `/api/v1/dashboards/${dashboardId}/schedule/resume`,
    );
  }

  async deleteDashboard(dashboardId: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/dashboards/${dashboardId}`);
  }

  async deleteSchedule(dashboardId: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/dashboards/${dashboardId}/schedule`);
  }

  // ─── Filters ────────────────────────────────────────────────────

  /**
   * PATCH /api/v1/dashboards/{id}/filters
   *
   * v2 additions:
   * - `panelId`: when present, the update is scoped to that panel's `panel_state`.
   * - `isLocked`: owner-only default for all filters in the payload. Individual
   *   `FilterValue.is_locked` in the payload overrides this default.
   */
  async updateFilters(
    dashboardId: string,
    filters?: FilterPatchPayload | null,
    resetFields?: string[],
    opts?: {
      panelId?: string;
      isLocked?: boolean;
      /**
       * `dashboard_version` of the snapshot currently rendered. Sent
       * on every PATCH (default view + version-history preview) so the
       * BE always knows which version the edit targets. Omitted when
       * null/undefined.
       */
      dashboardVersion?: number | null;
    },
  ): Promise<FilterPatchResponse> {
    const body: Record<string, unknown> = {};
    if (filters) body.filters = filters;
    if (resetFields?.length) body.reset_fields = resetFields;
    if (opts?.panelId) body.panel_id = opts.panelId;
    if (opts?.isLocked !== undefined) body.is_locked = opts.isLocked;
    if (
      opts?.dashboardVersion !== undefined &&
      opts.dashboardVersion !== null
    ) {
      body.dashboard_version = opts.dashboardVersion;
    }
    return apiClient.patch<FilterPatchResponse>(
      `/api/v1/dashboards/${dashboardId}/filters`,
      body,
    );
  }

  async resetFilters(dashboardId: string): Promise<FilterPatchResponse> {
    return apiClient.post<FilterPatchResponse>(
      `/api/v1/dashboards/${dashboardId}/filters/reset`,
    );
  }
}

export const dashboardService = new DashboardService();
