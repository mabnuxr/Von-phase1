import { ArrowsClockwiseIcon } from "@phosphor-icons/react";

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  canRefresh?: boolean;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  canRefresh = true,
}) => (
  <button
    onClick={canRefresh ? onRefresh : undefined}
    disabled={!canRefresh}
    title={canRefresh ? "Refresh data" : "Save the dashboard to refresh data"}
    className={`inline-flex items-center justify-center w-[34px] h-[34px] border rounded-xl transition-colors ${
      !canRefresh
        ? "text-gray-400 bg-white border-gray-200/70 cursor-not-allowed"
        : "text-gray-800 bg-white border-gray-200/70 hover:bg-gray-50 cursor-pointer"
    }`}
  >
    <ArrowsClockwiseIcon size={14} />
  </button>
);
