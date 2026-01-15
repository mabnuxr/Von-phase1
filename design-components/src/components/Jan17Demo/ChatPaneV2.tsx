import { useRef, useLayoutEffect } from 'react';
import { SidebarSimpleIcon } from '@phosphor-icons/react';
import { TertiaryIconButton } from '../forms/buttons';
import { ChatViewV2, type ChatMessage, type ThinkingStep, type DashboardPlan } from './ChatViewV2';
import { StandardChatInput, type ReferenceContext } from '../Chat/StandardChatInput';

// ============================================================================
// Types
// ============================================================================

export interface ChatPaneV2Props {
  conversationName?: string;
  messages: ChatMessage[];
  isThinking?: boolean;
  thinkingSteps?: ThinkingStep[];
  elapsedTime?: number;
  onSendMessage?: (message: string) => void;
  onBuildDashboard?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isStreaming?: boolean;
  onStop?: () => void;
  placeholder?: string;
  /** Reference context to show above the chat input (e.g., dashboard or widget being referenced) */
  referenceContext?: ReferenceContext;
  /** Callback when user removes the reference */
  onRemoveReference?: () => void;
}

// Re-export types for convenience
export type { ChatMessage, ThinkingStep, DashboardPlan, ReferenceContext };

// ============================================================================
// Header Component
// ============================================================================

interface ChatPaneHeaderProps {
  conversationName: string;
  onCollapse?: () => void;
}

const ChatPaneHeader: React.FC<ChatPaneHeaderProps> = ({
  conversationName,
  onCollapse,
}) => {
  return (
    <div className="flex items-center justify-between px-3 pt-1 pb-3 border-b border-gray-100 flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-[13px] font-medium text-gray-900 truncate">
          {conversationName}
        </span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {onCollapse && (
          <TertiaryIconButton
            icon={<SidebarSimpleIcon size={16} weight="regular" className="rotate-180" />}
            onClick={onCollapse}
            title="Collapse chat pane"
          />
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const ChatPaneV2: React.FC<ChatPaneV2Props> = ({
  conversationName = 'Build with Von',
  messages = [],
  isThinking = false,
  thinkingSteps = [],
  elapsedTime = 0,
  onSendMessage,
  onBuildDashboard,
  isCollapsed = false,
  onToggleCollapse,
  isStreaming = false,
  onStop,
  placeholder = 'Type a message...',
  referenceContext,
  onRemoveReference,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useLayoutEffect(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;

      if (isNearBottom || isStreaming) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, isStreaming]);

  // Collapsed state
  if (isCollapsed) {
    return (
      <div className="h-full w-12 bg-white flex flex-col items-center justify-start rounded-xl border border-gray-100 shadow-xs py-4">
        <TertiaryIconButton
          icon={<SidebarSimpleIcon size={16} weight="regular" className="rotate-180" />}
          onClick={onToggleCollapse}
          title="Expand chat pane"
        />
      </div>
    );
  }

  return (
    <div className="px-2 py-3 h-full w-full bg-white flex text-[13px] rounded-xl border border-gray-100 shadow-xs flex-col overflow-hidden antialiased font-sf">
      {/* Header - Simplified without new chat button and history */}
      <ChatPaneHeader
        conversationName={conversationName}
        onCollapse={onToggleCollapse}
      />

      {/* Messages area using ChatViewV2 */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        {messages.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="text-gray-300 mb-2">
              <svg
                width="48"
                height="48"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0 8C0 3.58172 3.58172 0 8 0H20C24.4183 0 28 3.58172 28 8V20C28 24.4183 24.4183 28 20 28H8C3.58172 28 0 24.4183 0 20V8Z"
                  fill="currentColor"
                />
                <path
                  d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z"
                  stroke="white"
                  strokeWidth="1.33"
                />
                <circle cx="13.9932" cy="14" r="7.835" stroke="white" strokeWidth="1.33" />
              </svg>
            </div>
            <p className="text-[13px] text-gray-500">Start a conversation</p>
          </div>
        ) : (
          <ChatViewV2
            messages={messages}
            isThinking={isThinking}
            thinkingSteps={thinkingSteps}
            elapsedTime={elapsedTime}
            onBuildDashboard={onBuildDashboard}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input */}
      <div className="mt-3 px-1">
        <StandardChatInput
          placeholder={placeholder}
          onSend={onSendMessage}
          onStop={onStop}
          isStreaming={isStreaming}
          mode="build"
          referenceContext={referenceContext}
          onRemoveReference={onRemoveReference}
        />
      </div>
    </div>
  );
};

export default ChatPaneV2;
