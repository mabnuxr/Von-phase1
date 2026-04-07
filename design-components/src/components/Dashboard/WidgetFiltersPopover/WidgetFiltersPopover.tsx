import { useRef, useEffect } from 'react';
import { FunnelIcon, XIcon } from '@phosphor-icons/react';
import { useVisibilityToggle } from '../../../hooks/useVisibilityToggle';
import type { AppliedWidgetFilter } from '../types';

interface WidgetFiltersPopoverProps {
  filters: AppliedWidgetFilter[];
}

const WidgetFiltersPopover: React.FC<WidgetFiltersPopoverProps> = ({ filters }) => {
  const { isVisible: open, hide, toggleVisibility } = useVisibilityToggle();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        hide();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, hide]);

  if (filters.length === 0) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleVisibility();
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 cursor-pointer shrink-0"
        title="View applied filters"
      >
        <FunnelIcon size={14} />
      </button>
      {open && (
        <div
          className="absolute top-full right-0 mt-1.5 z-10 w-[320px] bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
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
        </div>
      )}
    </div>
  );
};

export { WidgetFiltersPopover };
