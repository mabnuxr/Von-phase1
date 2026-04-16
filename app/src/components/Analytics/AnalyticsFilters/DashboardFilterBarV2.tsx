/**
 * DashboardFilterBarV2 — v2 filter UI adapter.
 *
 * Wires the design-system ScrollableFilterBar + SplitFilterDropdown to
 * the useDashboardFilters hook v2 state. Translation helpers live in
 * `./filterTranslation` so the panel-level popover shares the same
 * token labels, type mapping, and round-trip logic.
 *
 * Filter priority ordering:
 *   1. Mandatory filters (date with boundary, ownership) — always inline
 *   2. Everything else in original definition order — inline up to 4,
 *      then overflow behind "More +N" button
 *
 * Commit model: each filter popover has its own Apply button that
 * commits all pending changes when clicked. There's no outer
 * bar-level Apply / Clear-all — the inner popover footer is the
 * sole commit surface.
 *
 * Locking model: per-filter. Each filter chip carries its own
 * `locked` + `onToggleLock` — the owner flips lock state inside each
 * filter's popover. Non-owners see a locked chip with a lock icon
 * and can't edit.
 */
import { useMemo, useCallback } from "react";
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
 * Sort definitions into priority tiers.
 *
 * Tier order (left → right):
 *   1. Mandatory filters (date with boundary, ownership) — always visible
 *   2. Everything else in original definition order
 *
 * No state-based re-ordering — applying a filter doesn't move its chip.
 */
function sortDefinitions(definitions: DashboardFilterDefinition[]) {
  const mandatory: DashboardFilterDefinition[] = [];
  const rest: DashboardFilterDefinition[] = [];

  for (const def of definitions) {
    const isMandatory =
      (def.type === "date" && !!def.boundary) ||
      def.semantic_type === "ownership";

    if (isMandatory) {
      mandatory.push(def);
    } else {
      rest.push(def);
    }
  }

  const pinnedCount = mandatory.length;
  const sorted = [...mandatory, ...rest];
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
  // onToggleLock — kept on the interface for future re-enablement
  canLockFilter,
  onApply,
  onRevertFilter,
}) => {
  // Mandatory filters first, then the rest in definition order.
  const { sorted, pinnedCount } = useMemo(
    () => sortDefinitions(definitions),
    [definitions],
  );

  const fields = useMemo(
    () =>
      sorted.map((def) =>
        mapDefinition(def, {
          currentFilter: filterState[def.id],
          locked: !!def.is_locked,
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

  const handleBarChange = useCallback(
    (fieldId: string, barValue: FilterBarValue | null) => {
      const def = defById.get(fieldId);
      if (!def) return;
      if (def.is_locked && !isOwner) return;
      if (barValue === null) {
        onRemoveFilter(fieldId);
        return;
      }
      const { operator, value, includeBlank } = fromFilterBarValue(
        barValue,
        def,
      );
      onFilterChange(fieldId, operator, value, includeBlank);
    },
    [defById, isOwner, onRemoveFilter, onFilterChange],
  );

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
      onDismiss={onRevertFilter}
    />
  );
};
