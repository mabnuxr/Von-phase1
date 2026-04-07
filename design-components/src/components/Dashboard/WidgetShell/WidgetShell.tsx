import { TableIcon } from '@phosphor-icons/react';
import { QueryInfoPopover } from '../QueryInfoPopover';
import { WidgetFiltersPopover } from '../WidgetFiltersPopover';
import type { WidgetShellProps } from '../types';

/**
 * View-only card wrapper for dashboard widgets.
 * Provides title, optional subtitle, and content area.
 * Shows a drilldown icon on hover when onDrillDown is provided.
 */
const WidgetShell: React.FC<WidgetShellProps> = ({
  title,
  subtitle,
  children,
  onDrillDown,
  queryInfo,
  appliedFilters,
}) => {
  return (
    <div className="group h-full bg-white rounded-2xl border border-gray-100 flex flex-col shadow-xs cursor-pointer hover:border-gray-200 transition-colors">
      <div className="relative flex items-center px-3 py-2.5 border-b border-gray-100 shrink-0">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-gray-900 truncate">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-0.5">
          {appliedFilters && <WidgetFiltersPopover filters={appliedFilters} />}
          {queryInfo && <QueryInfoPopover queryInfo={queryInfo} />}
          {onDrillDown && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDrillDown();
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 cursor-pointer shrink-0"
              title="View data"
            >
              <TableIcon size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
};

export { WidgetShell };
