import React, { useState } from 'react';

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
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const cardStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    boxShadow: isHovered ? '0 2px 8px rgba(0,0,0,0.08)' : '0 1px 2px rgba(0,0,0,0.04)',
    cursor: disabled ? 'not-allowed' : 'default',
    opacity: disabled ? 0.6 : 1,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    overflow: 'hidden',
  };

  const upperSectionStyles: React.CSSProperties = {
    backgroundColor: '#fafafa',
    padding: '32px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
  };

  const logoStyles: React.CSSProperties = {
    height: '40px',
    width: 'auto',
    maxWidth: '120px',
    objectFit: 'contain',
  };

  const connectionIconStyles: React.CSSProperties = {
    height: '24px',
    width: 'auto',
    opacity: 0.7,
  };

  const lowerSectionStyles: React.CSSProperties = {
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  };

  const textContainerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const nameStyles: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1d1d1f',
    margin: 0,
  };

  const statusStyles: React.CSSProperties = {
    fontSize: '12px',
    color: enabled ? '#34C759' : '#8E8E93',
    margin: 0,
    fontWeight: 500,
  };

  const toggleStyles: React.CSSProperties = {
    position: 'relative',
    width: '44px',
    height: '24px',
    backgroundColor: enabled ? '#007AFF' : '#E5E5EA',
    borderRadius: '12px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s ease',
    border: 'none',
    padding: 0,
    flexShrink: 0,
  };

  const toggleKnobStyles: React.CSSProperties = {
    position: 'absolute',
    top: '2px',
    left: enabled ? '22px' : '2px',
    width: '20px',
    height: '20px',
    backgroundColor: '#FFFFFF',
    borderRadius: '50%',
    transition: 'left 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  };

  const handleToggle = async () => {
    if (disabled) return;

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
    <div
      style={cardStyles}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Upper Section - Visual Connection Flow */}
      <div style={upperSectionStyles}>
        <img
          src={integrationLogoPath}
          alt={`${name} logo`}
          style={logoStyles}
        />
        <img
          src="/Images/connection.svg"
          alt="connection"
          style={connectionIconStyles}
        />
        <img
          src="/Images/vonlabs.png"
          alt="Von logo"
          style={logoStyles}
        />
      </div>

      {/* Lower Section - Name, Status, and Toggle */}
      <div style={lowerSectionStyles}>
        <div style={textContainerStyles}>
          <h3 style={nameStyles}>{name}</h3>
          <p style={statusStyles}>{enabled ? 'Connected' : 'Not Connected'}</p>
        </div>
        <button
          style={toggleStyles}
          onClick={handleToggle}
          disabled={disabled}
          aria-label={`Toggle ${name} integration`}
          aria-pressed={enabled}
        >
          <div style={toggleKnobStyles} />
        </button>
      </div>
    </div>
  );
};

export default IntegrationCard;
