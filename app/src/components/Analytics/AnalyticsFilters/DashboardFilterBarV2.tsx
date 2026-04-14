/**
 * DashboardFilterBarV2 — v2 filter UI adapter.
 *
 * Wires the design-system ScrollableFilterBar + SplitFilterDropdown to
 * the useDashboardFilters hook v2 state. Translation helpers live in
 * `./filterTranslation` so the panel-level popover shares the same
 * token labels, type mapping, and round-trip logic.
 *
 * Filter priority ordering:
 *   1. Date type filters (always visible)
 *   2. Ownership semantic type filters (always visible)
 *   3. Applied filters (have a value in filterState)
 *   4. Non-applied filters (overflow behind "+" button)
 *
 * Commit model: each filter popover has its own Apply button that
 * commits all pending changes when clicked. There's no outer
 * bar-level Apply / Clear-all — the inner popover footer is the
 * sole commit surface (matches Aniket's storybook design).
 *
 * Locking model: per-filter. Each filter chip carries its own
 * `locked` + `onToggleLock` — the owner flips lock state inside each
 * filter's popover. Non-owners see a locked chip with a lock icon
 * and can't edit.
 */
import { useMemo, useState, useCallback } from "react";
import { ScrollableFilterBar } from "@vonlabs/design-components";
import type { FilterBarValue } from "@vonlabs/design-components";
import type { DashboardFilterDefinition } from "../../../types/dashboard";
import type { ActiveFilter } from "../../../hooks/useDashboardFilters";
import {
  fromFilterBarValue,
  mapDefinition,
  toFilterBarValue,
} from "./filterTranslation";

interface DashboardFilterBarV2Props {
  definitions: DashboardFilterDefinition[];
  filterState: Record<string, ActiveFilter>;
  isApplying: boolean;
  /** True when there are pending filter changes. Gates the in-popover Apply. */
  canApply: boolean;
  isOwner: boolean;
  onFilterChange: (
    filterId: string,
    operator: string,
    value?: unknown,
    includeBlank?: boolean,
  ) => void;
  onRemoveFilter: (filterId: string) => void;
  /**
   * Immediate-commit clear — fires a server PATCH that resets/removes the
   * filter. The in-popover Clear button calls this directly rather than
   * relying on Apply to flush the removal later.
   */
  onClearFilter?: (filterId: string) => void;
  /**
   * Owner-only. Immediate-commit lock toggle — PATCHes the filter's current
   * value with `is_locked: locked` without waiting for Apply. Locking
   * requires a valid/complete filter value; unlocking has no requirement.
   */
  onToggleLock?: (filterId: string, locked: boolean) => void;
  /**
   * Owner-only. Returns whether the filter can be locked right now (i.e.
   * has a complete/valid local value). When false, the Lock button in the
   * popover footer is disabled. Ignored for Unlock (always allowed).
   */
  canLockFilter?: (filterId: string) => boolean;
  /** Commit pending filter changes (triggered by the in-popover Apply). */
  onApply: () => void;
  /**
   * Revert a single filter's local state back to the server state. Called
   * when a filter popover closes without Apply so stale changes don't leak
   * into the next Apply of a different filter.
   */
  onRevertFilter?: (filterId: string) => void;
}

/**
 * Sort definitions into priority tiers and compute pinned count.
 *
 * Tier order (left → right):
 *   1. Date filters with boundary    (mandatory — always visible)
 *   2. Ownership filters with boundary (mandatory — always visible)
 *   3. Applied filters with boundary
 *   4. Applied filters without boundary
 *   5. Non-applied filters with boundary
 *   6. Non-applied filters without boundary
 *
 * "boundary" = definition has a non-empty `boundary` object.
 * "applied"  = filter has a value in `filterState` OR was promoted via "+".
 */
function sortDefinitions(
  definitions: DashboardFilterDefinition[],
  filterState: Record<string, ActiveFilter>,
  promotedIds: Set<string>,
) {
  const mandatory: DashboardFilterDefinition[] = []; // date+boundary, ownership+boundary
  const appliedBoundary: DashboardFilterDefinition[] = [];
  const appliedNormal: DashboardFilterDefinition[] = [];
  const restBoundary: DashboardFilterDefinition[] = [];
  const restNormal: DashboardFilterDefinition[] = [];

  for (const def of definitions) {
    const hasBoundary = !!def.boundary;
    const isMandatory =
      (def.type === "date" && hasBoundary) ||
      def.semantic_type === "ownership";
    const isApplied = def.id in filterState || promotedIds.has(def.id);

    if (isMandatory) {
      mandatory.push(def);
    } else if (isApplied && hasBoundary) {
      appliedBoundary.push(def);
    } else if (isApplied) {
      appliedNormal.push(def);
    } else if (hasBoundary) {
      restBoundary.push(def);
    } else {
      restNormal.push(def);
    }
  }

  // pinnedCount covers mandatory + applied + promoted — all of these are
  // always visible in the bar. Only restBoundary / restNormal are subject
  // to the 60% budget and overflow behind the "+" button.
  const pinnedCount =
    mandatory.length + appliedBoundary.length + appliedNormal.length;
  const sorted = [
    ...mandatory,
    ...appliedBoundary,
    ...appliedNormal,
    ...restBoundary,
    ...restNormal,
  ];
  return { sorted, pinnedCount };
}

export const DashboardFilterBarV2: React.FC<DashboardFilterBarV2Props> = ({
  definitions,
  filterState,
  isApplying,
  canApply,
  isOwner,
  onFilterChange,
  onRemoveFilter,
  onClearFilter,
  onToggleLock,
  canLockFilter,
  onApply,
  onRevertFilter,
}) => {
  // Tracks filters the user has manually promoted from the overflow "+" dropdown
  const [promotedIds, setPromotedIds] = useState<Set<string>>(new Set());
  const [autoOpenFieldId, setAutoOpenFieldId] = useState<string | undefined>();

  const { sorted, pinnedCount } = useMemo(
    () => sortDefinitions(definitions, filterState, promotedIds),
    [definitions, filterState, promotedIds],
  );

  const fields = useMemo(
    () =>
      sorted.map((def) =>
        mapDefinition(def, {
          currentFilter: filterState[def.id],
          // Visual lock shown to everyone — owner and viewer alike — whenever
          // the filter is server-locked. Owners can unlock via the popover
          // button; viewers see a read-only chip.
          locked: !!def.is_locked,
          // Lock toggle hidden for now — data scoping moved to the share
          // dialog. Keep the infrastructure (onToggleLock prop, canLockFilter)
          // so we can re-enable per-filter locking in the future.
          onToggleLock: undefined,
          canLock: canLockFilter ? canLockFilter(def.id) : undefined,
        }),
      ),
    [sorted, filterState, canLockFilter],
  );

  const values = useMemo(() => {
    const out: Record<string, FilterBarValue> = {};
    for (const def of sorted) {
      const f = filterState[def.id];
      if (f) out[def.id] = toFilterBarValue(f, def);
    }
    return out;
  }, [sorted, filterState]);

  const defById = useMemo(() => {
    const map = new Map<string, DashboardFilterDefinition>();
    for (const def of definitions) map.set(def.id, def);
    return map;
  }, [definitions]);

  const handleBarChange = (
    fieldId: string,
    barValue: FilterBarValue | null,
  ) => {
    const def = defById.get(fieldId);
    if (!def) return;
    // Guard: non-owner can't mutate a locked filter (the dropdown should
    // already prevent this, but belt-and-braces in case of timing).
    if (def.is_locked && !isOwner) return;
    if (barValue === null) {
      onRemoveFilter(fieldId);
      return;
    }
    const { operator, value, includeBlank } = fromFilterBarValue(barValue, def);
    onFilterChange(fieldId, operator, value, includeBlank);
  };

  const handleOverflowSelect = useCallback((fieldId: string) => {
    setPromotedIds((prev) => {
      const next = new Set(prev);
      next.add(fieldId);
      return next;
    });
    setAutoOpenFieldId(fieldId);
  }, []);

  return (
    <ScrollableFilterBar
      fields={fields}
      values={values}
      onFilterChange={handleBarChange}
      onApply={onApply}
      isApplying={isApplying}
      canApply={canApply}
      onClearField={onClearFilter}
      pinnedCount={pinnedCount}
      onOverflowSelect={handleOverflowSelect}
      autoOpenFieldId={autoOpenFieldId}
      onDismiss={onRevertFilter}
    />
  );
};
