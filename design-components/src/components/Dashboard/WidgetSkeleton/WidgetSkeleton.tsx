import type { WidgetConfig } from '../types';

/**
 * Per-widget skeleton shown while dashboard data is being refetched.
 * Shape varies by widget type to match the real widget layout.
 */
const WidgetSkeleton: React.FC<{ widget: WidgetConfig }> = ({ widget }) => {
  switch (widget.type) {
    case 'counter':
      return (
        <div className="h-full bg-white border border-gray-200 px-4 py-4 flex flex-col items-center justify-center">
          <div className="h-3 w-24 bg-gray-100 rounded animate-pulse mb-2.5" />
          <div className="h-7 w-28 bg-gray-100 rounded animate-pulse mb-2" />
          <div className="h-3 w-20 bg-gray-50 rounded animate-pulse" />
        </div>
      );

    case 'chart':
      return (
        <div className="h-full bg-white border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="flex-1 p-3 flex items-end gap-2">
            {[40, 65, 50, 80, 55, 70, 45].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-gray-100 rounded-t animate-pulse"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      );

    case 'table':
      return (
        <div className="h-full bg-white border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="flex-1 p-3 space-y-2.5">
            <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-3 w-full bg-gray-50 rounded animate-pulse" />
            <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
            <div className="h-3 w-full bg-gray-50 rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      );

    case 'text':
      return (
        <div className="h-full px-2 py-1.5">
          <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
        </div>
      );

    default:
      return (
        <div className="h-full bg-white border border-gray-200 p-3">
          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-3" />
          <div className="h-20 bg-gray-50 rounded animate-pulse" />
        </div>
      );
  }
};

export { WidgetSkeleton };
