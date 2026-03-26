import React from 'react';
import { Streamdown } from 'streamdown';
import { PrimaryButton, SecondaryButton } from '../../forms/buttons/ActionButtons';
import { ClockIcon, DatabaseIcon, FileTextIcon } from '@phosphor-icons/react';
import type { ResearchResultsMetadata } from './types';

// ============================================================================
// Types
// ============================================================================

export interface DeepResearchAction {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the action is loading */
  isLoading?: boolean;
}

export interface DataSourceInfo {
  /** Name of the data source */
  name: string;
  /** Number of records in this source */
  recordCount: number;
  /** Description of what data will be analyzed */
  description?: string;
}

export interface DeepResearchApprovalCardProps {
  /**
   * Sample analysis content (markdown) to display
   */
  content: string;

  /**
   * Whether the content is still streaming
   * @default false
   */
  isStreaming?: boolean;

  /**
   * Metadata from RESEARCH_RESULTS_START event
   */
  metadata?: ResearchResultsMetadata | null;

  /**
   * Primary action (e.g., "Create Dashboard")
   */
  primaryAction: DeepResearchAction;

  /**
   * Secondary action (e.g., "Skip", "Decline")
   */
  secondaryAction?: DeepResearchAction;

  /**
   * Title to display above the content
   * @default "Sample Analysis"
   */
  title?: string;

  /**
   * Subtitle/description to display
   */
  subtitle?: string;

  /**
   * Estimated time for full analysis
   */
  estimatedTime?: string;

  /**
   * Data sources that will be analyzed
   */
  dataSources?: DataSourceInfo[];

  /**
   * Total record count across all sources
   */
  totalRecords?: number;

  /**
   * Custom content to render above the markdown
   */
  headerContent?: React.ReactNode;

  /**
   * Custom content to render above the action buttons
   */
  beforeActions?: React.ReactNode;

  /**
   * Custom className for the container
   */
  className?: string;
}

// ============================================================================
// Helper Components
// ============================================================================

interface MetadataRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

const MetadataRow: React.FC<MetadataRowProps> = ({ icon, label, value }) => (
  <div className="flex items-center gap-2 text-sm text-gray-600">
    <span className="text-gray-400">{icon}</span>
    <span className="font-medium text-gray-700">{label}:</span>
    <span>{value}</span>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

/**
 * DeepResearchApprovalCard - Shows sample analysis and approval actions for deep research
 *
 * This component is displayed after RESEARCH_RESULTS_END event when the user
 * needs to decide whether to proceed with full analysis or skip.
 */
export const DeepResearchApprovalCard: React.FC<DeepResearchApprovalCardProps> = ({
  content,
  isStreaming = false,
  metadata,
  primaryAction,
  secondaryAction,
  title = 'Sample Analysis',
  subtitle,
  estimatedTime,
  dataSources,
  totalRecords,
  headerContent,
  beforeActions,
  className = '',
}) => {
  // Calculate total records from data sources if not provided
  const effectiveTotalRecords =
    totalRecords ?? dataSources?.reduce((sum, ds) => sum + ds.recordCount, 0);

  return (
    <div className={`overflow-hidden ${className}`}>
      {/* Header */}
      <div className="mb-4">
        {/* Title */}
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>

        {/* Subtitle or plan name from metadata */}
        {(subtitle || metadata?.plan_name) && (
          <p className="text-sm text-gray-600 mt-1">{subtitle || metadata?.plan_name}</p>
        )}

        {/* Custom header content */}
        {headerContent && <div className="mt-3">{headerContent}</div>}

        {/* Metadata info bar */}
        {(estimatedTime || effectiveTotalRecords || dataSources) && (
          <div className="mt-3 flex flex-wrap gap-4">
            {estimatedTime && (
              <MetadataRow
                icon={<ClockIcon size={16} />}
                label="Estimated time"
                value={estimatedTime}
              />
            )}
            {effectiveTotalRecords !== undefined && effectiveTotalRecords > 0 && (
              <MetadataRow
                icon={<DatabaseIcon size={16} />}
                label="Records"
                value={effectiveTotalRecords.toLocaleString()}
              />
            )}
            {dataSources && dataSources.length > 0 && (
              <MetadataRow
                icon={<FileTextIcon size={16} />}
                label="Sources"
                value={dataSources.length}
              />
            )}
          </div>
        )}

        {/* Data sources detail */}
        {dataSources && dataSources.length > 0 && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-700 mb-2">Data sources to analyze:</p>
            <div className="space-y-1">
              {dataSources.map((source, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700">{source.name}</span>
                  <span className="text-gray-500">
                    {source.recordCount.toLocaleString()} records
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sample Analysis Content */}
      <div className="py-2">
        <div className="prose-sm markdown-body max-w-none">
          <Streamdown
            parseIncompleteMarkdown={isStreaming}
            isAnimating={isStreaming}
            controls={{ table: true }}
          >
            {content}
          </Streamdown>
        </div>
      </div>

      {/* Custom content before actions */}
      {beforeActions && <div className="mt-4">{beforeActions}</div>}

      {/* Separator and Action Buttons */}
      <div className="mt-4 pt-3 pb-1 border-t border-gray-100 flex items-center gap-2">
        {secondaryAction && (
          <SecondaryButton
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled || secondaryAction.isLoading}
          >
            {secondaryAction.label}
          </SecondaryButton>
        )}
        <PrimaryButton
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled || primaryAction.isLoading}
        >
          {primaryAction.isLoading ? 'Processing...' : primaryAction.label}
        </PrimaryButton>
      </div>
    </div>
  );
};

export default DeepResearchApprovalCard;
