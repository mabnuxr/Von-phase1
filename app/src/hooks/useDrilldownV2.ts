/**
 * Drilldown V2 hook (pyramid model) — click-chain state machine for descent
 * through a panel's aggregation pyramid.
 *
 * Mental model:
 * - A panel's main query has K aggregations; drilldown has K levels.
 * - Each click descends one level. There is no same-level filter affordance —
 *   clicks ALWAYS descend, until `has_next_level=false` is returned (floor).
 * - Variants are alternate views at the same depth (selected via the variant
 *   button row); they do NOT change depth.
 * - Filters propagate down: a click at depth n contributes a filter that
 *   applies at every level ≥ n. Latest-wins on the same key.
 *
 * Hook semantics:
 * - `clickChain` is an unbounded stack — depth = chain length. The first
 *   entry is the L0 click (chart-bar / KPI / table-cell that opened the
 *   sheet); each subsequent entry is one whole-row descent. Each entry
 *   carries the filter contribution from THAT click.
 * - `pushLevel(filters)` only descends if the latest server response said
 *   `has_next_level: true`. Otherwise it's a no-op (rows inert at floor).
 * - No client-side caching — every level / variant / pagination / sort change
 *   re-fetches (`staleTime: 0`, `gcTime: 0`).
 */
import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import type {
  DrilldownV2Response,
  DrilldownV2Request,
} from "../types/dashboard";

const PAGE_LIMIT = 20;
const BREADCRUMB_OVERFLOW_THRESHOLD = 8;

interface SortInfo {
  orderBy: string;
  orderByAsc: boolean;
}

export interface DrilldownV2ClickNode {
  /**
   * Depth marker — the length determines which level the request resolves
   * against. Segment values are opaque to routing but kept for cache-key
   * distinctness across click paths that share depth.
   */
  columnPath: string[];
  /** null => use this level's is_default variant. */
  variantId: string | null;
  /**
   * The variant id this node was originally clicked into — captured at
   * push/open time and never mutated by ``changeVariant``. Lets the
   * breadcrumb tell "user is still on the routed-to variant" from "user
   * manually switched to a different variant". For ``column_variant_map``
   * routing this is the mapped id; for KPI / chart clicks where no
   * routing applies it stays null (meaning "fall back to is_default").
   */
  initialVariantId: string | null;
  /**
   * Filter contributions originating at THIS click. Keyed by SQL column name;
   * latest-wins across the chain when merged. For whole-row descent, this is
   * typically the entire grouping-key dict from the clicked row.
   */
  filters: Record<string, unknown>;
  /**
   * Numeric metric value behind the clicked element — chart point's
   * ``y``/``weight``/``value`` for chart clicks, the cell's value for
   * table cell clicks, the KPI's resolved numeric for tile clicks.
   * Surfaced in the breadcrumb as a parenthesized suffix (e.g.
   * "Stage: Negotiation (47)") so the user can see what value they
   * drilled into. Backend ignores this; FE-only.
   */
  metricValue?: unknown;
  /**
   * Optional column label for table-style click sources. When set, the
   * breadcrumb suffix renders as ``(label: value)`` rather than bare
   * ``(value)``. Set for table widget cell clicks and drill-view cell
   * clicks (where the column the user clicked is meaningful context);
   * left null for chart point clicks (the axis label is already in
   * the segment's main label) and KPI tile clicks (the widget title
   * already conveys what the value represents).
   */
  metricLabel?: string;
}

export interface UseDrilldownV2Return {
  isOpen: boolean;
  panelId: string | null;
  /** Current chain (top entry = deepest level currently shown). Read-only. */
  clickChain: DrilldownV2ClickNode[];
  title: string;
  justification: string;
  variants: DrilldownV2Response["variants"];
  currentVariantId: string | null;
  query: string;
  data: Record<string, unknown>[];
  pagination: DrilldownV2Response["pagination"] | null;
  hasNextLevel: boolean;
  currentSort: SortInfo | null;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  overflowBannerVisible: boolean;

  openPanelDrilldown: (
    panelId: string,
    columnPath: string[],
    filters: Record<string, unknown>,
    metricValue?: unknown,
    metricLabel?: string,
    variantId?: string | null,
  ) => void;
  /**
   * Descend one level. ``columnPath`` extends the parent's path by one segment
   * (the segment value is opaque — usually the column name the user clicked,
   * for breadcrumb display only). ``filters`` is the cumulative filter
   * contribution from THIS click; combined with shallower-level filters at
   * fetch time. Optional ``metricValue`` carries the clicked-cell / clicked-
   * point numeric value for breadcrumb display; ``metricLabel`` carries the
   * column label for table-style sources (renders as "label: value").
   * ``variantId`` is the next-level variant to open; pass null to fall back
   * to the next level's is_default. Used by ``column_variant_map`` routing
   * — the caller looks up the clicked column in the current variant's
   * column_variant_map and forwards the mapped id (or null if unmapped).
   */
  pushLevel: (
    columnPath: string[],
    filters: Record<string, unknown>,
    metricValue?: unknown,
    metricLabel?: string,
    variantId?: string | null,
  ) => void;
  popToLevel: (depth: number) => void;
  closeDrilldown: () => void;
  changeVariant: (variantId: string | null) => void;
  changePage: (page: number) => void;
  changeSort: (columnId: string, order: "asc" | "desc" | null) => void;
}

interface DrilldownV2State {
  panelId: string;
  chain: DrilldownV2ClickNode[];
  page: number;
  sort: SortInfo | null;
}

/** Merge drill_filters across every level in the chain into a single flat dict. */
function mergeChainFilters(
  chain: DrilldownV2ClickNode[],
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  for (const node of chain) {
    for (const [k, v] of Object.entries(node.filters)) {
      // Latest-wins on collision (deeper levels override shallower).
      merged[k] = v;
    }
  }
  return merged;
}

export function useDrilldownV2(dashboardId: string): UseDrilldownV2Return {
  const [state, setState] = useState<DrilldownV2State | null>(null);

  // Reset when dashboard changes so stale panels never bleed across.
  useEffect(() => {
    setState(null);
  }, [dashboardId]);

  const topNode =
    state && state.chain.length > 0
      ? state.chain[state.chain.length - 1]
      : null;

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: [
      "drilldown_v2",
      dashboardId,
      state?.panelId,
      state?.page,
      state?.sort?.orderBy ?? null,
      state?.sort?.orderByAsc ?? null,
      // Full chain in the key so any level/variant/filter change re-fetches.
      state ? JSON.stringify(state.chain) : null,
    ],
    queryFn: async (): Promise<DrilldownV2Response> => {
      if (!state || !topNode) throw new Error("No drilldown state");
      const mergedFilters = mergeChainFilters(state.chain);
      const payload: DrilldownV2Request = {
        panel_id: state.panelId,
        column_path: topNode.columnPath,
        variant_id: topNode.variantId,
        drill_filters: mergedFilters,
        page_limit: PAGE_LIMIT,
        page: state.page,
        ...(state.sort && {
          sort_config: [
            {
              order_by: state.sort.orderBy,
              order_by_asc: state.sort.orderByAsc,
            },
          ],
        }),
      };
      return dashboardService.drilldownPanelV2(dashboardId, payload);
    },
    enabled: !!state && !!topNode,
    // No FE cache — always fresh.
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  const openPanelDrilldown = useCallback(
    (
      panelId: string,
      columnPath: string[],
      filters: Record<string, unknown>,
      metricValue?: unknown,
      metricLabel?: string,
      variantId: string | null = null,
    ) => {
      setState({
        panelId,
        chain: [
          {
            columnPath,
            variantId,
            initialVariantId: variantId,
            filters,
            metricValue,
            metricLabel,
          },
        ],
        page: 1,
        sort: null,
      });
    },
    [],
  );

  const pushLevel = useCallback(
    (
      columnPath: string[],
      filters: Record<string, unknown>,
      metricValue?: unknown,
      metricLabel?: string,
      variantId: string | null = null,
    ) => {
      setState((prev) => {
        if (!prev) return prev;
        // Only descend when the server says another level exists. Otherwise
        // we're at the floor — the click should be a no-op even if the UI
        // happens to forward it (defensive guard).
        if (!data?.has_next_level) return prev;
        const next: DrilldownV2State = {
          ...prev,
          chain: [
            ...prev.chain,
            {
              columnPath,
              variantId,
              initialVariantId: variantId,
              filters,
              metricValue,
              metricLabel,
            },
          ],
          page: 1,
          sort: null,
        };
        return next;
      });
    },
    [data?.has_next_level],
  );

  const popToLevel = useCallback((depth: number) => {
    // depth 0 = L1 (chain[0]); depth 1 = L2 (chain[1]); etc. Truncate the chain.
    setState((prev) => {
      if (!prev) return prev;
      if (depth < 0 || depth >= prev.chain.length) return prev;
      return {
        ...prev,
        chain: prev.chain.slice(0, depth + 1),
        page: 1,
        sort: null,
      };
    });
  }, []);

  const closeDrilldown = useCallback(() => {
    setState(null);
  }, []);

  const changeVariant = useCallback((variantId: string | null) => {
    setState((prev) => {
      if (!prev || prev.chain.length === 0) return prev;
      const chain = prev.chain.slice();
      const top = chain[chain.length - 1];
      chain[chain.length - 1] = { ...top, variantId };
      return { ...prev, chain, page: 1 };
    });
  }, []);

  const changePage = useCallback((page: number) => {
    setState((prev) => (prev ? { ...prev, page } : prev));
  }, []);

  const changeSort = useCallback(
    (columnId: string, order: "asc" | "desc" | null) => {
      setState((prev) => {
        if (!prev) return prev;
        const nextSort: SortInfo | null =
          order === null
            ? null
            : { orderBy: columnId, orderByAsc: order === "asc" };
        return { ...prev, page: 1, sort: nextSort };
      });
    },
    [],
  );

  const overflowBannerVisible = useMemo(
    () => (state?.chain.length ?? 0) >= BREADCRUMB_OVERFLOW_THRESHOLD,
    [state?.chain.length],
  );

  return {
    isOpen: !!state,
    panelId: state?.panelId ?? null,
    clickChain: state?.chain ?? [],
    title: data?.title ?? "",
    justification: data?.justification ?? "",
    variants: data?.variants ?? [],
    currentVariantId: data?.current_variant_id ?? null,
    query: data?.query ?? "",
    data: data?.data ?? [],
    pagination: data?.pagination ?? null,
    hasNextLevel: data?.has_next_level ?? false,
    currentSort: state?.sort ?? null,
    isLoading: isLoading || isFetching,
    isError,
    error,
    overflowBannerVisible,
    openPanelDrilldown,
    pushLevel,
    popToLevel,
    closeDrilldown,
    changeVariant,
    changePage,
    changeSort,
  };
}
