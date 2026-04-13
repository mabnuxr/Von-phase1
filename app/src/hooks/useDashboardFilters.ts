import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import { dashboardKeys } from "./useDashboardQuery";
import { useToast } from "./useToast";
import type {
  DashboardFilterDefinition,
  DashboardFilterState,
  FilterPatchPayload,
  FilterValue,
} from "../types/dashboard";

// ── Types ──────────────────────────────────────────────────────

/** A single active filter in API-native format (v2 includes optional lock + resolved value). */
export interface ActiveFilter {
  operator: string;
  value?: unknown;
  include_blank?: boolean;
  is_locked?: boolean;
  resolved_value?: unknown;
}

/**
 * Local state: filterId → ActiveFilter.
 * Filters not in this map have no user selection.
 */
type FilterLocalState = Record<string, ActiveFilter>;

/** A pending row where the user hasn't picked a field yet. */
export interface PendingRow {
  tempId: string;
}

// ── Helpers ─────────────────────────────────────────────────────

let _nextId = 0;
const tempId = () => `pending_${++_nextId}`;

const NO_VALUE_OPERATORS = new Set(["is_blank", "is_not_blank"]);
const BETWEEN_OPS = new Set(["between", "not_between"]);

function normaliseFilter(val: unknown): ActiveFilter | null {
  if (val === null || val === undefined) return null;

  if (Array.isArray(val)) {
    const items = val as { operator: string; value?: unknown }[];
    if (items.length === 2) {
      const [a, b] = items;
      if (
        (a.operator === "on_or_after" && b.operator === "on_or_before") ||
        (a.operator === "greater_than_or_equal" &&
          b.operator === "less_than_or_equal")
      ) {
        return { operator: "between", value: [a.value, b.value] };
      }
    }
    if (items.length > 0 && items[0].operator) {
      return { operator: items[0].operator, value: items[0].value };
    }
    return null;
  }

  if (typeof val === "object" && val !== null && "operator" in val) {
    const item = val as {
      operator: string;
      value?: unknown;
      include_blank?: boolean;
      is_locked?: boolean;
      resolved_value?: unknown;
    };
    return {
      operator: item.operator,
      ...(item.value !== undefined && { value: item.value }),
      ...(item.include_blank && { include_blank: true }),
      ...(item.is_locked && { is_locked: true }),
      ...(item.resolved_value !== undefined && {
        resolved_value: item.resolved_value,
      }),
    };
  }
  return null;
}

/**
 * Extract ActiveFilter entries from server state.
 * Server sends {operator, value} dicts, arrays of them, or null.
 */
function normaliseServerState(
  serverState: DashboardFilterState | undefined,
): FilterLocalState {
  if (!serverState) return {};
  const out: FilterLocalState = {};
  for (const [key, val] of Object.entries(serverState)) {
    const f = normaliseFilter(val);
    if (f) out[key] = f;
  }
  return out;
}

function normalisePanelState(
  panelState: Record<string, Record<string, FilterValue>> | undefined,
): Record<string, FilterLocalState> {
  if (!panelState) return {};
  const out: Record<string, FilterLocalState> = {};
  for (const [panelId, filters] of Object.entries(panelState)) {
    const normalised: FilterLocalState = {};
    for (const [fid, val] of Object.entries(filters ?? {})) {
      const f = normaliseFilter(val);
      if (f) normalised[fid] = f;
    }
    out[panelId] = normalised;
  }
  return out;
}

/** Deep-compare two FilterLocalState objects. */
function statesEqual(a: FilterLocalState, b: FilterLocalState): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!(key in b)) return false;
    if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) return false;
  }
  return true;
}

function panelStatesEqual(
  a: Record<string, FilterLocalState>,
  b: Record<string, FilterLocalState>,
): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!(key in b)) return false;
    if (!statesEqual(a[key], b[key])) return false;
  }
  return true;
}

function isFilterComplete(filter: ActiveFilter): boolean {
  if (NO_VALUE_OPERATORS.has(filter.operator)) return true;
  if (
    filter.value === undefined ||
    filter.value === null ||
    filter.value === ""
  )
    return false;
  if (Array.isArray(filter.value)) {
    if (filter.value.length === 0) return false;
    if (BETWEEN_OPS.has(filter.operator)) {
      return (
        filter.value.length === 2 &&
        filter.value[0] !== undefined &&
        filter.value[0] !== null &&
        filter.value[0] !== "" &&
        filter.value[1] !== undefined &&
        filter.value[1] !== null &&
        filter.value[1] !== ""
      );
    }
  }
  return true;
}

/** Build a PATCH payload from localState vs serverState. */
function buildPayload(
  local: FilterLocalState,
  server: FilterLocalState,
): FilterPatchPayload {
  const payload: FilterPatchPayload = {};

  // Added or changed
  for (const [filterId, filter] of Object.entries(local)) {
    if (!isFilterComplete(filter)) continue;
    const serverFilter = server[filterId];
    if (
      !serverFilter ||
      JSON.stringify(serverFilter) !== JSON.stringify(filter)
    ) {
      const apiValue: Record<string, unknown> = { operator: filter.operator };
      if (filter.value !== undefined) apiValue.value = filter.value;
      if (filter.include_blank) {
        apiValue.include_blank = true;
      } else if (serverFilter?.include_blank) {
        apiValue.include_blank = false;
      }
      if (filter.is_locked !== undefined) {
        apiValue.is_locked = filter.is_locked;
      } else if (serverFilter?.is_locked) {
        apiValue.is_locked = false;
      }
      payload[filterId] = apiValue as unknown as FilterPatchPayload[string];
    }
  }

  // Removed
  for (const filterId of Object.keys(server)) {
    if (!(filterId in local)) payload[filterId] = null;
  }

  return payload;
}

// ── Hook ────────────────────────────────────────────────────────

export interface UseDashboardFiltersOptions {
  /** Panel-level server state: {panelId: {filterId: FilterValue}}. */
  panelState?: Record<string, Record<string, FilterValue>>;
  /** Dashboard-level owner-locked filters. */
  lockedFilterState?: Record<string, FilterValue>;
  /** Panel-level owner-locked filters: {panelId: {filterId: FilterValue}}. */
  lockedPanelFilterState?: Record<string, Record<string, FilterValue>>;
  /** Whether the current viewer owns the dashboard (controls lock toggle). */
  isOwner?: boolean;
}

/**
 * Manages dashboard filter state with explicit Apply (v2).
 *
 * Scope model:
 * - `filterState` (dashboard-level): applied by `handleFilterChange` / `handleApply`.
 * - `panelFilterState` (per panel): applied by `handlePanelFilterChange` / `handleApply`.
 * - Locked state: owner-only; toggled via `handleCommitLock`, which PATCHes
 *   the filter's current value + is_locked flag immediately (not staged).
 *
 * On Apply, a single PATCH is sent for dashboard-level changes plus one PATCH
 * per dirty panel (backend endpoint accepts one `panel_id` at a time).
 */
export function useDashboardFilters(
  dashboardId: string | undefined,
  definitions: DashboardFilterDefinition[],
  serverState: DashboardFilterState,
  options: UseDashboardFiltersOptions = {},
) {
  const {
    panelState: serverPanelStateRaw,
    lockedFilterState: serverLockedStateRaw,
    lockedPanelFilterState: serverLockedPanelStateRaw,
    isOwner = false,
  } = options;

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Last-known normalised server state
  const serverNormalised = useRef<FilterLocalState>(
    normaliseServerState(serverState),
  );
  const serverPanelNormalised = useRef<Record<string, FilterLocalState>>(
    normalisePanelState(serverPanelStateRaw),
  );
  const serverLockedNormalised = useRef<FilterLocalState>(
    normaliseServerState(serverLockedStateRaw),
  );
  const serverLockedPanelNormalised = useRef<Record<string, FilterLocalState>>(
    normalisePanelState(serverLockedPanelStateRaw),
  );

  // Local working copies
  const [localState, setLocalState] = useState<FilterLocalState>(() =>
    normaliseServerState(serverState),
  );
  const [localPanelState, setLocalPanelState] = useState<
    Record<string, FilterLocalState>
  >(() => normalisePanelState(serverPanelStateRaw));

  const [pendingRows, setPendingRows] = useState<PendingRow[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  // Sync from server on refetch
  useEffect(() => {
    const normalised = normaliseServerState(serverState);
    serverNormalised.current = normalised;
    setLocalState(normalised);
    setPendingRows([]);
    setIsApplying(false);
  }, [serverState]);

  useEffect(() => {
    const normalised = normalisePanelState(serverPanelStateRaw);
    serverPanelNormalised.current = normalised;
    setLocalPanelState(normalised);
  }, [serverPanelStateRaw]);

  useEffect(() => {
    serverLockedNormalised.current = normaliseServerState(serverLockedStateRaw);
  }, [serverLockedStateRaw]);

  useEffect(() => {
    serverLockedPanelNormalised.current = normalisePanelState(
      serverLockedPanelStateRaw,
    );
  }, [serverLockedPanelStateRaw]);

  const safeDefinitions = Array.isArray(definitions) ? definitions : [];

  const mutation = useMutation({
    mutationFn: async (
      calls: Array<{ payload: FilterPatchPayload; panelId?: string }>,
    ) => {
      // Fan out PATCH requests in parallel. Each call targets a different
      // scope (dashboard or a specific panel), so there's no write-ordering
      // concern between them.
      await Promise.all(
        calls.map((call) =>
          dashboardService.updateFilters(
            dashboardId!,
            call.payload,
            undefined,
            call.panelId ? { panelId: call.panelId } : undefined,
          ),
        ),
      );
      if (dashboardId) {
        await queryClient.invalidateQueries({
          queryKey: dashboardKeys.detail(dashboardId),
        });
      }
    },
    onError: () => {
      showToast({
        message: "Failed to apply filters. Please try again.",
        variant: "error",
      });
      setLocalState(serverNormalised.current);
      setLocalPanelState(serverPanelNormalised.current);
      setIsApplying(false);
    },
  });

  // ── Dashboard-level edits ───────────────────────────────────

  const handleFilterChange = useCallback(
    (
      filterId: string,
      operator: string,
      value?: unknown,
      includeBlank?: boolean,
    ) => {
      setLocalState((prev) => {
        const existing = prev[filterId];
        // If this filter is locked and caller is not owner, no-op
        if (existing?.is_locked && !isOwner) return prev;
        const filter: ActiveFilter = {
          operator,
          ...(value !== undefined && { value }),
          ...(includeBlank && { include_blank: true }),
          ...(existing?.is_locked && { is_locked: true }),
        };
        return { ...prev, [filterId]: filter };
      });
    },
    [isOwner],
  );

  const handleRemoveFilter = useCallback(
    (filterId: string) => {
      setLocalState((prev) => {
        const existing = prev[filterId];
        if (existing?.is_locked && !isOwner) return prev;
        const next = { ...prev };
        delete next[filterId];
        return next;
      });
    },
    [isOwner],
  );

  const handleAddFilter = useCallback(() => {
    setPendingRows((prev) => [...prev, { tempId: tempId() }]);
  }, []);

  const handleRemovePendingRow = useCallback((id: string) => {
    setPendingRows((prev) => prev.filter((r) => r.tempId !== id));
  }, []);

  const handleCommitPendingRow = useCallback(
    (_pendingId: string, filterId: string, defaultOperator: string) => {
      setPendingRows((prev) => prev.filter((r) => r.tempId !== _pendingId));
      setLocalState((prev) => ({
        ...prev,
        [filterId]: { operator: defaultOperator },
      }));
    },
    [],
  );

  // ── Panel-level edits ───────────────────────────────────────

  const handlePanelFilterChange = useCallback(
    (
      panelId: string,
      filterId: string,
      operator: string,
      value?: unknown,
      includeBlank?: boolean,
    ) => {
      setLocalPanelState((prev) => {
        const panel = prev[panelId] ?? {};
        const existing = panel[filterId];
        if (existing?.is_locked && !isOwner) return prev;
        const filter: ActiveFilter = {
          operator,
          ...(value !== undefined && { value }),
          ...(includeBlank && { include_blank: true }),
          ...(existing?.is_locked && { is_locked: true }),
        };
        return { ...prev, [panelId]: { ...panel, [filterId]: filter } };
      });
    },
    [isOwner],
  );

  const handleResetPanelFilter = useCallback(
    (panelId: string, filterId: string) => {
      setLocalPanelState((prev) => {
        const panel = prev[panelId];
        if (!panel || !(filterId in panel)) return prev;
        const existing = panel[filterId];
        if (existing?.is_locked && !isOwner) return prev;
        const rest = { ...panel };
        delete rest[filterId];
        if (Object.keys(rest).length === 0) {
          const pRest = { ...prev };
          delete pRest[panelId];
          return pRest;
        }
        return { ...prev, [panelId]: rest };
      });
    },
    [isOwner],
  );

  // ── Lock commit (owner-only, immediate) ─────────────────────
  //
  // Per-filter lock is committed immediately — clicking "Lock" in a filter's
  // popover behaves like Apply for that filter plus any other pending edits:
  // it PATCHes the current value with `is_locked` set, rather than staging
  // the flag for a later Apply. Locking requires the filter to have a
  // complete/valid value (same rule as Apply). Unlocking has no validity
  // requirement — it just clears the lock.

  const canLockFilter = useCallback(
    (filterId: string): boolean => {
      const f = localState[filterId];
      return f ? isFilterComplete(f) : false;
    },
    [localState],
  );

  const handleCommitLock = useCallback(
    (filterId: string, locked: boolean) => {
      if (!dashboardId || !isOwner) return;
      const target = localState[filterId];
      // Locking requires a complete filter value; unlocking does not.
      if (locked) {
        if (!target || !isFilterComplete(target)) return;
      } else if (!target) {
        // Nothing to unlock — no-op.
        return;
      }

      // Apply the lock override onto a copy of local state, then build the
      // full payload the same way handleApply does. Any other pending edits
      // flush alongside the lock so state stays consistent after refetch.
      const overridden: FilterLocalState = {
        ...localState,
        [filterId]: { ...target!, is_locked: locked },
      };

      const calls: Array<{ payload: FilterPatchPayload; panelId?: string }> =
        [];
      const dashPayload = buildPayload(overridden, serverNormalised.current);
      if (Object.keys(dashPayload).length > 0) {
        calls.push({ payload: dashPayload });
      }

      const allPanelIds = new Set([
        ...Object.keys(localPanelState),
        ...Object.keys(serverPanelNormalised.current),
      ]);
      for (const panelId of allPanelIds) {
        const localPanel = localPanelState[panelId] ?? {};
        const serverPanel = serverPanelNormalised.current[panelId] ?? {};
        const payload = buildPayload(localPanel, serverPanel);
        if (Object.keys(payload).length > 0) calls.push({ payload, panelId });
      }

      if (calls.length === 0) return;
      setIsApplying(true);
      mutation.mutate(calls);
    },
    [dashboardId, isOwner, localState, localPanelState, mutation],
  );

  // ── Effective state for display (client-side resolution) ────

  const getEffectivePanelState = useCallback(
    (panelId: string): FilterLocalState => {
      // Order: dashboard state → panel state → dashboard locked → panel locked
      const base: FilterLocalState = { ...localState };
      const panelOverrides = localPanelState[panelId] ?? {};
      const dashLocked = serverLockedNormalised.current;
      const panelLocked = serverLockedPanelNormalised.current[panelId] ?? {};
      return {
        ...base,
        ...panelOverrides,
        ...dashLocked,
        ...panelLocked,
      };
    },
    [localState, localPanelState],
  );

  // ── Apply ───────────────────────────────────────────────────

  const handleApply = useCallback(() => {
    if (!dashboardId) return;

    const calls: Array<{ payload: FilterPatchPayload; panelId?: string }> = [];

    const dashPayload = buildPayload(localState, serverNormalised.current);
    if (Object.keys(dashPayload).length > 0) {
      calls.push({ payload: dashPayload });
    }

    const allPanelIds = new Set([
      ...Object.keys(localPanelState),
      ...Object.keys(serverPanelNormalised.current),
    ]);
    for (const panelId of allPanelIds) {
      const local = localPanelState[panelId] ?? {};
      const server = serverPanelNormalised.current[panelId] ?? {};
      const payload = buildPayload(local, server);
      if (Object.keys(payload).length > 0) {
        calls.push({ payload, panelId });
      }
    }

    if (calls.length === 0) return;
    setIsApplying(true);
    mutation.mutate(calls);
  }, [dashboardId, localState, localPanelState, mutation]);

  // ── Clear all ───────────────────────────────────────────────

  const handleClearAll = useCallback(() => {
    if (!dashboardId) return;

    const calls: Array<{ payload: FilterPatchPayload; panelId?: string }> = [];

    const dashPayload: FilterPatchPayload = {};
    for (const filterId of Object.keys(serverNormalised.current)) {
      // Preserve locked filters (only owner can clear locks; clear all is not a lock change)
      if (serverNormalised.current[filterId].is_locked && !isOwner) continue;
      dashPayload[filterId] = null;
    }
    if (Object.keys(dashPayload).length > 0) {
      calls.push({ payload: dashPayload });
    }

    for (const [panelId, panel] of Object.entries(
      serverPanelNormalised.current,
    )) {
      const panelPayload: FilterPatchPayload = {};
      for (const filterId of Object.keys(panel)) {
        if (panel[filterId].is_locked && !isOwner) continue;
        panelPayload[filterId] = null;
      }
      if (Object.keys(panelPayload).length > 0) {
        calls.push({ payload: panelPayload, panelId });
      }
    }

    setLocalState((prev) => {
      const next: FilterLocalState = {};
      for (const [fid, f] of Object.entries(prev)) {
        if (f.is_locked && !isOwner) next[fid] = f;
      }
      return next;
    });
    setLocalPanelState({});
    setPendingRows([]);

    if (calls.length > 0) {
      setIsApplying(true);
      mutation.mutate(calls);
    }
  }, [dashboardId, isOwner, mutation]);

  // ── Derived flags ───────────────────────────────────────────

  const filters = Object.values(localState);
  const activeCount = filters.filter(isFilterComplete).length;
  const allFiltersValid = filters.every(isFilterComplete);
  const allPanelFiltersValid = Object.values(localPanelState).every((p) =>
    Object.values(p).every(isFilterComplete),
  );

  const isDirty = useMemo(
    () =>
      !statesEqual(localState, serverNormalised.current) ||
      !panelStatesEqual(localPanelState, serverPanelNormalised.current),
    [localState, localPanelState],
  );

  const canApply = isDirty && allFiltersValid && allPanelFiltersValid;

  return {
    definitions: safeDefinitions,
    filterState: localState,
    panelFilterState: localPanelState,
    lockedFilterState: serverLockedNormalised.current,
    lockedPanelFilterState: serverLockedPanelNormalised.current,
    pendingRows,
    activeCount,
    canApply,
    isApplying,
    isOwner,
    handleFilterChange,
    handleRemoveFilter,
    handleAddFilter,
    handleRemovePendingRow,
    handleCommitPendingRow,
    handlePanelFilterChange,
    handleResetPanelFilter,
    handleCommitLock,
    canLockFilter,
    getEffectivePanelState,
    handleApply,
    handleClearAll,
  };
}
