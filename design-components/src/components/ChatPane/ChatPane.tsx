import { useRef, useLayoutEffect } from 'react';
import { SidebarSimpleIcon } from '@phosphor-icons/react';
import { ChatMessage } from '../Chat/ChatMessage';
import { StandardChatInput } from '../Chat/StandardChatInput/StandardChatInput';
import { ConversationMode } from '../Chat/StandardChatInput/types';
import { ChatPaneHeader } from './ChatPaneHeader';
import { TertiaryIconButton } from '../forms/buttons';
import type { ChatPaneProps } from './types';

/**
 * ChatPane - A Claude Code-style chat interface for the three-pane layout
 *
 * Features:
 * - Chat input flush to bottom
 * - Collapsible pane with expand/collapse states
 * - Header with conversation name and action icons
 * - Reference attachment support for dashboards/reports
 * - Scrollable messages area
 */
export const ChatPane: React.FC<ChatPaneProps> = ({
  conversationName = 'Build with Von',
  messages = [],
  onSendMessage,
  onStop,
  isStreaming = false,
  referenceContext,
  onRemoveReference,
  isCollapsed = false,
  onToggleCollapse,
  onNewChat,
  onViewHistory,
  onCancel,
  userName,
  userEmail,
  placeholder = 'Type a message...',
  enableVoiceInput = false,
  onVoiceInput,
  isRecording = false,
  onArtifactClick,
  conversationId,
  onApprove,
  onReject,
  // Mode selector props
  showModeSelector = false,
  autoEditMode = 'off',
  onAutoEditModeChange,
  // Popover props
  activePopover,
  onPopoverClose,
  onPopoverPrimaryAction,
  onPopoverFeedback,
  availableAgentModes = [ConversationMode.Auto, ConversationMode.DashboardBuilder],
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
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

  // Collapsed state - just show expand button
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
    <div className="px-2 py-3 h-full w-full bg-white flex text-sm rounded-xl border border-gray-100 shadow-xs flex-col overflow-hidden antialiased font-sf">
      {/* Header */}
      <ChatPaneHeader
        conversationName={conversationName}
        onNewChat={onNewChat}
        onViewHistory={onViewHistory}
        onCancel={onCancel}
        onCollapse={onToggleCollapse}
        isStreaming={isStreaming}
      />

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-1 mt-3"
      >
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
            <p className="text-sm text-gray-500">Start a conversation</p>
          </div>
        ) : (
          // Messages list
          <div className="space-y-0">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                type={message.type}
                content={message.content}
                attachments={message.attachments}
                reasoningContent={message.reasoningContent}
                stepMessages={message.stepMessages}
                isStreaming={message.isStreaming}
                isReasoningStreaming={message.isReasoningStreaming}
                status={message.status}
                errorMessage={message.errorMessage}
                userName={userName}
                userEmail={userEmail}
                messageId={message.id}
                conversationId={conversationId}
                onArtifactClick={onArtifactClick}
                stoppedByUser={message.stoppedByUser}
                isLatestMessage={index === messages.length - 1}
                onApprove={onApprove}
                onReject={onReject}
                runId={message.runId}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat input - includes reference context display */}
      <div className="mt-3 px-1">
        <StandardChatInput
          placeholder={placeholder}
          onSend={onSendMessage}
          onStop={onStop}
          isStreaming={isStreaming}
          onVoiceInput={enableVoiceInput ? onVoiceInput : undefined}
          isRecording={isRecording}
          mode="build"
          referenceContext={referenceContext}
          onRemoveReference={onRemoveReference}
          showModeSelector={showModeSelector}
          autoEditMode={autoEditMode}
          onAutoEditModeChange={onAutoEditModeChange}
          activePopover={activePopover}
          onPopoverClose={onPopoverClose}
          onPopoverPrimaryAction={onPopoverPrimaryAction}
          onPopoverFeedback={onPopoverFeedback}
          availableAgentModes={availableAgentModes}
        />
      </div>
    </div>
  );
};

export default ChatPane;
