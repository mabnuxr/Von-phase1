import React, { useState } from 'react';
import { colors } from '../../theme';

export interface ChatItem {
  id: string;
  label: string;
}

export interface ChatSidebarProps {
  /**
   * List of chat items to display
   */
  chatItems?: ChatItem[];

  /**
   * Selected chat ID
   */
  selectedChatId?: string;

  /**
   * Chat item click handler
   */
  onChatClick?: (id: string) => void;

  /**
   * New chat button click handler
   */
  onNewChatClick?: () => void;

  /**
   * Search input change handler
   */
  onSearchChange?: (value: string) => void;

  /**
   * Search placeholder text
   * @default 'Search Chats'
   */
  searchPlaceholder?: string;

  /**
   * Width of the sidebar
   * @default '200px'
   */
  width?: string;
}

/**
 * ChatSidebar - Left sidebar for chat history
 *
 * Displays a list of past chats with search functionality and new chat button.
 * Clean, minimal design with white background.
 *
 * @example
 * ```tsx
 * <ChatSidebar
 *   chatItems={[
 *     { id: '1', label: 'Team Review' },
 *     { id: '2', label: 'Forecast Q3' }
 *   ]}
 *   selectedChatId="1"
 *   onChatClick={(id) => console.log(id)}
 *   onNewChatClick={() => console.log('New chat')}
 * />
 * ```
 */
export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chatItems = [],
  selectedChatId,
  onChatClick,
  onNewChatClick,
  onSearchChange,
  searchPlaceholder = 'Search Chats',
  width = '200px',
}) => {
  const [searchValue, setSearchValue] = useState('');

  const sidebarStyles: React.CSSProperties = {
    width,
    height: '100%',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  const newChatButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    margin: '12px 12px 8px',
    backgroundColor: 'transparent',
    border: `1px solid rgba(0,0,0,0.1)`,
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    color: '#1d1d1f',
    transition: 'all 0.2s ease',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  };

  const searchContainerStyles: React.CSSProperties = {
    padding: '0 12px 10px',
    position: 'relative',
  };

  const searchInputStyles: React.CSSProperties = {
    width: '100%',
    padding: '6px 10px',
    paddingRight: '30px',
    borderRadius: '6px',
    border: '1px solid rgba(0,0,0,0.1)',
    backgroundColor: '#f5f5f7',
    fontSize: '12px',
    outline: 'none',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    transition: 'all 0.2s ease',
  };

  const searchIconStyles: React.CSSProperties = {
    position: 'absolute',
    right: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: colors.neutral[500],
  };

  const sectionHeaderStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    fontSize: '11px',
    fontWeight: 600,
    color: colors.neutral[600],
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  };

  const chatListStyles: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  };

  const chatItemStyles = (isSelected: boolean): React.CSSProperties => ({
    padding: '8px 12px',
    fontSize: '13px',
    color: isSelected ? colors.neutral[900] : colors.neutral[700],
    backgroundColor: isSelected ? colors.neutral[100] : 'transparent',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    borderRadius: '6px',
    margin: '2px 8px',
  });

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearchChange?.(value);
  };

  const filteredChats = searchValue
    ? chatItems.filter((item) => item.label.toLowerCase().includes(searchValue.toLowerCase()))
    : chatItems;

  return (
    <div style={sidebarStyles}>
      {/* New Chat Button */}
      <button
        style={newChatButtonStyles}
        onClick={onNewChatClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.neutral[50];
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
        </svg>
        New Chat
      </button>

      {/* Search Input */}
      <div style={searchContainerStyles}>
        <input
          type="search"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={searchInputStyles}
        />
        <svg
          style={searchIconStyles}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="11" cy="11" r="8" strokeWidth="2" />
          <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Section Header */}
      <div style={sectionHeaderStyles}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Past Chats
      </div>

      {/* Chat List */}
      <div style={chatListStyles}>
        {filteredChats.map((item) => (
          <div
            key={item.id}
            style={chatItemStyles(item.id === selectedChatId)}
            onClick={() => onChatClick?.(item.id)}
            onMouseEnter={(e) => {
              if (item.id !== selectedChatId) {
                e.currentTarget.style.backgroundColor = colors.neutral[50];
              }
            }}
            onMouseLeave={(e) => {
              if (item.id !== selectedChatId) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatSidebar;
