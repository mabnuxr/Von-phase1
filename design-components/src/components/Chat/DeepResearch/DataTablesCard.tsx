import React from 'react';
import { CaretRightIcon } from '@phosphor-icons/react';

// ============================================================================
// Types
// ============================================================================

export interface DataTablesCardProps {
  /**
   * Number of tables available for review
   */
  tableCount: number;
  /**
   * Number of records processed (sample size)
   */
  processedRecords?: number;
  /**
   * Total number of records available
   */
  totalRecords?: number;
  /**
   * Called when the card is clicked to open the drawer
   */
  onClick: () => void;
  /**
   * Title text (default: "Review source data")
   */
  title?: string;
  /**
   * Badge text (default: "Needs review")
   */
  badge?: string;
  /**
   * Whether to show the badge
   */
  showBadge?: boolean;
  /**
   * Button text (default: "Review")
   */
  buttonText?: string;
  /**
   * Custom description text (overrides default)
   */
  description?: string;
  /**
   * Whether the card is in loading state
   */
  isLoading?: boolean;
}

// ============================================================================
// Loading Skeleton Component
// ============================================================================

const DataTablesCardSkeleton: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-between gap-4 px-4 py-3 bg-white border border-gray-200 rounded-xl animate-pulse">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="h-5 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
        <div className="h-4 w-48 bg-gray-100 rounded mt-1.5" />
      </div>
      <div className="h-8 w-20 bg-gray-200 rounded-xl" />
    </div>
  );
};

// ============================================================================
// Main Component - Card to encourage data review before full analysis
// ============================================================================

/**
 * DataTablesCard - A card component that appears after sample analysis
 * to encourage users to review the source data before running full analysis.
 */
export const DataTablesCard: React.FC<DataTablesCardProps> = ({
  tableCount,
  processedRecords,
  totalRecords,
  onClick,
  title = 'Review source data',
  badge = 'Needs review',
  showBadge = true,
  buttonText = 'Review',
  description,
  isLoading = false,
}) => {
  // Show skeleton when loading
  if (isLoading) {
    return <DataTablesCardSkeleton />;
  }

  // Generate default description if not provided
  const defaultDescription =
    processedRecords && totalRecords
      ? `${tableCount} ${tableCount === 1 ? 'artifact' : 'artifacts'} · ${processedRecords} of ${totalRecords.toLocaleString()} records processed. Please review.`
      : `${tableCount} ${tableCount === 1 ? 'artifact' : 'artifacts'} generated during planning.`;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-4 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer group"
    >
      <div className="text-left">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{title}</span>
          {showBadge && badge && (
            <span className="inline-flex items-center px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-medium rounded">
              {badge}
            </span>
          )}
        </div>
        <div className="text-[13px] text-gray-500 mt-0.5">{description || defaultDescription}</div>
      </div>

      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 rounded-xl text-[13px] font-medium text-white group-hover:bg-gray-800 transition-colors">
        <span>{buttonText}</span>
        <CaretRightIcon size={14} weight="bold" />
      </div>
    </button>
  );
};

export default DataTablesCard;
