import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatTextIcon, SidebarSimpleIcon } from '@phosphor-icons/react';

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

  /**
   * Avatar image URL
   */
  avatarSrc?: string;

  /**
   * Avatar initials/label (shown when no image)
   */
  avatarLabel?: string;

  /**
   * User's display name
   */
  userName?: string;

  /**
   * User's email
   */
  userEmail?: string;

  /**
   * Callback when avatar is clicked
   * Receives the DOMRect of the clicked button for positioning menus
   */
  onAvatarClick?: (rect: DOMRect) => void;
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
  avatarSrc,
  avatarLabel,
  userName,
  userEmail,
  onAvatarClick,
}) => {
  const [isChatsHovered, setIsChatsHovered] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const chatButtonRef = useRef<HTMLButtonElement>(null);

  const handleChatsHover = (isHovering: boolean) => {
    if (isHovering && chatButtonRef.current) {
      const rect = chatButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.top,
        left: rect.right + 8, // 8px gap
      });
    }
    setIsChatsHovered(isHovering);
  };

  const handleItemClick = (e: React.MouseEvent, itemId: string) => {
    // Allow default behavior for Cmd/Ctrl+Click, middle-click
    if (e.metaKey || e.ctrlKey || e.button === 1) {
      return;
    }

    // Prevent default for normal click and use SPA navigation
    e.preventDefault();
    onChatClick?.(itemId);
  };

  // Collapsed state - show minimal sidebar with toggle button and chat icon with hover dropdown
  if (isCollapsed) {
    return (
      <div className="px-2 py-3 h-full w-full bg-white flex text-sm flex-col antialiased font-sf">
        {/* Collapsed Header - Toggle button */}
        <div className="flex flex-col items-center px-1 pt-1 pb-3 border-b border-gray-200 mb-2">
          <button
            onClick={onToggleCollapse}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            title="Expand sidebar"
          >
            <SidebarSimpleIcon size={18} weight="regular" className="text-gray-500" />
          </button>
        </div>

        {/* Collapsed Menu - Chat icon with hover dropdown */}
        <div className="flex-1 px-1">
          <div className="flex flex-col items-center gap-1">
            {/* Chat Icon with Hover Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleChatsHover(true)}
              onMouseLeave={() => handleChatsHover(false)}
            >
              <button
                ref={chatButtonRef}
                className={`
                  flex items-center justify-center w-8 h-8
                  rounded-lg border-0 cursor-pointer
                  transition-all duration-200
                  ${isChatsHovered ? 'bg-gray-100 text-gray-900' : 'bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                `}
                title="Past Chats"
              >
                <ChatTextIcon size={20} weight="duotone" />
              </button>

              {/* Hover Dropdown - Conversation List (fixed position to escape overflow:hidden) */}
              <AnimatePresence>
                {isChatsHovered && chatItems.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="fixed w-56 max-h-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-[9999]"
                    style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                  >
                    <div className="px-3 py-2 border-b border-gray-100">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Past Chats
                      </span>
                    </div>
                    <div className="overflow-y-auto max-h-64 py-1">
                      {chatItems.slice(0, 10).map((item) => {
                        const isSelected = item.id === selectedChatId;

                        if (item.href) {
                          return (
                            <a
                              key={item.id}
                              href={item.href}
                              className={`
                                block px-3 py-2 text-sm text-gray-900
                                transition-all duration-150 whitespace-nowrap overflow-hidden
                                text-ellipsis no-underline cursor-pointer
                                ${isSelected ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50 font-normal'}
                              `}
                              onClick={(e) => handleItemClick(e, item.id)}
                              title={item.label}
                            >
                              {item.label}
                            </a>
                          );
                        }

                        return (
                          <div
                            key={item.id}
                            className={`
                              px-3 py-2 text-sm text-gray-900
                              transition-all duration-150 whitespace-nowrap overflow-hidden
                              text-ellipsis cursor-pointer
                              ${isSelected ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50 font-normal'}
                            `}
                            onClick={() => onChatClick?.(item.id)}
                            title={item.label}
                          >
                            {item.label}
                          </div>
                        );
                      })}
                      {chatItems.length > 10 && (
                        <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100">
                          +{chatItems.length - 10} more chats
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Collapsed Avatar Section - Just avatar */}
        {(userName || userEmail || avatarLabel) && (
          <div className="pt-3 mt-auto border-t border-gray-200">
            <button
              className="w-full flex items-center justify-center p-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={(e) => onAvatarClick?.(e.currentTarget.getBoundingClientRect())}
              title={userName || userEmail}
            >
              <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={userName || 'User avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                    {avatarLabel || userName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Expanded state - show full sidebar
  return (
    <motion.div
      className="px-2 py-3 h-full w-full bg-white flex text-sm flex-col overflow-hidden antialiased font-sf"
      initial={{ width: 64 }}
      animate={{ width: 240 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Logo Row with Collapse Button */}
      {/* <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200"> */}
        {/* Combination Logo */}
        {/* <svg width="72" height="28" viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 8C0 3.58172 3.58172 0 8 0H20C24.4183 0 28 3.58172 28 8V20C28 24.4183 24.4183 28 20 28H8C3.58172 28 0 24.4183 0 20V8Z" fill="url(#paint0_radial_expanded)"/>
          <path d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z" stroke="white" strokeWidth="1.33"/>
          <circle cx="13.9922" cy="14" r="7.835" stroke="white" strokeWidth="1.33"/>
          <path d="M32.0962 6.78408C31.8987 6.26257 32.0053 6.00182 32.4162 6.00182H33.6252C34.0519 6.00182 34.3363 6.19541 34.4786 6.58259L38.3306 17.1906C38.4966 17.6568 38.702 18.285 38.947 19.0751C39.1998 19.8574 39.3697 20.4816 39.4566 20.9478H39.504C39.5909 20.4816 39.7569 19.8574 40.0018 19.0751C40.2547 18.285 40.4641 17.6568 40.63 17.1906L44.4821 6.58259C44.6243 6.19541 44.9088 6.00182 45.3355 6.00182H46.5444C46.9553 6.00182 47.062 6.26257 46.8644 6.78408L41.0923 22.2753C40.9105 22.7573 40.6498 22.9983 40.31 22.9983H38.6506C38.3109 22.9983 38.0501 22.7573 37.8684 22.2753L32.0962 6.78408Z" fill="#332D3E"/>
          <path d="M47.7038 14.5001C47.7038 11.7345 48.3833 9.56942 49.7424 8.00489C51.1094 6.43246 53.0769 5.64624 55.6449 5.64624C58.213 5.64624 60.1765 6.43246 61.5356 8.00489C62.9026 9.56942 63.5861 11.7345 63.5861 14.5001C63.5861 17.2656 62.9026 19.4347 61.5356 21.0071C60.1765 22.5716 58.213 23.3539 55.6449 23.3539C53.0769 23.3539 51.1094 22.5716 49.7424 21.0071C48.3833 19.4347 47.7038 17.2656 47.7038 14.5001ZM50.1335 14.5001C50.1335 16.7125 50.5879 18.4351 51.4966 19.6678C52.4052 20.8925 53.788 21.5049 55.6449 21.5049C57.5018 21.5049 58.8846 20.8925 59.7933 19.6678C60.702 18.4351 61.1563 16.7125 61.1563 14.5001C61.1563 12.2876 60.702 10.569 59.7933 9.34422C58.8846 8.11156 57.5018 7.49523 55.6449 7.49523C53.788 7.49523 52.4052 8.11156 51.4966 9.34422C50.5879 10.569 50.1335 12.2876 50.1335 14.5001Z" fill="#332D3E"/>
          <path d="M66.7841 22.9983C66.389 22.9983 66.1915 22.781 66.1915 22.3464V6.6537C66.1915 6.21911 66.389 6.00182 66.7841 6.00182H68.3012C68.8543 6.00182 69.2494 6.19936 69.4865 6.59444L76.9061 19.0277H76.9535C76.9377 18.7116 76.9298 18.3956 76.9298 18.0795V6.6537C76.9298 6.21911 77.1274 6.00182 77.5225 6.00182H78.6129C79.008 6.00182 79.2055 6.21911 79.2055 6.6537V22.3464C79.2055 22.781 79.008 22.9983 78.6129 22.9983H77.5699C77.0167 22.9983 76.6217 22.8008 76.3846 22.4057L68.4908 9.21384H68.4434C68.4592 9.52991 68.4671 9.84598 68.4671 10.162V22.3464C68.4671 22.781 68.2696 22.9983 67.8745 22.9983H66.7841Z" fill="#332D3E"/>
          <defs>
            <radialGradient id="paint0_radial_expanded" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(21.875 1.75) rotate(120.964) scale(30.6125)">
              <stop stopColor="#FFF3EB"/>
              <stop offset="0.26" stopColor="#FF9042"/>
              <stop offset="1" stopColor="#854FFF"/>
            </radialGradient>
          </defs>
        </svg> */}

        {/* Collapse Button */}
        {/* <motion.button
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          onClick={onToggleCollapse}
          whileHover={{ scale: 1 }}
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
      </div> */}

      {/* New Chat Button */}
      {/* <motion.button
        className={`w-full h-[32px] mb-3 flex items-center justify-center gap-2 rounded-xl bg-gray-900 text-white text-sm font-semibold transition-all duration-200
          cursor-pointer
        }`}
        onClick={onNewChatClick}
        whileHover={{ scale: 1, opacity: 0.95 }}
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
      </motion.button> */}

      {/* Section Header */}
      <div className="flex items-center justify-between px-2 pt-1 pb-3 border-b border-gray-200 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <ChatTextIcon size={16} weight="duotone" />
          Past Chats
        </div>
        <button
          onClick={onToggleCollapse}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          title="Collapse sidebar"
        >
          <SidebarSimpleIcon size={16} weight="regular" className="text-gray-500" />
        </button>
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
                    block px-2 py-1.5 mx-0 mb-0.25 text-sm text-gray-900
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
                  block px-2 py-1.5 mx-0 my-0.25 text-sm text-gray-900
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

      {/* Avatar Section at Bottom */}
      {(userName || userEmail || avatarLabel) && (
        <div className="pt-3 mt-auto border-t border-gray-200">
          <button
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={(e) => onAvatarClick?.(e.currentTarget.getBoundingClientRect())}
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={userName || 'User avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                  {avatarLabel || userName?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            {/* User Info */}
            <div className="flex-1 min-w-0 text-left">
              {userName && (
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userName}
                </p>
              )}
              {userEmail && (
                <p className="text-xs text-gray-500 truncate">
                  {userEmail}
                </p>
              )}
            </div>
            {/* Chevron */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-400 flex-shrink-0"
            >
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ChatSidebar;
