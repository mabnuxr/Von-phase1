import { TableIcon } from '@phosphor-icons/react';
import { QueryInfoPopover } from '../QueryInfoPopover';
import { WidgetFiltersPopover } from '../WidgetFiltersPopover';
import { AddToChatButton } from '../../VonIcon';
import { DragPill } from '../DragPill';
import type { WidgetShellProps } from '../types';

/**
 * View-only card wrapper for dashboard widgets.
 * Provides title, optional subtitle, and content area.
 * Shows a drilldown icon on hover when onDrillDown is provided.
 * In edit mode, renders the orange tab-pill drag handle next to the title.
 */
const WidgetShell: React.FC<WidgetShellProps> = ({
  title,
  subtitle,
  children,
  onDrillDown,
  queryInfo,
  appliedFilters,
  filterSlot,
  onAddToChat,
  isEditMode,
}) => {
  return (
    <div className="group h-full bg-white border border-gray-200 flex flex-col cursor-default hover:border-gray-300 transition-all overflow-hidden">
      <div className="relative flex items-center gap-2 px-4 py-3 border-b border-gray-100 shrink-0">
        {isEditMode && <DragPill label={title} />}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-800 truncate">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-0.5">
          {onAddToChat && <AddToChatButton onClick={onAddToChat} />}
          {filterSlot
            ? filterSlot
            : appliedFilters && <WidgetFiltersPopover filters={appliedFilters} />}
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
