/**
 * RightPanel — slide-in panel from the right, overlaying main content.
 * Fixed 480px width. Backdrop dims content behind it.
 */

import { XIcon } from "@phosphor-icons/react";

export interface RightPanelBadge {
  text: string;
  color: "gray" | "amber" | "green" | "red";
}

export interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  badge?: RightPanelBadge;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const BADGE_STYLES: Record<RightPanelBadge["color"], string> = {
  gray:  "bg-gray-100 text-gray-600 border border-gray-200",
  amber: "bg-amber-50 text-amber-700 border border-amber-200",
  green: "bg-green-50 text-green-700 border border-green-200",
  red:   "bg-red-50 text-red-700 border border-red-200",
};

export function RightPanel({ isOpen, onClose, title, badge, children, footer }: RightPanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-[480px] bg-white shadow-xl border-l border-gray-200 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
            {badge && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${BADGE_STYLES[badge.color]}`}>
                {badge.text}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer flex-shrink-0 ml-2"
          >
            <XIcon size={16} weight="bold" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {children}
        </div>

        {/* Sticky footer */}
        {footer && (
          <div className="flex-shrink-0 border-t border-gray-200 px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
