import { ArrowsClockwiseIcon } from "@phosphor-icons/react";

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({ onRefresh }) => (
  <button
    onClick={onRefresh}
    title="Refresh data"
    className="inline-flex items-center justify-center w-[34px] h-[34px] text-gray-800 bg-white border border-gray-200/70 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
  >
    <ArrowsClockwiseIcon size={14} />
  </button>
);
