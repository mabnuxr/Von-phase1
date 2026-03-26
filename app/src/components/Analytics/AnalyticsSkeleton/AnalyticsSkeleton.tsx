/**
 * Shimmer skeleton that mirrors the dashboard layout:
 * header, filter pills, KPI cards row, chart row, and table area.
 */
const AnalyticsSkeleton = () => (
  <div className="flex flex-col flex-1 min-w-0 h-full rounded-xl bg-white shadow-xs border border-gray-100 overflow-hidden">
    {/* Header */}
    <div className="px-4 pt-4 pb-2 space-y-2">
      <div className="h-5 w-48 bg-gray-100 rounded animate-pulse" />
      <div className="h-3 w-72 bg-gray-100 rounded animate-pulse" />
    </div>

    {/* Filter pills */}
    <div className="px-4 pb-3 flex gap-2">
      <div className="h-7 w-24 bg-gray-100 rounded-full animate-pulse" />
      <div className="h-7 w-20 bg-gray-100 rounded-full animate-pulse" />
      <div className="h-7 w-28 bg-gray-100 rounded-full animate-pulse" />
    </div>

    {/* Grid area */}
    <div className="flex-1 px-4 pb-4 space-y-4 overflow-hidden">
      {/* KPI cards row */}
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 bg-gray-50 rounded-lg border border-gray-100 animate-pulse"
          />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="h-52 bg-gray-50 rounded-lg border border-gray-100 animate-pulse" />
        <div className="h-52 bg-gray-50 rounded-lg border border-gray-100 animate-pulse" />
      </div>

      {/* Table area */}
      <div className="h-40 bg-gray-50 rounded-lg border border-gray-100 animate-pulse" />
    </div>
  </div>
);

export { AnalyticsSkeleton };
