import { DashboardFilterPopover } from "./DashboardFilterPopover";
import type { DashboardFilterDefinition } from "../../../types/dashboard";
import type {
  ActiveFilter,
  PendingRow,
} from "../../../hooks/useDashboardFilters";

interface AnalyticsFiltersProps {
  definitions: DashboardFilterDefinition[];
  filterState: Record<string, ActiveFilter>;
  pendingRows: PendingRow[];
  activeCount: number;
  canApply: boolean;
  isApplying: boolean;
  onFilterChange: (
    filterId: string,
    operator: string,
    value?: unknown,
    includeBlank?: boolean,
  ) => void;
  onRemoveFilter: (filterId: string) => void;
  onAddFilter: () => void;
  onRemovePendingRow: (tempId: string) => void;
  onCommitPendingRow: (
    pendingId: string,
    filterId: string,
    defaultOperator: string,
  ) => void;
  onApply: () => void;
  onClearAll: () => void;
}

/**
 * Dashboard filter button shown in the toolbar row.
 * Renders a popover with condition rows (field + operator + value).
 */
const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = (props) => {
  return <DashboardFilterPopover {...props} />;
};

export { AnalyticsFilters };
