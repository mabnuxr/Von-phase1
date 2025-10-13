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

  /**
   * Ref for infinite scroll trigger element
   * Attach this to a div at the bottom of the list for infinite scroll
   */
  loadMoreRef?: React.RefObject<HTMLDivElement | null>;

  /**
   * Whether currently fetching more items
   */
  isFetchingMore?: boolean;
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
  width = '200px',
  loadMoreRef,
  isFetchingMore = false,
}) => {
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '6px 10px',
    margin: '12px 12px 8px',
    backgroundColor: '#1b1b1f',
    border: `1px solid rgba(0,0,0,0.1)`,
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    color: "white",
    transition: 'all 0.2s ease',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
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
    backgroundColor: isSelected ? colors.neutral[200] : 'transparent',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    fontWeight: isSelected ? 500 : "normal", // 500 is medium weight
    textOverflow: 'ellipsis',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    borderRadius: '6px',
    margin: '2px 8px',
  });

  return (
    <div style={sidebarStyles}>
      {/* New Chat Button */}
      <button
        style={newChatButtonStyles}
        onClick={onNewChatClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.neutral[700];
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#1b1b1f';
        }}
      >
        New Chat
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Section Header */}
      <div style={sectionHeaderStyles}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Past Chats
      </div>

      {/* Chat List */}
      <div style={chatListStyles}>
        {chatItems.map((item) => (
          <div
            key={item.id}
            style={chatItemStyles(item.id === selectedChatId)}
            onClick={() => onChatClick?.(item.id)}
            onMouseEnter={(e) => {
              if (item.id !== selectedChatId) {
                e.currentTarget.style.backgroundColor = colors.neutral[100];
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

        {/* Infinite scroll trigger */}
        {loadMoreRef && <div ref={loadMoreRef} style={{ height: '1px' }} />}

        {/* Loading indicator */}
        {isFetchingMore && (
          <div
            style={{
              padding: '12px',
              textAlign: 'center',
              fontSize: '12px',
              color: colors.neutral[500],
            }}
          >
            Loading more...
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
