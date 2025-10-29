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
        />
        <img src="/Images/connection.svg" alt="connection" className="h-6 w-auto opacity-70" />
        <img
          src="/Images/vonlabs.png"
          alt="Von logo"
          className="h-10 w-auto max-w-[120px] object-contain"
        />
      </div>

      {/* Lower Section - Name, Status, and Toggle */}
      <div className="py-4 px-5 flex items-center justify-between bg-white">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-gray-900 m-0">{name}</h3>
          <p
            className={`
              text-xs m-0 font-medium
              ${isLoading ? 'text-von-purple' : enabled ? 'text-[#34C759]' : 'text-gray-600'}
            `}
          >
            {isLoading ? loadingText : enabled ? 'Connected' : 'Not Connected'}
          </p>
        </div>

        <button
          className={`
            relative w-11 h-6 rounded-full border-none p-0 flex-shrink-0 overflow-hidden
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
    </motion.div>
  );
};

export default IntegrationCard;
