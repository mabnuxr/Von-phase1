import { DashboardFilterPopover } from "./DashboardFilterPopover";
import type { DashboardFilterDefinition } from "../../../types/dashboard";

interface AnalyticsFiltersProps {
  definitions: DashboardFilterDefinition[];
  filterState: Record<string, unknown>;
  activeCount: number;
  onFilterChange: (column: string, value: unknown) => void;
  onClearFilter: (column: string) => void;
}

/**
 * Dashboard filter button shown in the toolbar row.
 * Renders a popover with all filter definitions and their current values.
 * Changes are propagated to the parent via onFilterChange / onClearFilter
 * which the parent wires to the PATCH /filters API through useDashboardFilters.
 */
const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  definitions,
  filterState,
  activeCount,
  onFilterChange,
  onClearFilter,
}) => {
  return (
    <DashboardFilterPopover
      definitions={definitions}
      filterState={filterState}
      activeCount={activeCount}
      onFilterChange={onFilterChange}
      onClearFilter={onClearFilter}
    />
  );
};

export { AnalyticsFilters };
