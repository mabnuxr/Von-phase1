import { Plus, ClockCounterClockwise, X, SidebarSimpleIcon } from '@phosphor-icons/react';
import { TertiaryIconButton } from '../forms/buttons';
import type { ChatPaneHeaderProps } from './types';

/**
 * ChatPaneHeader - Header component for the ChatPane
 *
 * Displays:
 * - Conversation name on the left
 * - Action icons on the right: New chat, History, Cancel (when streaming), Collapse
 */
export const ChatPaneHeader: React.FC<ChatPaneHeaderProps> = ({
  conversationName,
  onNewChat,
  onViewHistory,
  onCancel,
  onCollapse,
  isStreaming = false,
}) => {
  return (
    <div className="px-1 pb-3 border-b border-gray-100">
      <div className="flex items-center justify-between gap-2">
        {/* Left side - Conversation name */}
        <span className="font-medium text-gray-900 text-sm truncate">{conversationName}</span>

        {/* Right side - Action icons */}
        <div className="flex items-center gap-1">
          {/* New chat */}
          {onNewChat && (
            <TertiaryIconButton
              icon={<Plus size={16} weight="bold" />}
              onClick={onNewChat}
              title="New chat"
            />
          )}

          {/* History */}
          {onViewHistory && (
            <TertiaryIconButton
              icon={<ClockCounterClockwise size={16} weight="regular" />}
              onClick={onViewHistory}
              title="View history"
            />
          )}

          {/* Cancel (only shown when streaming) */}
          {isStreaming && onCancel && (
            <TertiaryIconButton
              icon={<X size={16} weight="bold" />}
              onClick={onCancel}
              title="Cancel"
            />
          )}

          {/* Collapse */}
          {onCollapse && (
            <TertiaryIconButton
              icon={<SidebarSimpleIcon size={16} weight="regular" className="rotate-180" />}
              onClick={onCollapse}
              title="Collapse pane"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPaneHeader;
