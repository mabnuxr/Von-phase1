import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FunnelIcon, XIcon } from '@phosphor-icons/react';
import { useVisibilityToggle } from '../../../hooks/useVisibilityToggle';
import type { AppliedWidgetFilter } from '../types';

interface WidgetFiltersPopoverProps {
  filters: AppliedWidgetFilter[];
}

const WidgetFiltersPopover: React.FC<WidgetFiltersPopoverProps> = ({ filters }) => {
  const { isVisible: open, hide, toggleVisibility } = useVisibilityToggle();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const popoverWidth = 320;
    const maxPopoverHeight = 240 + 44; // max content + header
    const popoverHeight = popoverRef.current?.offsetHeight || maxPopoverHeight;
    let left = rect.left - popoverWidth + rect.width;
    const rightEdge = left + popoverWidth;

    if (left < 8) {
      left = 8;
    } else if (rightEdge > window.innerWidth - 8) {
      left = window.innerWidth - popoverWidth - 8;
    }

    let top = rect.bottom + 6;
    if (top + popoverHeight > window.innerHeight - 8) {
      top = rect.top - popoverHeight - 6;
    }

    setPosition({ top: Math.max(8, top), left });
  }, []);

  useEffect(() => {
    if (!open) return;
    // Initial position, then refine after popover renders and has actual height
    updatePosition();
    requestAnimationFrame(updatePosition);

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        hide();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', updatePosition);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition, hide]);

  if (filters.length === 0) return null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          toggleVisibility();
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 cursor-pointer shrink-0"
        title="View applied filters"
      >
        <FunnelIcon size={14} />
      </button>
      {open &&
        createPortal(
          <div
            ref={popoverRef}
            className="fixed z-[10000] w-[320px] bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
            style={{ top: position.top, left: position.left }}
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
    </>
  );
};

export { WidgetFiltersPopover };
