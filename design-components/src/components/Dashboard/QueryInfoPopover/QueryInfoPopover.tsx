import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CodeIcon, XIcon, CopyIcon, CheckIcon } from '@phosphor-icons/react';
import { useVisibilityToggle } from '../../../hooks/useVisibilityToggle';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import type { QueryInfo } from '../types';

interface QueryInfoPopoverProps {
  queryInfo: QueryInfo;
}

const QueryInfoPopover: React.FC<QueryInfoPopoverProps> = ({ queryInfo }) => {
  const { isVisible: open, hide, toggleVisibility } = useVisibilityToggle();
  const { copy, copied } = useCopyToClipboard();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 6,
      left: Math.max(8, rect.left - 280),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();

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

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          toggleVisibility();
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 cursor-pointer shrink-0"
        title="View query"
      >
        <CodeIcon size={14} />
      </button>
      {open &&
        createPortal(
          <div
            ref={popoverRef}
            className="fixed z-[10000] w-[360px] bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
            style={{ top: position.top, left: position.left }}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-700">Query</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => copy(queryInfo.sql)}
                  className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
                  title="Copy SQL"
                >
                  {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
                </button>
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
            </div>
            {queryInfo.description && (
              <div className="px-3 py-1.5 border-b border-gray-100">
                <p className="text-xs text-gray-500">{queryInfo.description}</p>
              </div>
            )}
            <div className="p-3 max-h-[240px] overflow-auto">
              <pre className="text-[11px] leading-relaxed text-gray-800 font-mono whitespace-pre-wrap break-words">
                {queryInfo.sql}
              </pre>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export { QueryInfoPopover };
