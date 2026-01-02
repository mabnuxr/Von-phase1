import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatSidebar, type SidebarItem, type ItemType } from '../ChatSidebar';
import { TopBar, type Tab } from '../TopBar';
import { ChatEmptyState } from '../Chat/ChatEmptyState';
import type { BuildMode } from './types';

export interface ThreePaneLayoutProps {
  /**
   * User's first name for personalized greeting
   */
  userName?: string;

  /**
   * List of sidebar items (chats and dashboards)
   */
  items?: SidebarItem[];

  /**
   * Currently selected item ID
   */
  selectedItemId?: string;

  /**
   * Callback when an item is clicked
   */
  onItemClick?: (id: string, type: ItemType) => void;

  /**
   * Callback when new chat is clicked
   */
  onNewChatClick?: () => void;

  /**
   * Tabs for the top bar
   */
  tabs?: Tab[];

  /**
   * Callback when a tab is clicked
   */
  onTabClick?: (id: string) => void;

  /**
   * Callback when a message is sent
   */
  onSendMessage?: (message: string, mode: BuildMode) => void;

  /**
   * Current build mode
   */
  mode?: BuildMode;

  /**
   * Callback when mode changes
   */
  onModeChange?: (mode: BuildMode) => void;

  /**
   * Whether the sidebar is collapsed
   */
  isSidebarCollapsed?: boolean;

  /**
   * Callback when sidebar collapse is toggled
   */
  onToggleSidebar?: () => void;

  /**
   * Avatar image URL
   */
  avatarSrc?: string;

  /**
   * Avatar initials/label
   */
  avatarLabel?: string;

  /**
   * User's display name
   */
  userDisplayName?: string;

  /**
   * User's email
   */
  userEmail?: string;
}

/**
 * ThreePaneLayout - Main layout for the Ask mode
 *
 * Displays the sidebar, top bar, and chat empty state in a 3-pane layout.
 * This is the initial state before entering Build mode.
 */
export const ThreePaneLayout: React.FC<ThreePaneLayoutProps> = ({
  userName = 'there',
  items = [],
  selectedItemId,
  onItemClick,
  onNewChatClick,
  tabs = [],
  onTabClick,
  onSendMessage,
  mode = 'ask',
  onModeChange,
  isSidebarCollapsed = false,
  onToggleSidebar,
  avatarSrc,
  avatarLabel,
  userDisplayName,
  userEmail,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(isSidebarCollapsed);

  const isCollapsed = onToggleSidebar ? isSidebarCollapsed : internalCollapsed;

  const handleToggleCollapse = useCallback(() => {
    if (onToggleSidebar) {
      onToggleSidebar();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  }, [onToggleSidebar]);

  const handleSendMessage = useCallback(
    (message: string) => {
      onSendMessage?.(message, mode);
    },
    [onSendMessage, mode]
  );

  const handleMenuClick = useCallback(() => {
    handleToggleCollapse();
  }, [handleToggleCollapse]);

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden font-sf">
      {/* Left Sidebar */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isCollapsed ? 'collapsed' : 'expanded'}
          className="flex-shrink-0 border-r border-gray-200 h-full"
          initial={{ width: isCollapsed ? 240 : 64 }}
          animate={{ width: isCollapsed ? 64 : 240 }}
          exit={{ width: isCollapsed ? 240 : 64 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <ChatSidebar
            items={items}
            selectedItemId={selectedItemId}
            onItemClick={onItemClick}
            onNewChatClick={onNewChatClick}
            isCollapsed={isCollapsed}
            onToggleCollapse={handleToggleCollapse}
            avatarSrc={avatarSrc}
            avatarLabel={avatarLabel}
            userName={userDisplayName}
            userEmail={userEmail}
          />
        </motion.div>
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Bar */}
        <TopBar
          tabs={tabs}
          onTabClick={onTabClick}
          showMenu={true}
          onMenuClick={handleMenuClick}
          onNewChatClick={onNewChatClick}
        />

        {/* Chat Empty State */}
        <div className="flex-1 min-h-0 overflow-hidden bg-[#fbfbfd]">
          <ChatEmptyState
            userName={userName}
            onSendMessage={handleSendMessage}
            placeholder="Ask von anything"
            showModeToggle={true}
            mode={mode}
            onModeChange={onModeChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ThreePaneLayout;
