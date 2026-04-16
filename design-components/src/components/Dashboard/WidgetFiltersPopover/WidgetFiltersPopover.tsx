import { createPortal } from 'react-dom';
import { FunnelIcon, XIcon } from '@phosphor-icons/react';
import { usePortalPopover } from '../../../hooks/usePortalPopover';
import type { AppliedWidgetFilter } from '../types';

const POPOVER_WIDTH = 320;

interface WidgetFiltersPopoverProps {
  filters: AppliedWidgetFilter[];
}

const WidgetFiltersPopover: React.FC<WidgetFiltersPopoverProps> = ({ filters }) => {
  const { open, hide, toggleVisibility, triggerRef, popoverRef, position } = usePortalPopover({
    popoverWidth: POPOVER_WIDTH,
  });

  if (filters.length === 0) return null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          toggleVisibility();
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity relative flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 cursor-pointer shrink-0"
        title="View applied filters"
      >
        <FunnelIcon size={14} />
        {filters.length > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full bg-gray-100 text-[9px] font-semibold leading-none text-gray-500">
            {filters.length}
          </span>
        )}
      </button>
      {open &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              zIndex: 10000,
              width: POPOVER_WIDTH,
            }}
            className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-700">Applied Filters</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  hide();
                }}
                className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
              >
                <XIcon size={12} />
              </button>
            </div>
            <div className="p-3 flex flex-col gap-2 max-h-[240px] overflow-auto">
              {filters.map((filter, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-gray-700">{filter.label}</span>
                    <span className="text-[11px] text-gray-400">{filter.operatorLabel}</span>
                  </div>
                  {(filter.values.length > 0 || filter.includeBlank) && (
                    <div className="flex flex-wrap gap-1">
                      {filter.values.map((val, j) => (
                        <span
                          key={j}
                          className="inline-flex items-center px-1.5 py-0.5 text-[11px] font-medium text-gray-700 bg-gray-100 rounded-md"
                        >
                          {val}
                        </span>
                      ))}
                      {filter.includeBlank && (
                        <span className="inline-flex items-center px-1.5 py-0.5 text-[11px] font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-md italic">
                          Include blanks
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export { WidgetFiltersPopover };
