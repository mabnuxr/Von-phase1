import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import { dashboardKeys } from "./useDashboardQuery";
import { useToast } from "./useToast";
import type {
  DashboardFilterDefinition,
  DashboardFilterState,
  FilterPatchPayload,
  FilterOperator,
} from "../types/dashboard";

// ── Helpers ─────────────────────────────────────────────────────

/**
 * Extract the raw UI value from a server state entry.
 * Server may return a raw value, {operator, value}, or an array of
 * {operator, value} pairs (for range / date-range filters with two bounds).
 */
function extractRawValue(entry: unknown): unknown {
  if (Array.isArray(entry)) {
    // Array of {operator, value} — reconstruct the UI shape
    const items = entry as { operator: string; value?: unknown }[];
    const dateResult: { start?: string; end?: string } = {};
    const rangeResult: { min?: number; max?: number } = {};
    let isDate = false;
    let isRange = false;

    for (const item of items) {
      if (item.operator === "on_or_after") {
        dateResult.start = item.value as string;
        isDate = true;
      } else if (item.operator === "on_or_before") {
        dateResult.end = item.value as string;
        isDate = true;
      } else if (item.operator === "greater_than_or_equal") {
        rangeResult.min = item.value as number;
        isRange = true;
      } else if (item.operator === "less_than_or_equal") {
        rangeResult.max = item.value as number;
        isRange = true;
      }
    }

    if (isDate) return dateResult;
    if (isRange) return rangeResult;
    // Fallback: return the first item's value
    return items[0]?.value ?? null;
  }

  if (typeof entry === "object" && entry !== null && "operator" in entry) {
    const item = entry as { operator: string; value?: unknown };
    // Single-bound date/range — wrap in the UI shape so inputs populate correctly
    if (item.operator === "on_or_after") return { start: item.value as string };
    if (item.operator === "on_or_before") return { end: item.value as string };
    if (item.operator === "greater_than_or_equal")
      return { min: item.value as number };
    if (item.operator === "less_than_or_equal")
      return { max: item.value as number };
    return item.value ?? null;
  }

  return entry;
}

/**
 * Normalise server state (keyed by filter id, values may be {operator,value})
 * into a simple id → rawValue map for the UI.
 */
function normaliseServerState(
  serverState: DashboardFilterState,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(serverState)) {
    const raw = extractRawValue(val);
    if (raw !== null && raw !== undefined && raw !== "") {
      out[key] = raw;
    }
  }
  return out;
}

/**
 * Map a filter definition type + its UI value into the API payload shape
 * ({operator, value} or null to clear).
 */
type ApiFilterResult =
  | { operator: FilterOperator; value?: string | number | string[] }
  | { operator: FilterOperator; value?: string | number | string[] }[]
  | null;

function toApiFilter(
  def: DashboardFilterDefinition,
  value: unknown,
): ApiFilterResult {
  if (value === null || value === undefined || value === "") return null;

  switch (def.type) {
    case "picklist":
    case "multi-select": {
      const arr = Array.isArray(value) ? value : [value];
      if (arr.length === 0) return null;
      return { operator: "in", value: arr as string[] };
    }
    case "select":
      return { operator: "equals", value: value as string };
    case "date-range": {
      const dateVal = value as { start?: string; end?: string };
      if (!dateVal.start && !dateVal.end) return null;
      if (dateVal.start && dateVal.end) {
        return [
          { operator: "on_or_after", value: dateVal.start },
          { operator: "on_or_before", value: dateVal.end },
        ];
      }
      if (dateVal.start)
        return { operator: "on_or_after", value: dateVal.start };
      return { operator: "on_or_before", value: dateVal.end };
    }
    case "range": {
      const rangeVal = value as { min?: number; max?: number };
      if (rangeVal.min == null && rangeVal.max == null) return null;
      if (rangeVal.min != null && rangeVal.max != null) {
        return [
          { operator: "greater_than_or_equal", value: rangeVal.min },
          { operator: "less_than_or_equal", value: rangeVal.max },
        ];
      }
      if (rangeVal.min != null)
        return { operator: "greater_than_or_equal", value: rangeVal.min };
      return { operator: "less_than_or_equal", value: rangeVal.max };
    }
    default:
      return { operator: "contains", value: value as string };
  }
}

// ── Hook ────────────────────────────────────────────────────────

const DEBOUNCE_MS = 600;

/**
 * Manages dashboard filter state and PATCH calls.
 *
 * State is keyed by filter **id** (e.g. "risk_level", "owner") — matching
 * the server's `filters.state` keys and the PATCH payload keys.
 */
export function useDashboardFilters(
  dashboardId: string | undefined,
  definitions: DashboardFilterDefinition[],
  serverState: DashboardFilterState,
) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pendingPayloadRef = useRef<FilterPatchPayload>({});

  // Local filter state keyed by filter id → raw UI value
  const [localState, setLocalState] = useState<Record<string, unknown>>(() =>
    normaliseServerState(serverState),
  );

  // Sync from server when it changes (e.g. after refetch)
  useEffect(() => {
    setLocalState(normaliseServerState(serverState));
  }, [serverState]);

  // Clear debounce + pending payload on dashboardId change and unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      pendingPayloadRef.current = {};
    };
  }, [dashboardId]);

  const safeDefinitions = Array.isArray(definitions) ? definitions : [];
  const definitionsRef = useRef(safeDefinitions);
  definitionsRef.current = safeDefinitions;

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
        message: "Failed to update filters. Please try again.",
        variant: "error",
      });
      setLocalState(normaliseServerState(serverState));
    },
  });

  // Stable ref for mutate so the debounced closure never goes stale
  const mutateRef = useRef(mutation.mutate);
  mutateRef.current = mutation.mutate;

  /**
   * @param filterId - The filter definition `id` (e.g. "risk_level")
   * @param value    - The raw UI value (e.g. ["High","Medium"]) or null to clear
   */
  const handleFilterChange = useCallback(
    (filterId: string, value: unknown) => {
      if (!dashboardId) return;

      // Update local state immediately (optimistic)
      setLocalState((prev) => {
        const next = { ...prev };
        if (value === null || value === undefined || value === "") {
          delete next[filterId];
        } else if (Array.isArray(value) && value.length === 0) {
          delete next[filterId];
        } else {
          next[filterId] = value;
        }
        return next;
      });

      // Accumulate into pending payload so rapid changes aren't lost
      const def = definitionsRef.current.find((d) => d.id === filterId);
      if (!def) return;

      const apiValue = toApiFilter(def, value);
      pendingPayloadRef.current = {
        ...pendingPayloadRef.current,
        [filterId]: apiValue,
      };

      // Debounce the API call — sends all accumulated changes
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const payload = pendingPayloadRef.current;
        pendingPayloadRef.current = {};
        mutateRef.current(payload);
      }, DEBOUNCE_MS);
    },
    [dashboardId],
  );

  const handleClearFilter = useCallback(
    (filterId: string) => {
      handleFilterChange(filterId, null);
    },
    [handleFilterChange],
  );

  const activeCount = safeDefinitions.filter((d) => {
    const val = localState[d.id];
    if (val === null || val === undefined || val === "") return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  }).length;

  return {
    definitions: safeDefinitions,
    filterState: localState,
    activeCount,
    handleFilterChange,
    handleClearFilter,
    isUpdating: mutation.isPending,
  };
}
