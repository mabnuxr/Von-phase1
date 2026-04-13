/**
 * DashboardFilterBarV2 — v2 filter UI adapter.
 *
 * Wires the design-system ScrollableFilterBar + SplitFilterDropdown to
 * the useDashboardFilters hook v2 state. Translation helpers live in
 * `./filterTranslation` so the panel-level popover shares the same
 * token labels, type mapping, and round-trip logic.
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
import { useMemo } from "react";
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
}

export const DashboardFilterBarV2: React.FC<DashboardFilterBarV2Props> = ({
  definitions,
  filterState,
  isApplying,
  isOwner,
  onFilterChange,
  onRemoveFilter,
  onToggleLock,
  canLockFilter,
  onApply,
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
    <ScrollableFilterBar
      fields={fields}
      values={values}
      onFilterChange={handleBarChange}
      onApply={onApply}
      isApplying={isApplying}
    />
  );
};
