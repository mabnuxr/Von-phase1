import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import { dashboardKeys } from "./useDashboardQuery";
import { useToast } from "./useToast";
import type {
  DashboardFilterDefinition,
  DashboardFilterState,
  FilterPatchPayload,
} from "../types/dashboard";

// ── Types ──────────────────────────────────────────────────────

/** A single active filter in API-native format. */
export interface ActiveFilter {
  operator: string;
  value?: unknown;
  include_blank?: boolean;
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

/**
 * Extract ActiveFilter entries from server state.
 * Server sends {operator, value} dicts, arrays of them, or null.
 */
function normaliseServerState(
  serverState: DashboardFilterState,
): FilterLocalState {
  const out: FilterLocalState = {};
  for (const [key, val] of Object.entries(serverState)) {
    if (val === null || val === undefined) continue;

    if (Array.isArray(val)) {
      const items = val as { operator: string; value?: unknown }[];
      if (items.length === 2) {
        // Old dual-bound format → convert to between
        const [a, b] = items;
        if (
          (a.operator === "on_or_after" && b.operator === "on_or_before") ||
          (a.operator === "greater_than_or_equal" &&
            b.operator === "less_than_or_equal")
        ) {
          out[key] = { operator: "between", value: [a.value, b.value] };
          continue;
        }
      }
      // Fallback: take the first item
      if (items.length > 0 && items[0].operator) {
        out[key] = { operator: items[0].operator, value: items[0].value };
      }
      continue;
    }

    if (typeof val === "object" && "operator" in val) {
      const item = val as {
        operator: string;
        value?: unknown;
        include_blank?: boolean;
      };
      out[key] = {
        operator: item.operator,
        ...(item.value !== undefined && { value: item.value }),
        ...(item.include_blank && { include_blank: true }),
      };
      continue;
    }
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

// ── Hook ────────────────────────────────────────────────────────

/**
 * Manages dashboard filter state with explicit Apply.
 *
 * All edits (field, operator, value changes) are local-only.
 * Nothing is sent to the API until the user clicks Apply.
 */
export function useDashboardFilters(
  dashboardId: string | undefined,
  definitions: DashboardFilterDefinition[],
  serverState: DashboardFilterState,
) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // The last-known server state (normalised)
  const serverNormalised = useRef<FilterLocalState>(
    normaliseServerState(serverState),
  );

  // Local working copy — edits happen here, not sent to API
  const [localState, setLocalState] = useState<FilterLocalState>(() =>
    normaliseServerState(serverState),
  );

  // Rows where user hasn't picked a field yet (UI-only)
  const [pendingRows, setPendingRows] = useState<PendingRow[]>([]);

  // True from Apply click until the dashboard refetch completes with new data
  const [isApplying, setIsApplying] = useState(false);

  // Sync from server when it changes (e.g. after refetch / apply success)
  useEffect(() => {
    const normalised = normaliseServerState(serverState);
    serverNormalised.current = normalised;
    setLocalState(normalised);
    setPendingRows([]);
    setIsApplying(false); // Refetch complete — unlock editing
  }, [serverState]);

  const safeDefinitions = Array.isArray(definitions) ? definitions : [];

  const mutation = useMutation({
    mutationFn: (payload: FilterPatchPayload) =>
      dashboardService.updateFilters(dashboardId!, payload),
    onSuccess: () => {
      if (dashboardId) {
        queryClient.invalidateQueries({
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
      setIsApplying(false);
    },
    onSettled: () => {
      // Safety net: if serverState effect doesn't fire within 15s
      // (e.g. refetch fails silently), unlock the UI
      setTimeout(() => setIsApplying(false), 15_000);
    },
  });

  // ── Local-only edits (no API calls) ─────────────────────────

  const handleFilterChange = useCallback(
    (
      filterId: string,
      operator: string,
      value?: unknown,
      includeBlank?: boolean,
    ) => {
      const filter: ActiveFilter = {
        operator,
        ...(value !== undefined && { value }),
        ...(includeBlank !== undefined && { include_blank: includeBlank }),
      };
      setLocalState((prev) => ({ ...prev, [filterId]: filter }));
    },
    [],
  );

  const handleRemoveFilter = useCallback((filterId: string) => {
    setLocalState((prev) => {
      const next = { ...prev };
      delete next[filterId];
      return next;
    });
  }, []);

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

  // ── Apply: send all changes to API at once ──────────────────

  const handleApply = useCallback(() => {
    if (!dashboardId) return;

    const server = serverNormalised.current;
    const payload: FilterPatchPayload = {};

    // Filters that were added or changed
    for (const [filterId, filter] of Object.entries(localState)) {
      // Skip incomplete filters (no value and not a no-value operator)
      if (!NO_VALUE_OPERATORS.has(filter.operator)) {
        if (
          filter.value === undefined ||
          filter.value === null ||
          filter.value === ""
        )
          continue;
        if (Array.isArray(filter.value) && filter.value.length === 0) continue;
      }
      // Check if it actually changed from server state
      const serverFilter = server[filterId];
      if (
        !serverFilter ||
        JSON.stringify(serverFilter) !== JSON.stringify(filter)
      ) {
        const apiValue: Record<string, unknown> = { operator: filter.operator };
        if (filter.value !== undefined) apiValue.value = filter.value;
        if (filter.include_blank !== undefined)
          apiValue.include_blank = filter.include_blank;
        payload[filterId] = apiValue as unknown as FilterPatchPayload[string];
      }
    }

    // Filters that were removed (in server but not in local)
    for (const filterId of Object.keys(server)) {
      if (!(filterId in localState)) {
        payload[filterId] = null;
      }
    }

    if (Object.keys(payload).length === 0) return; // Nothing changed

    setIsApplying(true);
    mutation.mutate(payload);
  }, [dashboardId, localState, mutation]);

  // ── Clear all (local + immediate API) ───────────────────────

  const handleClearAll = useCallback(() => {
    if (!dashboardId) return;

    const server = serverNormalised.current;
    const payload: FilterPatchPayload = {};
    for (const filterId of Object.keys(server)) {
      payload[filterId] = null;
    }

    setLocalState({});
    setPendingRows([]);

    if (Object.keys(payload).length > 0) {
      setIsApplying(true);
      mutation.mutate(payload);
    }
  }, [dashboardId, mutation]);

  const activeCount = Object.keys(localState).length;
  const isDirty = !statesEqual(localState, serverNormalised.current);

  // Every local filter must be complete (has value or is a no-value operator)
  const BETWEEN_OPS = new Set(["between", "not_between"]);
  const allFiltersValid = Object.values(localState).every((filter) => {
    if (NO_VALUE_OPERATORS.has(filter.operator)) return true;
    if (
      filter.value === undefined ||
      filter.value === null ||
      filter.value === ""
    )
      return false;
    if (Array.isArray(filter.value)) {
      if (filter.value.length === 0) return false;
      // Between requires exactly 2 non-empty bounds
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
  });

  const canApply = isDirty && allFiltersValid;

  return {
    definitions: safeDefinitions,
    filterState: localState,
    pendingRows,
    activeCount,
    canApply,
    handleFilterChange,
    handleRemoveFilter,
    handleAddFilter,
    handleRemovePendingRow,
    handleCommitPendingRow,
    handleApply,
    handleClearAll,
    isApplying,
  };
}
