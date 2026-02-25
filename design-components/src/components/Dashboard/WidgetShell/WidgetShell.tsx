import type { WidgetShellProps } from '../types';

/**
 * View-only card wrapper for dashboard widgets.
 * Provides title, optional subtitle, and content area.
 */
const WidgetShell: React.FC<WidgetShellProps> = ({ title, subtitle, children }) => {
  return (
    <div className="h-full bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
      <div className="flex items-center px-3 py-2 border-b border-gray-100 shrink-0">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
};

export { WidgetShell };
