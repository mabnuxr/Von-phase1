import type { DashboardFilter } from '../../../types/dashboard';

interface DashboardFiltersProps {
  filters: DashboardFilter[];
  activeFilters: Record<string, unknown>;
}

function getFilterDisplayValue(filter: DashboardFilter, value: unknown): string | null {
  if (value === undefined || value === null) return null;

  // For select filters, find the matching option label
  if (filter.options) {
    if (Array.isArray(value)) {
      const labels = value
        .map((v) => filter.options?.find((o) => o.value === v)?.label ?? String(v))
        .filter(Boolean);
      return labels.length > 0 ? labels.join(', ') : null;
    }
    const option = filter.options.find((o) => o.value === value);
    return option?.label ?? String(value);
  }

  return String(value);
}

/**
 * View-only filter pills showing the active/default filter values.
 * No interactive controls — filters are agentic-only.
 */
const DashboardFilters: React.FC<DashboardFiltersProps> = ({ filters, activeFilters }) => {
  const visibleFilters = filters.filter((f) => {
    const value = activeFilters[f.id];
    return value !== undefined && value !== null;
  });

  if (visibleFilters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-1 pb-2 flex-wrap">
      {visibleFilters.map((filter) => {
        const displayValue = getFilterDisplayValue(filter, activeFilters[filter.id]);
        if (!displayValue) return null;

        return (
          <span
            key={filter.id}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md"
          >
            <span className="text-gray-400">{filter.label}:</span>
            <span>{displayValue}</span>
          </span>
        );
      })}
    </div>
  );
};

export { DashboardFilters };
