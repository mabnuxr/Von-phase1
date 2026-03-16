import { useMemo } from "react";
import {
  FilterButton,
  type FilterField,
  type FilterGroup,
} from "@vonlabs/design-components";
import type { DashboardFilter } from "../../../types/dashboard";

interface AnalyticsFiltersProps {
  filters: DashboardFilter[];
  activeFilters: Record<string, unknown>;
}

/** Map our DashboardFilter[] to FilterField[] for the FilterButton. */
function toFilterFields(_filters: DashboardFilter[]): FilterField[] {
  return [];
  // return filters.map((f) => ({
  //   value: f.field,
  //   label: f.label,
  //   type:
  //     f.type === "date-range" ? "date" : f.type === "range" ? "number" : "text",
  //   options: f.options?.map((o) => ({ value: o.value, label: o.label })),
  // }));
}

/** Convert activeFilters into a FilterGroup[] that the FilterButton can display. */
function toFilterGroups(
  _filters: DashboardFilter[],
  _activeFilters: Record<string, unknown>,
): FilterGroup[] {
  return [];
  // const conditions = filters
  //   .filter(
  //     (f) => activeFilters[f.id] !== undefined && activeFilters[f.id] !== null,
  //   )
  //   .map((f) => ({
  //     id: f.id,
  //     field: f.field,
  //     operator: "equals",
  //     value: String(activeFilters[f.id]),
  //   }));

  // if (conditions.length === 0) return [];

  // return [{ id: "active", connector: "and" as const, conditions }];
}

/**
 * Dashboard filter display using the design-system FilterButton in read-only mode.
 * Filters are agentic-only — the user can view but not edit.
 */
const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  filters,
  activeFilters,
}) => {
  const fields = useMemo(() => toFilterFields(filters), [filters]);
  const groups = useMemo(
    () => toFilterGroups(filters, activeFilters),
    [filters, activeFilters],
  );

  return (
    <FilterButton
      fields={fields}
      groups={groups}
      onGroupsChange={() => {}}
      hideIcon
      readOnly
    />
  );
};

export { AnalyticsFilters };
