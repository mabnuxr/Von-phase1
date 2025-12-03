import React from 'react';
import { motion } from 'framer-motion';
import { CopyIcon, PencilSimpleIcon } from '@phosphor-icons/react';

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
   * Whether the integration is enabled
   * @default false
   */
  enabled?: boolean;

  /**
   * Callback when toggle state changes
   * For disabling (enabled -> disabled), this will be called with the new state
   * The parent should handle showing confirmation modal
   */
  onToggle?: (enabled: boolean) => void;

  /**
   * Callback to request confirmation before disabling
   * Returns a promise that resolves to true if confirmed, false if cancelled
   */
  onRequestDisableConfirmation?: () => Promise<boolean>;

  /**
   * Whether the toggle is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Loading state with optional text (e.g., "Authenticating... 5s")
   * When set, toggle morphs into animated progress indicator
   */
  loadingText?: string;

  /**
   * Environment level - "dev" or "prod"
   */
  environment?: 'dev' | 'prod';

  /**
   * User or tenant name
   */
  userOrTenant?: string;

  /**
   * Instance URL to display (copyable)
   */
  instanceUrl?: string;

  /**
   * Callback when edit button is clicked
   */
  onEdit?: () => void;
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
  enabled = false,
  onToggle,
  onRequestDisableConfirmation,
  disabled = false,
  loadingText,
  environment,
  userOrTenant,
  instanceUrl,
  onEdit,
}) => {
  const isLoading = !!loadingText;

  const handleToggle = async () => {
    if (disabled || isLoading) return;

    const newState = !enabled;

    // If disabling and confirmation callback exists, request confirmation
    if (enabled && !newState && onRequestDisableConfirmation) {
      const confirmed = await onRequestDisableConfirmation();
      if (!confirmed) {
        return; // User cancelled, don't toggle
      }
    }

    // Toggle immediately if enabling, or after confirmation if disabling
    onToggle?.(newState);
  };

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
        flex items-center justify-between px-4 py-4 bg-white antialiased font-sf
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-default'}
      `}
    >
      {/* Left side - Icon and Info */}
      <div className="flex items-center gap-4">
        {/* Integration Logo */}
        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
          <img
            src={integrationLogoPath}
            alt={`${name} logo`}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Name, Description, and Metadata */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900">{name}</span>
            {userOrTenant && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {userOrTenant}
              </span>
            )}
            {environment && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  environment === 'prod'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-orange-50 text-orange-700 border border-orange-200'
                }`}
              >
                {environment}
              </span>
            )}
          </div>
          {description && (
            <span className="text-sm text-gray-500">{description}</span>
          )}
          {instanceUrl && (
            <button
              onClick={handleCopyUrl}
              className="text-xs text-gray-400 hover:text-gray-600 text-left m-0 p-0 border-none bg-transparent cursor-pointer flex items-center gap-1 group"
              title="Click to copy"
            >
              <span className="truncate max-w-[200px]">{instanceUrl}</span>
              <CopyIcon
                size={12}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </button>
          )}
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
        {/* Status indicator */}
        {isLoading && (
          <span className="text-sm text-von-purple font-medium">{loadingText}</span>
        )}

        {/* Edit button */}
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors cursor-pointer border-none bg-transparent"
            aria-label="Edit integration"
          >
            <PencilSimpleIcon size={16} />
          </button>
        )}

        {/* Toggle switch */}
        <button
          className={`
            relative w-11 h-6 rounded-full border-none p-0 shrink-0 overflow-hidden
            transition-colors duration-200
            ${disabled || isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}
            ${isLoading ? 'bg-gray-200' : enabled ? 'bg-von-purple' : 'bg-gray-200'}
          `}
          onClick={handleToggle}
          disabled={disabled || isLoading}
          aria-label={`Toggle ${name} integration`}
          aria-pressed={enabled}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 w-[200%]"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(128, 57, 233, 0.6) 40%, rgba(191, 90, 242, 0.7) 50%, rgba(128, 57, 233, 0.6) 60%, transparent 100%)',
                }}
                animate={{ x: ['0%', '50%'] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </div>
          ) : (
            <motion.div
              className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
              animate={{ left: enabled ? '22px' : '2px' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />
          )}
        </button>
      </div>
    </div>
  );
};

export default IntegrationCard;
