import { motion } from 'framer-motion';

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
  loadMoreRef,
  isFetchingMore = false,
  hasNextPage = false,
  onLoadMore,
}) => {
  return (
    <div className="p-3 h-full w-full bg-white flex text-sm flex-col overflow-hidden antialiased font-sf">
      {/* New Chat Button */}
      <motion.button
        className="w-full py-2 px-2.5 mb-3 flex items-center justify-center gap-2 rounded-lg bg-[#1c1c1e] text-white text-[15px] font-medium cursor-pointer"
        onClick={onNewChatClick}
        whileHover={{ scale: 1.02, opacity: 0.9 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
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

      {/* Section Header */}
      <div className="flex items-center gap-2 py-2 mb-1 text-[13px] font-normal text-gray-500 uppercase">
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

      {/* Chat List Container - Relative positioning for absolute indicator */}
      <div className="flex-1 relative overflow-hidden">
        {/* Chat List - Scrollable but hidden scrollbar */}
        <div className="h-full overflow-y-scroll overflow-x-hidden scrollbar-hide">
          {chatItems.map((item) => {
            const isSelected = item.id === selectedChatId;
            return (
              <div
                key={item.id}
                className={`
                  px-3 py-1.5 mx-0 my-0.5 text-[14px] cursor-pointer
                  transition-all duration-150 whitespace-nowrap overflow-hidden
                  text-ellipsis rounded-lg text-gray-900 font-normal
                  ${isSelected ? 'bg-gray-300' : 'bg-transparent hover:bg-gray-100'}
                `}
                onClick={() => onChatClick?.(item.id)}
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
    </div>
  );
};

export default ChatSidebar;
