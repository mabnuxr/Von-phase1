import { createPortal } from 'react-dom';
import { CodeIcon, XIcon, CopyIcon, CheckIcon } from '@phosphor-icons/react';
import { usePortalPopover } from '../../../hooks/usePortalPopover';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import type { QueryInfo } from '../types';

const POPOVER_WIDTH = 360;

interface QueryInfoPopoverProps {
  queryInfo: QueryInfo;
  onOpen?: () => void;
  onSQLCopied?: () => void;
}

const QueryInfoPopover: React.FC<QueryInfoPopoverProps> = ({ queryInfo, onOpen, onSQLCopied }) => {
  const { open, hide, toggleVisibility, triggerRef, popoverRef, position } = usePortalPopover({
    popoverWidth: POPOVER_WIDTH,
  });
  const { copy, copied } = useCopyToClipboard();

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          if (!open) onOpen?.();
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
              <span className="text-xs font-medium text-gray-700">Query</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    copy(queryInfo.sql);
                    onSQLCopied?.();
                  }}
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
    </div>
  );
};

export { QueryInfoPopover };
