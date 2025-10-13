import React from 'react';
import { spacing, fontFamily, fontSize, fontWeight, semanticColors } from '../../theme';

export interface ChatHeaderProps {
  /**
   * Title displayed in the header
   * @default 'Chat'
   */
  title?: string;

  /**
   * Callback when add button is clicked
   */
  onAddClick?: () => void;

  /**
   * Callback when refresh button is clicked
   */
  onRefreshClick?: () => void;

  /**
   * Callback when close button is clicked (for fixed variant)
   */
  onClose?: () => void;

  /**
   * Whether to show the close button
   * @default false
   */
  showClose?: boolean;
}

/**
 * Chat header component with title and action icons
 */
export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title = 'Chat',
  onRefreshClick,
  onClose,
  showClose = false,
}) => {
  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing[4]} ${spacing[5]}`, // More generous padding
    borderBottom: `1px solid ${semanticColors.border.default}`,
    backgroundColor: semanticColors.background.primary,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: fontSize.lg.size, // Slightly larger for prominence
    lineHeight: fontSize.lg.lineHeight,
    fontWeight: fontWeight.semibold,
    color: semanticColors.text.primary,
    fontFamily: fontFamily.text,
    letterSpacing: '-0.01em', // Tight tracking like Apple
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  const actionsStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing[1],
    alignItems: 'center',
  };

  const iconButtonStyles: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: '8px', // More rounded for Apple aesthetic
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: fontSize.xl.size,
    color: semanticColors.text.secondary,
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)', // Snappier
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = semanticColors.background.secondary;
    e.currentTarget.style.color = semanticColors.text.primary;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = semanticColors.text.secondary;
  };

  return (
    <div style={headerStyles}>
      <div style={titleStyles}>{title}</div>
      <div style={actionsStyles}>
        {!showClose && (
          <>
            {/* <button
              style={iconButtonStyles}
              onClick={onAddClick}
              aria-label="Add"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              +
            </button> */}
            <button
              style={iconButtonStyles}
              onClick={onRefreshClick}
              aria-label="Refresh"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              ↻
            </button>
          </>
        )}
        {showClose && (
          <button
            style={iconButtonStyles}
            onClick={onClose}
            aria-label="Close"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
