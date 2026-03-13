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
  <span className="text-xs text-gray-500">
    {state === DashboardStatus.Draft ? (
      "Draft"
    ) : (
      <span className="text-emerald-600">Saved</span>
    )}
    {lastSavedAt && <> · {formatRelativeTime(lastSavedAt)}</>}
    {lastRefreshedAt && <> · Refreshed {formatRelativeTime(lastRefreshedAt)}</>}
  </span>
);
