import React from 'react';
import { ArrowSquareOutIcon, CopyIcon, TrashSimpleIcon } from '@phosphor-icons/react';

// Inline Chip component (since design-components can't import from app)
interface ChipProps {
  variant: 'workspace' | 'personal' | 'connected';
  size?: 'small' | 'medium';
}

const Chip: React.FC<ChipProps> = ({ variant, size = 'small' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'workspace':
        return 'bg-purple-100 text-purple-700';
      case 'personal':
        return 'bg-blue-100 text-blue-700';
      case 'connected':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getSizeStyles = () => {
    return size === 'small' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  };

  const getLabel = () => {
    switch (variant) {
      case 'workspace':
        return 'Workspace';
      case 'personal':
        return 'Personal';
      case 'connected':
        return 'Connected';
      default:
        return '';
    }
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${getVariantStyles()} ${getSizeStyles()}`}
    >
      {getLabel()}
    </span>
  );
};

export interface IntegrationCardProps {
  /**
   * Integration name
   */
  name: string;

  /**
   * Description of the integration
   */
  description?: string;

  /**
   * Path to integration logo image (e.g., "/images/salesforce.svg")
   */
  integrationLogoPath: string;

  /**
   * Callback when connect button is clicked for available integrations
   * Called with true to initiate connection
   */
  onToggle?: (enabled: boolean) => void;

  /**
   * Whether the integration card is disabled (e.g., coming soon)
   * @default false
   */
  disabled?: boolean;

  /**
   * Loading state with optional text (e.g., "Authenticating... 5s")
   * When set, toggle morphs into animated progress indicator
   */
  loadingText?: string;

  /**
   * Instance URL to display (copyable)
   */
  instanceUrl?: string;

  /**
   * Callback when delete button is clicked
   */
  onDelete?: () => void;

  /**
   * Status chips to display (workspace, personal, connected)
   */
  chips?: Array<'workspace' | 'personal' | 'connected'>;

  /**
   * User who modified/created the integration (e.g., "John Doe")
   */
  modifiedBy?: string;

  /**
   * Whether this integration is available but not connected
   * If true, shows "Connect" button instead of toggle
   * @default false
   */
  isAvailable?: boolean;

  /**
   * Whether the delete button should be shown
   * If false or undefined, delete button is hidden
   * @default true when onDelete is provided
   */
  canDelete?: boolean;

  /**
   * Tooltip text for delete button (shown on hover)
   */
  deleteTooltip?: string;

  /**
   * Optional slot for custom actions rendered next to the delete button
   */
  actionSlot?: React.ReactNode;

  /**
   * Static status text shown in place of the Connect button for available integrations
   * (e.g., "Available" for integrations that don't require user-initiated connection)
   */
  statusText?: string;

  /**
   * Optional note displayed below the description (e.g., prerequisite info)
   */
  note?: string;

  /**
   * Show an external-link icon on the Connect button
   * @default false
   */
  showConnectArrow?: boolean;
}

/**
 * IntegrationCard - Card component for displaying integration options
 *
 * List-style card with icon, name, description on the left
 * and action button on the right. Clean, minimal design.
 *
 * @example
 * ```tsx
 * <IntegrationCard
 *   name="Salesforce"
 *   description="Sync opportunities, contacts, and accounts from Salesforce CRM"
 *   integrationLogoPath="/images/salesforce.svg"
 *   enabled={false}
 *   onToggle={(enabled) => console.log('Salesforce:', enabled)}
 * />
 * ```
 */
export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  name,
  description,
  integrationLogoPath,
  onToggle,
  disabled = false,
  loadingText,
  instanceUrl,
  onDelete,
  chips,
  modifiedBy,
  isAvailable = false,
  canDelete = true,
  deleteTooltip,
  actionSlot,
  statusText,
  note,
  showConnectArrow = false,
}) => {
  const isLoading = !!loadingText;

  const handleCopyUrl = async () => {
    if (instanceUrl) {
      try {
        await navigator.clipboard.writeText(instanceUrl);
      } catch (err) {
        console.error('Failed to copy URL:', err);
      }
    }
  };

  return (
    <div
      className={`
        flex items-center justify-between px-4 py-4 bg-white antialiased
        ${disabled && !isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-default'}
      `}
    >
      {/* Left side - Icon and Info */}
      <div className="flex items-center gap-4">
        {/* Integration Logo */}
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          <img
            src={integrationLogoPath}
            alt={`${name} logo`}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Name, Description, and Metadata */}
        <div className="flex flex-col gap-1">
          {/* Name and Chips */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{name}</span>
            {chips && chips.length > 0 && (
              <div className="flex gap-1">
                {chips
                  .filter((variant) => variant !== 'connected')
                  .map((variant) => (
                    <Chip key={variant} variant={variant} size="small" />
                  ))}
              </div>
            )}
          </div>

          {/* Description */}
          {description && <span className="text-sm text-gray-500">{description}</span>}
          {note && <span className="text-xs text-gray-400 italic">Note: {note}</span>}

          {/* Modified By */}
          {modifiedBy && <span className="text-xs text-gray-500">Modified by: {modifiedBy}</span>}

          {/* Instance URL */}
          {instanceUrl && (
            <button
              onClick={handleCopyUrl}
              className="text-xs text-gray-400 hover:text-gray-600 text-left m-0 p-0 border-none bg-transparent cursor-pointer flex items-center gap-1 group"
              title="Click to copy"
            >
              <span className="truncate max-w-50">{instanceUrl}</span>
              <CopyIcon
                size={12}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </button>
          )}
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-3 shrink-0 ml-4">
        {/* Status indicator */}
        {isLoading && <span className="text-sm text-von-purple font-medium">{loadingText}</span>}

        {/* If this is an available integration, show Connect button or Coming soon */}
        {isAvailable ? (
          statusText ? (
            <span className="px-3 py-1.5 bg-emerald-50 rounded-xl text-sm font-medium text-emerald-700">
              {statusText}
            </span>
          ) : onToggle && !disabled ? (
            <button
              onClick={() => onToggle(true)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors hover:cursor-pointer flex items-center gap-1.5"
            >
              Connect
              {showConnectArrow && <ArrowSquareOutIcon size={14} />}
            </button>
          ) : disabled ? (
            <span className="text-sm text-gray-400">Coming soon</span>
          ) : null
        ) : (
          <>
            {/* Connected chip - show if it's in the chips array */}
            {chips?.includes('connected') && <Chip variant="connected" size="small" />}

            {/* Custom action slot */}
            {actionSlot}

            {/* Single delete button - always */}
            {onDelete && canDelete && (
              <div className="relative group">
                <button
                  onClick={onDelete}
                  className="p-1.5 hover:bg-red-50 rounded transition-colors cursor-pointer border-none bg-transparent text-gray-500 hover:text-red-600"
                  aria-label="Delete integration"
                >
                  <TrashSimpleIcon size={16} />
                </button>
                {deleteTooltip && (
                  <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {deleteTooltip}
                    <div className="absolute top-full right-2 border-4 border-transparent border-t-gray-900" />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default IntegrationCard;
