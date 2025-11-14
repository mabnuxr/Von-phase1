import { motion } from 'framer-motion';

export interface ChatItem {
  id: string;
  label: string;
  href?: string;
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
   * Whether the sidebar is collapsed
   * @default false
   */
  isCollapsed?: boolean;

  /**
   * Callback when collapse toggle is clicked
   */
  onToggleCollapse?: () => void;

  /**
   * Ref for infinite scroll trigger element
   * Attach this to a div at the bottom of the list for infinite scroll
   */
  loadMoreRef?: React.RefObject<HTMLDivElement | null>;

  /**
   * Whether currently fetching more items
   */
  isFetchingMore?: boolean;

  /**
   * Whether there are more items to load
   */
  hasNextPage?: boolean;

  /**
   * Callback to load more items
   */
  onLoadMore?: () => void;
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
  isCollapsed = false,
  onToggleCollapse,
  loadMoreRef,
  isFetchingMore = false,
  hasNextPage = false,
  onLoadMore,
}) => {
  const handleItemClick = (e: React.MouseEvent, itemId: string) => {
    // Allow default behavior for Cmd/Ctrl+Click, middle-click
    if (e.metaKey || e.ctrlKey || e.button === 1) {
      return;
    }

    // Prevent default for normal click and use SPA navigation
    e.preventDefault();
    onChatClick?.(itemId);
  };
  // Collapsed state - show minimal sidebar with toggle button
  if (isCollapsed) {
    return (
      <motion.div
        className="h-full w-full bg-white flex flex-col items-center py-3 overflow-hidden antialiased"
        initial={{ width: 280 }}
        animate={{ width: 64 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Expand Button */}
        <motion.button
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
          onClick={onToggleCollapse}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Expand sidebar"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-700"
          >
            <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
          </svg>
        </motion.button>
      </motion.div>
    );
  }

  // Expanded state - show full sidebar
  return (
    <motion.div
      className="p-3 h-full w-full bg-white flex text-sm flex-col overflow-hidden antialiased font-sf"
      initial={{ width: 64 }}
      animate={{ width: 280 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* New Chat Button */}
      <motion.button
        className={`w-full py-2 px-2.5 mb-3 flex items-center justify-center gap-2 rounded-lg bg-[#1c1c1e] text-white text-[15px] font-semibold transition-all duration-200
          cursor-pointer
        }`}
        onClick={onNewChatClick}
        whileHover={{ scale: 1.02, opacity: 0.9 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        title={'Create a new chat'}
      >
        New Chat
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </motion.button>

      {/* Section Header with Collapse Button */}
      <div className="flex items-center justify-between py-2 mb-1">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Past Chats
        </div>

        {/* Collapse Button */}
        <motion.button
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
          onClick={onToggleCollapse}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Collapse sidebar"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-500"
          >
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      </div>

      {/* Chat List Container - Relative positioning for absolute indicator */}
      <div className="flex-1 relative overflow-hidden">
        {/* Chat List - Scrollable but hidden scrollbar */}
        <div className="h-full overflow-y-scroll overflow-x-hidden scrollbar-hide">
          {chatItems.map((item) => {
            const isSelected = item.id === selectedChatId;

            // If href provided, use anchor tag for proper link behavior
            if (item.href) {
              return (
                <a
                  key={item.id}
                  href={item.href}
                  className={`
                    block px-3 py-1.5 mx-0 my-0.5 text-sm text-gray-900
                    transition-all duration-200 whitespace-nowrap overflow-hidden
                    text-ellipsis rounded-lg no-underline cursor-pointer
                    ${
                      isSelected
                        ? 'bg-gray-100 font-medium'
                        : 'bg-transparent hover:bg-gray-50 font-normal'
                    }
                  `}
                  onClick={(e) => handleItemClick(e, item.id)}
                  title={item.label}
                >
                  {item.label}
                </a>
              );
            }

            // Fallback to div for backward compatibility
            return (
              <div
                key={item.id}
                className={`
                  block px-3 py-1.5 mx-0 my-0.5 text-sm text-gray-900
                  transition-all duration-200 whitespace-nowrap overflow-hidden
                  text-ellipsis rounded-lg cursor-pointer
                  ${
                    isSelected
                      ? 'bg-gray-100 font-medium'
                      : 'bg-transparent hover:bg-gray-50 font-normal'
                  }
                `}
                onClick={() => onChatClick?.(item.id)}
                title={item.label}
              >
                {item.label}
              </div>
            );
          })}

          {/* Infinite scroll trigger - hidden but still functional */}
          {loadMoreRef && <div ref={loadMoreRef} className="h-px" />}
        </div>

        {/* More Content Indicator - Animated double arrow at bottom */}
        {hasNextPage && !isFetchingMore && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-16 flex items-end justify-center pb-2 pointer-events-none gradient-fade-top"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.button
              className="pointer-events-auto px-4 py-2 flex flex-col items-center justify-center gap-0 cursor-pointer"
              onClick={onLoadMore}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-gray-600"
                animate={{
                  y: [0, 4, 0],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <path d="M7 13l5 5 5-5M7 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </motion.svg>
              <span className="text-[11px] text-gray-600 font-medium">More</span>
            </motion.button>
          </motion.div>
        )}

        {/* Loading indicator */}
        {isFetchingMore && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-16 flex items-center justify-center gradient-fade-top"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <motion.div
                className="w-1 h-1 rounded-full bg-gray-500"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-1 h-1 rounded-full bg-gray-500"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-1 h-1 rounded-full bg-gray-500"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatSidebar;
