import React, { useEffect, useState, useCallback } from 'react';

export type BannerVariant = 'error' | 'warning' | 'info' | 'success';

export interface BannerAction {
  label: string;
  onClick: () => void;
}

export interface BannerProps {
  /**
   * Banner message content
   */
  message: string;

  /**
   * Visual variant
   * @default 'info'
   */
  variant?: BannerVariant;

  /**
   * Whether banner can be dismissed
   * @default true
   */
  dismissible?: boolean;

  /**
   * Callback when banner is closed
   */
  onClose?: () => void;

  /**
   * Optional action button
   */
  action?: BannerAction;

  /**
   * Auto-dismiss after milliseconds (0 = no auto-dismiss)
   * @default 0
   */
  autoDismissMs?: number;

  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * Banner - Top notification banner for system messages
 *
 * Apple-style notification banner for displaying important messages
 * like connection errors, warnings, or success notifications.
 *
 * @example
 * ```tsx
 * <Banner
 *   variant="error"
 *   message="Issue Connecting to Backend Services"
 *   action={{ label: "Retry", onClick: handleRetry }}
 *   onClose={() => setShowBanner(false)}
 * />
 * ```
 */
export const Banner: React.FC<BannerProps> = ({
  message,
  variant = 'info',
  dismissible = true,
  onClose,
  action,
  autoDismissMs = 0,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Slide in animation
  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300); // Match animation duration
  }, [onClose]);

  // Auto-dismiss timer
  useEffect(() => {
    if (autoDismissMs > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [autoDismissMs, handleClose]);

  const variantColors = {
    error: {
      bg: '#FEE2E2',
      border: '#FCA5A5',
      text: '#991B1B',
      icon: '#DC2626',
    },
    warning: {
      bg: '#FEF3C7',
      border: '#FCD34D',
      text: '#92400E',
      icon: '#F59E0B',
    },
    info: {
      bg: '#DBEAFE',
      border: '#93C5FD',
      text: '#1E40AF',
      icon: '#3B82F6',
    },
    success: {
      bg: '#D1FAE5',
      border: '#6EE7B7',
      text: '#065F46',
      icon: '#10B981',
    },
  };

  const variantConfig = variantColors[variant];

  const containerStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
    opacity: isVisible ? 1 : 0,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const bannerStyles: React.CSSProperties = {
    backgroundColor: variantConfig.bg,
    borderBottom: `1px solid ${variantConfig.border}`,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  const contentStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  };

  const iconStyles: React.CSSProperties = {
    width: '20px',
    height: '20px',
    color: variantConfig.icon,
    flexShrink: 0,
  };

  const messageStyles: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: variantConfig.text,
    lineHeight: 1.5,
  };

  const actionsStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const actionButtonStyles: React.CSSProperties = {
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 600,
    color: variantConfig.text,
    backgroundColor: 'rgba(255,255,255,0.7)',
    border: `1px solid ${variantConfig.border}`,
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
  };

  const closeButtonStyles: React.CSSProperties = {
    width: '28px',
    height: '28px',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    color: variantConfig.text,
    transition: 'background-color 0.15s ease',
    flexShrink: 0,
  };

  const getIcon = () => {
    switch (variant) {
      case 'error':
        return (
          <svg style={iconStyles} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path d="M15 9l-6 6M9 9l6 6" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'warning':
        return (
          <svg style={iconStyles} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'success':
        return (
          <svg style={iconStyles} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg style={iconStyles} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path d="M12 16v-4M12 8h.01" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
    }
  };

  return (
    <div className={className} style={containerStyles}>
      <div style={bannerStyles}>
        <div style={contentStyles}>
          {getIcon()}
          <span style={messageStyles}>{message}</span>
        </div>

        <div style={actionsStyles}>
          {action && (
            <button
              style={actionButtonStyles}
              onClick={action.onClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.7)';
              }}
            >
              {action.label}
            </button>
          )}

          {dismissible && (
            <button
              style={closeButtonStyles}
              onClick={handleClose}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="Close"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Banner;
