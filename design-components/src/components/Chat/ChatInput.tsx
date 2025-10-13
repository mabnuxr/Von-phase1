import React, { useState } from 'react';
import { fontFamily, fontSize, semanticColors } from '../../theme';

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
   * Context tag to display above input (e.g., "@Forecast Q3")
   */
  contextTag?: string;

  /**
   * Whether to show Ask and Build buttons
   * @default true
   */
  showActionButtons?: boolean;

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
  contextTag,
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
    padding: '12px 16px',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    borderTop: '1px solid rgba(0,0,0,0.06)',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  const contextTagStyles: React.CSSProperties = {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#FFF4E6',
    borderRadius: '12px',
    fontSize: '12px',
    color: semanticColors.text.secondary,
    fontFamily: fontFamily.text,
    marginBottom: '4px',
    alignSelf: 'flex-start',
  };

  const inputContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: '8px 12px',
    border: `1px solid rgba(0,0,0,0.1)`,
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
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

  const plusButtonStyles: React.CSSProperties = {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#F5F5F7',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    color: semanticColors.text.secondary,
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    flexShrink: 0,
  };

  const uploadButtonStyles: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#000000',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: disabled ? 0.5 : 1,
    flexShrink: 0,
  };

  const footerStyles: React.CSSProperties = {
    fontSize: '11px',
    lineHeight: '1.4',
    color: semanticColors.text.tertiary,
    textAlign: 'center',
    fontFamily: fontFamily.text,
    marginTop: '4px',
  };

  return (
    <div style={containerStyles}>
      {contextTag && <div style={contextTagStyles}>{contextTag}</div>}

      <div style={inputContainerStyles}>
        <button
          style={plusButtonStyles}
          onClick={() => {}}
          disabled={disabled}
          aria-label="Add"
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.backgroundColor = '#E8E8EA';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#F5F5F7';
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

        {/* {showActionButtons && (
          <>
            <button
              style={actionButtonStyles}
              onClick={handleAsk}
              disabled={disabled}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Ask
            </button>
            <button
              style={actionButtonStyles}
              onClick={onBuild}
              disabled={disabled}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Build
            </button>
          </>
        )} */}

        <button
          style={uploadButtonStyles}
          onClick={handleSend}
          disabled={disabled}
          aria-label="Upload"
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.backgroundColor = '#333333';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#000000';
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
