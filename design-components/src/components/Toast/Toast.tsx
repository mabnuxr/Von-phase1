import React, { useEffect, useState, useCallback } from 'react';

export type ToastVariant = 'success' | 'info' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  /**
   * Toast message content
   */
  message: string;

  /**
   * Visual variant
   * @default 'success'
   */
  variant?: ToastVariant;

  /**
   * Callback when toast is dismissed
   */
  onDismiss: () => void;

  /**
   * Auto-dismiss after milliseconds (0 = no auto-dismiss)
   * @default 4000
   */
  autoDismissMs?: number;

  /**
   * Optional action button
   */
  action?: ToastAction;

  /**
   * Optional icon component to render
   */
  icon?: React.ReactNode;
}

/**
 * Toast - Top-right notification toast for transient messages
 *
 * Minimal, non-intrusive notification that auto-dismisses.
 * Perfect for success confirmations or background task completions.
 *
 * @example
 * ```tsx
 * <Toast
 *   message="New insight: ARR Threshold"
 *   variant="success"
 *   onDismiss={() => removeToast(id)}
 *   action={{ label: "View", onClick: navigateToMemory }}
 * />
 * ```
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'success',
  onDismiss,
  autoDismissMs = 4000,
  action,
  icon,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Slide in animation
  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 200); // Match animation duration
  }, [onDismiss]);

  // Auto-dismiss timer
  useEffect(() => {
    if (autoDismissMs > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [autoDismissMs, handleDismiss]);

  const variantConfig = {
    success: {
      bg: 'bg-white',
      border: 'border-gray-200',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
    },
    info: {
      bg: 'bg-white',
      border: 'border-gray-200',
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-500',
    },
    warning: {
      bg: 'bg-white',
      border: 'border-gray-200',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
    },
    error: {
      bg: 'bg-white',
      border: 'border-gray-200',
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-500',
    },
  };

  const config = variantConfig[variant];

  const getDefaultIcon = () => {
    switch (variant) {
      case 'success':
        return (
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'error':
        return (
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
          </svg>
        );
      case 'warning':
        return (
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`
        ${config.bg} rounded-xl shadow-lg border ${config.border}
        px-4 py-3 flex items-center gap-3 max-w-sm
        transition-all duration-200 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}
    >
      {/* Icon */}
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-lg ${config.iconBg} ${config.iconColor} flex items-center justify-center`}
      >
        {icon || getDefaultIcon()}
      </div>

      {/* Message */}
      <span className="text-sm text-gray-700 flex-1 line-clamp-2">{message}</span>

      {/* Action button */}
      {action && (
        <button
          onClick={action.onClick}
          className="text-indigo-500 hover:text-indigo-600 text-sm font-medium flex-shrink-0 cursor-pointer"
        >
          {action.label}
        </button>
      )}

      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 cursor-pointer"
        aria-label="Dismiss"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default Toast;
