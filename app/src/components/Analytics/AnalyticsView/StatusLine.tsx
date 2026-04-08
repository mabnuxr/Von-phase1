import { ensureUTC, formatRelativeTime } from "@vonlabs/design-components";

interface StatusLineProps {
  lastRefreshedAt?: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const StatusLine: React.FC<StatusLineProps> = ({ lastRefreshedAt }) => {
  const refreshedLabel = lastRefreshedAt
    ? formatRelativeTime(lastRefreshedAt)
    : null;

  if (!refreshedLabel) return null;

  const isStale =
    !!lastRefreshedAt &&
    Date.now() - new Date(ensureUTC(lastRefreshedAt)).getTime() > DAY_MS;

  return (
    <span
      className={`flex items-center gap-1 text-xs rounded-full px-2.5 py-1.5 leading-none border ${
        isStale
          ? "bg-amber-50 border-amber-200 text-amber-700"
          : "bg-gray-50 border-gray-100 text-gray-700"
      }`}
    >
      Refreshed {refreshedLabel}
    </span>
  );
};
