import React from 'react';
import { colors } from '../../theme';

export interface DocumentCardProps {
  /**
   * Document title
   */
  title: string;

  /**
   * Document timestamp
   */
  timestamp?: string;

  /**
   * Click handler
   */
  onClick?: () => void;

  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * DocumentCard - Document/file card component
 *
 * Displays a document reference with icon, title, and timestamp.
 * Used within chat messages to show generated documents or reports.
 *
 * @example
 * ```tsx
 * <DocumentCard
 *   title="Team Forecast for Q4"
 *   timestamp="25 Aug 2025 2:40 PM"
 *   onClick={() => console.log('Open document')}
 * />
 * ```
 */
export const DocumentCard: React.FC<DocumentCardProps> = ({
  title,
  timestamp,
  onClick,
  className,
}) => {
  const cardStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '8px 12px',
    backgroundColor: '#FFFFFF',
    border: `1px solid rgba(0,0,0,0.1)`,
    borderRadius: '8px',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.2s ease',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  const iconStyles: React.CSSProperties = {
    flexShrink: 0,
    color: colors.neutral[600],
  };

  const contentStyles: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: '#1d1d1f',
    marginBottom: timestamp ? '2px' : '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const timestampStyles: React.CSSProperties = {
    fontSize: '11px',
    color: colors.neutral[500],
  };

  return (
    <div
      className={className}
      style={cardStyles}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.backgroundColor = colors.neutral[50];
          e.currentTarget.style.borderColor = colors.neutral[300];
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.backgroundColor = colors.common.white;
          e.currentTarget.style.borderColor = colors.neutral[200];
        }
      }}
    >
      <svg
        style={iconStyles}
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <path
          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div style={contentStyles}>
        <div style={titleStyles}>{title}</div>
        {timestamp && <div style={timestampStyles}>{timestamp}</div>}
      </div>
    </div>
  );
};

export default DocumentCard;
