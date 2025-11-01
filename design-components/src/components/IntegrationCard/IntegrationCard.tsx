import React from 'react';
import { motion } from 'framer-motion';

export interface IntegrationCardProps {
  /**
   * Integration name
   */
  name: string;

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
 * Two-section card with visual connection flow in upper section
 * and controls in lower section. Clean, minimal design.
 *
 * @example
 * ```tsx
 * <IntegrationCard
 *   name="Salesforce"
 *   integrationLogoPath="/images/salesforce.svg"
 *   enabled={false}
 *   onToggle={(enabled) => console.log('Salesforce:', enabled)}
 * />
 * ```
 */
export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  name,
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
    <motion.div
      className={`
        flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden antialiased font-sf
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-default'}
      `}
    >
      {/* Upper Section - Visual Connection Flow */}
      <div className="bg-white py-8 px-6 flex items-center justify-center gap-4 border-b border-gray-200">
        <img
          src={integrationLogoPath}
          alt={`${name} logo`}
          className="h-10 w-auto max-w-[120px] object-contain"
        />{' '}
        <img src="/Images/connection.svg" alt="connection" className="h-6 w-auto opacity-70" />
        <img
          src="/Images/vonlabs.png"
          alt="Von logo"
          className="h-10 w-auto max-w-[120px] object-contain"
        />
      </div>

      {/* Lower Section - Name, Status, and Toggle */}
      <div className="py-4 px-5 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-900 m-0">{name}</h3>
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

          <div className="flex items-center gap-2 shrink-0">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors cursor-pointer border-none bg-transparent"
                aria-label="Edit integration"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.334 2.00004C11.5091 1.82494 11.7169 1.68605 11.9457 1.59129C12.1745 1.49653 12.4197 1.44775 12.6673 1.44775C12.9149 1.44775 13.1601 1.49653 13.3889 1.59129C13.6177 1.68605 13.8256 1.82494 14.0007 2.00004C14.1758 2.17513 14.3147 2.383 14.4094 2.61178C14.5042 2.84055 14.553 3.08575 14.553 3.33337C14.553 3.58099 14.5042 3.82619 14.4094 4.05497C14.3147 4.28374 14.1758 4.49161 14.0007 4.66671L5.00065 13.6667L1.33398 14.6667L2.33398 11L11.334 2.00004Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
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

        <div className="flex flex-col gap-1">
          <p
            className={`
              text-xs m-0 font-medium
              ${isLoading ? 'text-von-purple' : enabled ? 'text-[#34C759]' : 'text-gray-600'}
            `}
          >
            {isLoading ? loadingText : enabled ? 'Connected' : 'Not Connected'}
          </p>
          {instanceUrl && (
            <button
              onClick={handleCopyUrl}
              className="text-xs text-gray-500 hover:text-gray-700 text-left m-0 p-0 border-none bg-transparent cursor-pointer flex items-center gap-1 group"
              title="Click to copy"
            >
              <span className="truncate max-w-[200px]">{instanceUrl}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <path
                  d="M13.3333 6H7.33333C6.59695 6 6 6.59695 6 7.33333V13.3333C6 14.0697 6.59695 14.6667 7.33333 14.6667H13.3333C14.0697 14.6667 14.6667 14.0697 14.6667 13.3333V7.33333C14.6667 6.59695 14.0697 6 13.3333 6Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.33333 10H2.66667C2.31304 10 1.97391 9.85952 1.72386 9.60947C1.47381 9.35943 1.33333 9.02029 1.33333 8.66667V2.66667C1.33333 2.31304 1.47381 1.97391 1.72386 1.72386C1.97391 1.47381 2.31304 1.33333 2.66667 1.33333H8.66667C9.02029 1.33333 9.35943 1.47381 9.60948 1.72386C9.85952 1.97391 10 2.31304 10 2.66667V3.33333"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default IntegrationCard;
