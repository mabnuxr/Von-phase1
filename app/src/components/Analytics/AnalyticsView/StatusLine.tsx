import { formatRelativeTime } from "@vonlabs/design-components";

interface StatusLineProps {
  lastRefreshedAt?: string | null;
}

export const StatusLine: React.FC<StatusLineProps> = ({ lastRefreshedAt }) => {
  const refreshedLabel = lastRefreshedAt
    ? formatRelativeTime(lastRefreshedAt)
    : null;

  if (!refreshedLabel) return null;

  return (
    <span className="flex items-center gap-1 text-xs bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1.5 leading-none">
      <span className="text-gray-700">Refreshed {refreshedLabel}</span>
    </span>
  );
};
