import { ArrowClockwise } from "@phosphor-icons/react";
import type { RefreshInfo } from "../../../types/dashboard";

interface AnalyticsHeaderProps {
  title: string;
  description?: string;
  refreshInfo: RefreshInfo | null;
  onRefresh: () => Promise<void>;
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  title,
  description,
  refreshInfo,
  onRefresh,
}) => {
  const isRefreshing = refreshInfo?.refreshStatus === "refreshing";

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-gray-900 truncate">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-gray-500 mt-0.5 truncate">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {refreshInfo && (
          <span className="text-xs text-gray-400">
            Updated {formatRelativeTime(refreshInfo.lastRefreshedAt)}
          </span>
        )}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          <ArrowClockwise
            size={14}
            weight="bold"
            className={isRefreshing ? "animate-spin" : ""}
          />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
    </div>
  );
};

export { AnalyticsHeader };
