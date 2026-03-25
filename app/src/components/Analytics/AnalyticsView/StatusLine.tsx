import { formatRelativeTime } from "@vonlabs/design-components";
import { DashboardStatus } from "../../../types/dashboard";

interface StatusLineProps {
  state: DashboardStatus;
  lastSavedAt?: string | null;
  lastRefreshedAt?: string | null;
}

export const StatusLine: React.FC<StatusLineProps> = ({
  state,
  lastSavedAt,
  lastRefreshedAt,
}) => {
  const isDraft = state === DashboardStatus.Draft;
  const colorClass = isDraft ? "text-amber-700" : "text-emerald-700";

  return (
    <span className="flex items-center gap-1 text-xs bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1.5 leading-none">
      <span className={`${colorClass} font-medium`}>
        {isDraft ? "Draft" : "Published"}
      </span>
      {lastSavedAt && (
        <span className={colorClass}>{formatRelativeTime(lastSavedAt)}</span>
      )}
      {lastRefreshedAt && (
        <span className="text-gray-700">
          · Refreshed {formatRelativeTime(lastRefreshedAt)}
        </span>
      )}
    </span>
  );
};
