import React, { useState } from 'react';
import { spacing, fontFamily, fontSize, semanticColors } from '../../theme';

export interface ChatInputProps {
  /**
   * Placeholder text for the input
   * @default 'Ask von anything'
   */
  placeholder?: string;

  /**
   * Callback when send/enter is pressed
   */
  onSend?: (message: string) => void;

  /**
   * Callback when Ask button is clicked
   */
  onAsk?: (message: string) => void;

  /**
   * Callback when Build button is clicked
   */
  onBuild?: () => void;

  /**
   * Whether the input is disabled
   * @default false
   */
  disabled?: boolean;
}

/**
 * Chat input component with text field and action buttons
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  placeholder = 'Ask von anything',
  onSend,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && onSend) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const containerStyles: React.CSSProperties = {
    padding: spacing[4],
    borderTop: `1px solid ${semanticColors.border.default}`,
    backgroundColor: semanticColors.background.primary,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
  };

  const inputContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: semanticColors.background.secondary,
    borderRadius: '24px', // Apple-style rounded corners
    padding: `${spacing[2]} ${spacing[3]}`,
    border: `1px solid ${semanticColors.border.default}`,
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
  };

  const inputStyles: React.CSSProperties = {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: fontSize.sm.size,
    lineHeight: fontSize.sm.lineHeight,
    fontFamily: fontFamily.text,
    color: semanticColors.text.primary,
    minWidth: 0, // Allow input to shrink
  };

  const iconButtonStyles: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: fontSize.lg.size,
    color: semanticColors.text.secondary,
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    flexShrink: 0,
  };

  const sendButtonStyles: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: semanticColors.text.primary,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: fontSize.lg.size,
    color: semanticColors.text.inverse,
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: disabled ? 0.5 : 1,
    flexShrink: 0,
  };

  const footerStyles: React.CSSProperties = {
    fontSize: fontSize.xs.size,
    lineHeight: fontSize.xs.lineHeight,
    color: semanticColors.text.tertiary,
    textAlign: 'center',
    fontFamily: fontFamily.text,
    marginTop: spacing[1],
  };

  return (
    <div style={containerStyles}>
      <div style={inputContainerStyles}>
        <button
          style={iconButtonStyles}
          onClick={() => {}}
          disabled={disabled}
          aria-label="Add"
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          +
        </button>

        <input
          type="text"
          placeholder={placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          style={inputStyles}
        />

        <button
          style={sendButtonStyles}
          onClick={handleSend}
          disabled={disabled}
          aria-label="Send"
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.backgroundColor = semanticColors.border.hover;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = semanticColors.text.primary;
          }}
        >
          ↑
        </button>
      </div>

      <div style={footerStyles}>
        Von AI may make mistakes. Please recheck all important information.
      </div>
    </div>
  );
};

export default ChatInput;
