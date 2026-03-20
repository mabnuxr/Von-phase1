import { useMemo } from "react";
import {
  FilterButton,
  type FilterField,
  type FilterGroup,
} from "@vonlabs/design-components";
import type {
  DashboardFilterDefinition,
  DashboardFilterState,
} from "../../../types/dashboard";

interface AnalyticsFiltersProps {
  filters: DashboardFilterDefinition[];
  activeFilters: DashboardFilterState;
}

function toFilterFields(filters: DashboardFilterDefinition[]): FilterField[] {
  return filters.map((f) => ({
    value: f.column,
    label: f.label,
    type:
      f.type === "date-range"
        ? "date"
        : f.type === "range"
          ? "number"
          : f.type === "select" || f.type === "multi-select"
            ? "select"
            : "text",
    options: f.options?.map((o) => ({ value: o, label: o })),
  }));
}

function formatFilterValue(
  filter: DashboardFilterDefinition,
  value: unknown,
): string {
  if (filter.type === "multi-select" && Array.isArray(value)) {
    return (value as string[]).join(", ");
  }
  if (
    filter.type === "date-range" &&
    typeof value === "object" &&
    value !== null
  ) {
    const { start, end } = value as { start?: string; end?: string };
    if (start && end) return `${start} – ${end}`;
    return start ?? end ?? "";
  }
  if (filter.type === "range" && typeof value === "object" && value !== null) {
    const { min, max } = value as { min?: number; max?: number };
    if (min !== undefined && max !== undefined) return `${min} – ${max}`;
    return String(min ?? max ?? "");
  }
  return String(value);
}

function toFilterOperator(type: DashboardFilterDefinition["type"]): string {
  switch (type) {
    case "multi-select":
      return "is_any_of";
    default:
      return "equals";
  }
}

function toFilterGroups(
  filters: DashboardFilterDefinition[],
  activeFilters: DashboardFilterState,
): FilterGroup[] {
  const conditions = filters
    .filter(
      (f) => activeFilters[f.id] !== undefined && activeFilters[f.id] !== null,
    )
    .map((f) => ({
      id: f.id,
      field: f.column,
      operator: toFilterOperator(f.type),
      value: formatFilterValue(f, activeFilters[f.id]),
    }));

  if (conditions.length === 0) return [];

  return [{ id: "active", connector: "and" as const, conditions }];
}

/**
 * Dashboard filter display using the design-system FilterButton in read-only mode.
 * Active filter state comes from the API's filters.state and is displayed as chips.
 * When no filters are configured for this dashboard, renders a subtle placeholder.
 */
const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  filters,
  activeFilters,
}) => {
  const safeFilters = Array.isArray(filters) ? filters : [];
  const fields = useMemo(() => toFilterFields(safeFilters), [safeFilters]);
  const groups = useMemo(
    () => toFilterGroups(safeFilters, activeFilters),
    [safeFilters, activeFilters],
  );

  const hasActiveFilters = groups.length > 0;

  if (!hasActiveFilters) {
    return (
      <span className="text-xs text-gray-400 px-1">No filters applied</span>
    );
  }

  return (
    <FilterButton
      fields={fields}
      groups={groups}
      onGroupsChange={() => {}}
      hideIcon
      readOnly
      compact
    />
  );
};

export { AnalyticsFilters };
