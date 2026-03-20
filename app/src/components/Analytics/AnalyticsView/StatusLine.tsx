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
}) => (
  <span className="flex items-center gap-1 text-xs bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1.5 leading-none">
    {state === DashboardStatus.Draft ? (
      <span className="text-amber-700 font-medium">Draft</span>
    ) : (
      <span className="text-emerald-700 font-medium">Published</span>
    )}
    {lastSavedAt && (
      <span className="text-gray-700">
        {" "}
        · {formatRelativeTime(lastSavedAt)}
      </span>
    )}
    {lastRefreshedAt && (
      <span className="text-gray-700">
        {" "}
        · Refreshed {formatRelativeTime(lastRefreshedAt)}
      </span>
    )}
  </span>
);
