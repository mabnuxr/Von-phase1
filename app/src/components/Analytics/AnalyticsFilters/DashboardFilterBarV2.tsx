/**
 * DashboardFilterBarV2 — v2 filter UI adapter.
 *
 * Wires the design-system ScrollableFilterBar + SplitFilterDropdown to
 * the useDashboardFilters hook v2 state. Translation helpers live in
 * `./filterTranslation` so the panel-level popover shares the same
 * token labels, type mapping, and round-trip logic.
 */
import { useMemo } from "react";
import { LockSimpleIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { ScrollableFilterBar, Tooltip } from "@vonlabs/design-components";
import type { FilterBarValue } from "@vonlabs/design-components";
import type { DashboardFilterDefinition } from "../../../types/dashboard";
import type { ActiveFilter } from "../../../hooks/useDashboardFilters";
import {
  fromFilterBarValue,
  mapDefinition,
  renderFilterValue,
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
  onApply,
  onClearAll,
}) => {
  const { editableDefs, lockedDefs } = useMemo(() => {
    const editable: DashboardFilterDefinition[] = [];
    const locked: DashboardFilterDefinition[] = [];
    for (const def of definitions) {
      if (def.is_locked && !isOwner) locked.push(def);
      else editable.push(def);
    }
    return { editableDefs: editable, lockedDefs: locked };
  }, [definitions, isOwner]);

  const fields = useMemo(
    () =>
      editableDefs.map((def) =>
        mapDefinition(def, { currentFilter: filterState[def.id] }),
      ),
    [editableDefs, filterState],
  );

  const values = useMemo(() => {
    const out: Record<string, FilterBarValue> = {};
    for (const def of editableDefs) {
      const f = filterState[def.id];
      if (f) out[def.id] = toFilterBarValue(f, def);
    }
    return out;
  }, [editableDefs, filterState]);

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
    if (barValue === null) {
      onRemoveFilter(fieldId);
      return;
    }
    const { operator, value, includeBlank } = fromFilterBarValue(barValue, def);
    onFilterChange(fieldId, operator, value, includeBlank);
  };

  return (
    <div className="flex items-center gap-2 min-w-0 max-w-full">
      {lockedDefs.map((def) => {
        const label = renderFilterValue(filterState[def.id], def, "—");
        return (
          <Tooltip
            key={def.id}
            content={
              def.boundary_description
                ? `Locked by dashboard owner · ${def.boundary_description}`
                : "Locked by dashboard owner"
            }
          >
            <div className="flex flex-col gap-1 shrink-0">
              <span className="text-[11px] text-gray-700 leading-none pl-0.5">
                {def.label}
              </span>
              <div className="flex items-center gap-1.5 h-[28px] px-2 text-xs text-gray-700 bg-gray-50 rounded-lg border border-gray-200/50 whitespace-nowrap cursor-not-allowed">
                <LockSimpleIcon size={11} className="text-gray-500" />
                {label}
              </div>
            </div>
          </Tooltip>
        );
      })}

      <ScrollableFilterBar
        fields={fields}
        values={values}
        onFilterChange={handleBarChange}
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
