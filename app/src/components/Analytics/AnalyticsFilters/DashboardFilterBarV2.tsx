/**
 * DashboardFilterBarV2 — v2 filter UI adapter.
 *
 * Wires the design-system ScrollableFilterBar + SplitFilterDropdown to
 * the useDashboardFilters hook v2 state. Translation helpers live in
 * `./filterTranslation` so the panel-level popover shares the same
 * token labels, type mapping, and round-trip logic.
 *
 * Locking model: per-filter. Each filter chip carries its own
 * `locked` + `onToggleLock` — the owner flips lock state inside each
 * filter's popover. Non-owners see a locked chip with a lock icon
 * and can't edit. (This replaces the bar-wide lock toggle Aniket's
 * storybook prototyped; we lock individually for sharing use-cases.)
 */
import { useMemo } from "react";
import { SpinnerGapIcon } from "@phosphor-icons/react";
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
  activeCount: number;
  canApply: boolean;
  isApplying: boolean;
  isOwner: boolean;
  onFilterChange: (
    filterId: string,
    operator: string,
    value?: unknown,
    includeBlank?: boolean,
  ) => void;
  onRemoveFilter: (filterId: string) => void;
  /**
   * Owner-only. Immediate-commit lock toggle — PATCHes the filter's current
   * value with `is_locked: locked` without waiting for Apply. Locking
   * requires a valid/complete filter value (same rule as Apply); unlocking
   * has no validity requirement.
   */
  onToggleLock?: (filterId: string, locked: boolean) => void;
  /**
   * Owner-only. Returns whether the filter can be locked right now (i.e.
   * has a complete/valid local value). When false, the Lock button in the
   * popover footer is disabled. Ignored for Unlock (always allowed).
   */
  canLockFilter?: (filterId: string) => boolean;
  onApply: () => void;
  onClearAll: () => void;
}

export const DashboardFilterBarV2: React.FC<DashboardFilterBarV2Props> = ({
  definitions,
  filterState,
  activeCount,
  canApply,
  isApplying,
  isOwner,
  onFilterChange,
  onRemoveFilter,
  onToggleLock,
  canLockFilter,
  onApply,
  onClearAll,
}) => {
  const fields = useMemo(
    () =>
      definitions.map((def) =>
        mapDefinition(def, {
          currentFilter: filterState[def.id],
          // Visual lock shown to everyone — owner and viewer alike — whenever
          // the filter is server-locked. Owners can unlock via the popover
          // button; viewers see a read-only chip.
          locked: !!def.is_locked,
          // Only the owner gets the in-popover lock toggle.
          onToggleLock:
            isOwner && onToggleLock
              ? () => onToggleLock(def.id, !def.is_locked)
              : undefined,
          // Disable the Lock button when the filter has no complete value yet
          // (mirrors Apply's rule). Ignored when already locked — Unlock is
          // always allowed.
          canLock: canLockFilter ? canLockFilter(def.id) : undefined,
        }),
      ),
    [definitions, filterState, isOwner, onToggleLock, canLockFilter],
  );

  const values = useMemo(() => {
    const out: Record<string, FilterBarValue> = {};
    for (const def of definitions) {
      const f = filterState[def.id];
      if (f) out[def.id] = toFilterBarValue(f, def);
    }
    return out;
  }, [definitions, filterState]);

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

  return (
    <div className="flex items-center gap-2 min-w-0 max-w-full">
      <ScrollableFilterBar
        fields={fields}
        values={values}
        onFilterChange={handleBarChange}
        onApply={onApply}
        isApplying={isApplying}
      />

      {(canApply || activeCount > 0) && (
        <div className="flex items-center gap-1.5 shrink-0 pl-1">
          {canApply && (
            <button
              onClick={onApply}
              disabled={isApplying}
              className="inline-flex items-center gap-1.5 h-[28px] px-2.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              {isApplying && (
                <SpinnerGapIcon size={11} className="animate-spin" />
              )}
              Apply
            </button>
          )}
          {activeCount > 0 && !isApplying && (
            <button
              onClick={onClearAll}
              className="text-xs text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
};
