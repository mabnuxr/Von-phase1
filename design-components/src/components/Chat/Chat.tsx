import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from './ChatMessage';
import { ChatEmptyState } from './ChatEmptyState';
import { ChatTypingIndicator } from './ChatTypingIndicator';
import { AUTO_SCROLL_THRESHOLD_PX, SCROLL_LOCK_DURATION_MS } from '../../constants';
import { ScrollToBottomButton } from './ScrollToBottomButton';
import { ChatInputSelector } from './ChatInputSelector';
import { useEscapeToStopStreaming } from './hooks/useEscapeToStopStreaming';
import type { ChatProps, SendMessageOptions } from './types';
import { ConversationMode } from './StandardChatInput/types';
import type { FileAttachment } from './FileAttachment/types';

// Export types from types.ts
export type {
  Message,
  ChatSession,
  ChatUser,
  SourceReference,
  DashboardComponent,
  DashboardArtifact,
  ApiEndpoints,
  FixedPosition,
  ChatProps,
  SendMessageOptions,
} from './types';

/** Slot component for providing a custom empty state via <Chat.EmptyState> */
const EmptyStateSlot: React.FC<{ children: React.ReactNode }> = () => null;

/**
 * Chat component - pure rendering component
 * Receives messages as props and handles UI interactions
 */
export const Chat: React.FC<ChatProps> & { EmptyState: typeof EmptyStateSlot } = ({
  userName,
  userEmail,
  messages: controlledMessages,
  onSendMessage,
  onStopStreaming,
  inputValue: externalInputValue,
  onInputValueChange,
  placeholder = 'Ask von anything',
  isLoading: controlledIsLoading = false,
  height = '600px',
  width = '400px',
  variant = 'floating',
  fixedPosition = { bottom: '24px', right: '24px' },
  loadMoreRef,
  isFetchingMore = false,
  showMessagesFromIndex = 0,
  onArtifactClick,
  showArtifacts = false,
  onFileArtifactClick,
  onArtifactDownload,
  onGoogleDriveClick,
  isDriveEnabled,
  isDriveConnected,
  driveTooltip,
  driveLoadingFileId,
  onFileClick,
  banner,
  topBanner,
  disableSubmit = false,
  examplePromptsDisabled = false,
  onExamplePromptDisabledClick,
  onInputWhileDisabled,
  onApprove,
  onReject,
  enableCommands = false,
  commands,
  isLoadingCommands,
  onSaveCommand,
  onDeleteCommand,
  isSavingCommand,
  isAdmin = false,
  teamMembers,
  currentUser,
  onSendTest,
  onToggleFavorite,
  onRequestFilePreviewUrl,
  onUploadFile,
  enableActions = false,
  onConvertToDashboard,
  onTransparencyClick,
  showTransparency = true,
  salesforceInstanceUrl,
  enableDeepLinks = false,
  // V2 Thinking Process
  thinkingProcessVersion = 'v1',
  useStandardInput = false,
  // Agent selection props
  isAgentLocked = false,
  lockedConversationMode = ConversationMode.Auto,
  // Agent modes & file upload
  availableAgentModes,
  enableFileUpload = false,
  // Controlled attachment props
  controlledAttachments,
  onRemoveAttachment,
  onFilesSelected,
  // File error props
  fileErrorMessage,
  onDismissFileError,
  // Reference context
  referenceContext,
  onRemoveReference,
  // @ Mention props
  enableMentions = false,
  mentionItems,
  isLoadingMentions,
  onSelectMention,
  onMentionsActivated,
  children,
}) => {
  const isFixed = variant === 'fixed';
  const isFullPage = variant === 'fullpage';

  // Extract custom empty state from Chat.EmptyState child (compound component pattern)
  let customEmptyState: React.ReactNode = null;
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === EmptyStateSlot) {
      customEmptyState = (child.props as { children: React.ReactNode }).children;
    }
  });
  const hasCustomEmptyState = customEmptyState !== null;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Input value state - use external control if provided, otherwise internal
  const [internalInputValue, setInternalInputValue] = useState('');
  const isInputControlled = externalInputValue !== undefined;
  const inputValue = isInputControlled ? externalInputValue : internalInputValue;
  const setInputValue = isInputControlled
    ? onInputValueChange || (() => {})
    : setInternalInputValue;

  const shouldAutoScrollRef = useRef(true);
  const scrollOnNewUserMessage = useRef(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    // ChatGPT-style scroll: scroll to absolute bottom
    const container = containerRef.current;
    if (!container) return;

    const targetScroll = container.scrollHeight - container.clientHeight;

    if (behavior === 'smooth') {
      container.scrollTo({ top: targetScroll, behavior: 'smooth' });
    } else {
      container.scrollTop = targetScroll;
    }
  }, []);

  // Chat now always receives messages as prop (controlled mode only)
  // Wrap in useMemo to prevent unnecessary re-renders when controlledMessages is undefined
  const messages = useMemo(() => controlledMessages || [], [controlledMessages]);
  const isLoading = controlledIsLoading;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (scrollOnNewUserMessage.current) return;

      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      // Within threshold distance of bottom → enable auto-scroll
      shouldAutoScrollRef.current = distanceFromBottom < AUTO_SCROLL_THRESHOLD_PX;
      // Show scroll-to-bottom button when scrolled up more than 150px
      setShowScrollButton(distanceFromBottom > 150);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // Track previous message count to detect initial load vs incremental updates
  const prevMessageCountRef = useRef(0);

  const isStreaming = useMemo(
    () => messages.some((m) => m.type === 'assistant' && m.isStreaming),
    [messages]
  );
  // Auto-scroll to bottom when new messages arrive or content updates
  useEffect(() => {
    if (messages.length === 0) return;

    const isInitialLoad = prevMessageCountRef.current === 0 && messages.length > 0;
    const isNewMessage = messages.length > prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;

    // Always scroll to bottom when new messages are added or streaming, unless user has scrolled up
    if (shouldAutoScrollRef.current) {
      if (isInitialLoad || scrollOnNewUserMessage.current) {
        // Instant scroll for initial load and new message sends — no animation lag
        scrollToBottom('auto');
        if (isInitialLoad) {
          // Scroll again after lazy content loads (markdown, images)
          setTimeout(() => scrollToBottom('auto'), 100);
        }
      } else if (isStreaming || isNewMessage) {
        // Smooth scroll for streaming updates
        requestAnimationFrame(() => {
          scrollToBottom('smooth');
        });
      }
    }
  }, [messages, scrollToBottom, isStreaming]);

  // Determine effective showFromIndex (use prop)
  const effectiveShowFromIndex = showMessagesFromIndex || 0;

  // FIX: Memoize visible messages to avoid O(N) filtering on every render
  const visibleMessages = useMemo(() => {
    // Filter messages first
    const filtered = messages
      .map((message, index) => ({
        ...message,
        // Mark messages before showMessagesFromIndex as compressed
        isCompressed: index < effectiveShowFromIndex,
        originalIndex: index,
      }))
      .filter((message) => {
        // Hide empty assistant messages when typing indicator is showing
        if (
          isLoading &&
          message.type === 'assistant' &&
          !message.content &&
          !message.reasoningContent
        ) {
          return false;
        }
        return true;
      });

    // Then mark the latest message
    return filtered.map((message, visibleIndex) => ({
      ...message,
      isLatestMessage: visibleIndex === filtered.length - 1,
    }));
  }, [messages, isLoading, effectiveShowFromIndex]);

  // Handle stop streaming
  const handleStop = useCallback(() => {
    // Get conversationId from the last message if available
    const lastMessage = messages[messages.length - 1];
    const conversationId = lastMessage?.conversationId;

    if (conversationId && onStopStreaming) {
      onStopStreaming(conversationId);
    }
  }, [messages, onStopStreaming]);

  // Esc key stops streaming (listener scoped to this container)
  useEscapeToStopStreaming({ containerRef: wrapperRef, isStreaming, onStop: handleStop });

  // Handle sending a message
  const handleSendMessage = useCallback(
    async (content: string, attachments?: FileAttachment[], options?: SendMessageOptions) => {
      // Scroll to the bottom before calling onSendMessage
      shouldAutoScrollRef.current = true;
      scrollOnNewUserMessage.current = true;

      setTimeout(() => {
        scrollOnNewUserMessage.current = false;
      }, SCROLL_LOCK_DURATION_MS);

      // Pass original attachments with file property intact for upload pipeline
      // The app layer (useSendMessage) needs the File object to build multipart payload
      onSendMessage?.(content, attachments, options);
    },
    [onSendMessage]
  );

  // Generate container class names based on variant
  const containerClassName = [
    'relative',
    'flex',
    'flex-col',
    'overflow-hidden',
    'bg-white',
    'antialiased',
    isFullPage ? 'w-screen h-screen rounded-none border-none' : `rounded-lg border border-gray-200`,
    isFixed && 'fixed z-[1000] shadow-xs',
    !isFixed && !isFullPage && 'shadow-xs',
    isFullPage && 'fixed inset-0 z-[999]',
  ]
    .filter(Boolean)
    .join(' ');

  // Inline styles only for dynamic width/height and fixedPosition
  const containerStyles: React.CSSProperties = {
    ...(!isFullPage && width && { width }),
    ...(!isFullPage && height && { height }),
    ...(isFixed && fixedPosition),
  };

  return (
    <div
      className={containerClassName}
      style={{ ...containerStyles, outline: 'none' }}
      tabIndex={-1}
      ref={wrapperRef}
    >
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto flex flex-col bg-white settings-scrollbar"
      >
        {/* Loading indicator for older messages (infinite scroll) */}
        <AnimatePresence>
          {isFetchingMore && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="text-center py-3 text-xs text-gray-500"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="inline-block"
              >
                ⟳
              </motion.div>{' '}
              Loading older messages...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Infinite scroll trigger at TOP (for loading older messages) */}
        {loadMoreRef && <div ref={loadMoreRef} className="h-px" />}

        {/* Messages or Empty State */}
        {messages.length === 0 ? (
          hasCustomEmptyState ? (
            <div className="flex flex-col h-full">{customEmptyState}</div>
          ) : (
            <ChatEmptyState
              userName={userName}
              placeholder={placeholder}
              onSendMessage={handleSendMessage}
              disabled={examplePromptsDisabled}
              onDisabledClick={onExamplePromptDisabledClick}
              enableCommands={enableCommands}
              commands={commands}
              isLoadingCommands={isLoadingCommands}
              onSaveCommand={onSaveCommand}
              onDeleteCommand={onDeleteCommand}
              isSavingCommand={isSavingCommand}
              isAdmin={isAdmin}
              teamMembers={teamMembers}
              currentUser={currentUser}
              onSendTest={onSendTest}
              onToggleFavorite={onToggleFavorite}
              onRequestFilePreviewUrl={onRequestFilePreviewUrl}
              onUploadFile={onUploadFile}
              banner={banner}
              topBanner={topBanner}
              useStandardInput={useStandardInput}
              isAgentLocked={isAgentLocked}
              lockedConversationMode={lockedConversationMode}
              controlledAttachments={controlledAttachments}
              onRemoveAttachment={onRemoveAttachment}
              onFilesSelected={onFilesSelected}
              fileErrorMessage={fileErrorMessage}
              onDismissFileError={onDismissFileError}
              availableAgentModes={availableAgentModes}
              enableFileUpload={enableFileUpload}
              enableMentions={enableMentions}
              mentionItems={mentionItems}
              isLoadingMentions={isLoadingMentions}
              onSelectMention={onSelectMention}
              onMentionsActivated={onMentionsActivated}
            />
          )
        ) : (
          /* Standard message rendering */
          <div className="flex flex-col">
            {visibleMessages.map((message) => (
              <div key={message.id}>
                <ChatMessage
                  type={message.type}
                  content={message.content}
                  command={message.command}
                  reasoningContent={message.reasoningContent}
                  timestamp={message.timestamp}
                  activeTab={message.activeTab}
                  isLoading={false}
                  isStreaming={message.isStreaming}
                  isReasoningStreaming={message.isReasoningStreaming}
                  toolCalls={message.toolCalls}
                  stepMessages={message.stepMessages}
                  userName={userName}
                  userEmail={userEmail}
                  status={message.status}
                  errorMessage={message.errorMessage}
                  messageId={message.messageId || message.id}
                  conversationId={message.conversationId}
                  onArtifactClick={onArtifactClick}
                  stoppedByUser={message.stoppedByUser}
                  isLatestMessage={message.isLatestMessage}
                  onApprove={onApprove}
                  onReject={onReject}
                  runId={message.runId}
                  enableActions={enableActions}
                  onConvertToDashboard={onConvertToDashboard}
                  onTransparencyClick={onTransparencyClick}
                  showTransparency={showTransparency}
                  salesforceInstanceUrl={salesforceInstanceUrl}
                  enableDeepLinks={enableDeepLinks}
                  // V2 Thinking Process props
                  thinkingProcessVersion={thinkingProcessVersion}
                  timelineSteps={message.timelineSteps}
                  thinkingElapsedTime={message.thinkingElapsedTime}
                  v2FinalResponse={message.v2FinalResponse}
                  attachments={message.attachments}
                  onFileClick={onFileClick}
                  // File artifacts (gated by showArtifacts flag)
                  artifacts={showArtifacts ? message.artifacts : undefined}
                  onFileArtifactClick={showArtifacts ? onFileArtifactClick : undefined}
                  onArtifactDownload={showArtifacts ? onArtifactDownload : undefined}
                  onGoogleDriveClick={showArtifacts ? onGoogleDriveClick : undefined}
                  isDriveEnabled={isDriveEnabled}
                  isDriveConnected={isDriveConnected}
                  driveTooltip={driveTooltip}
                  driveLoadingFileId={driveLoadingFileId}
                  onRequestFilePreviewUrl={onRequestFilePreviewUrl}
                />
              </div>
            ))}
          </div>
        )}

        {/* Loading indicator for new message */}
        <AnimatePresence>{isLoading && <ChatTypingIndicator />}</AnimatePresence>

        {/* Invisible div for auto-scroll to bottom */}
        <div ref={messagesEndRef} className="h-px" />

        {/* Scroll to bottom button - inside scroll container with sticky positioning */}
        <ScrollToBottomButton
          visible={showScrollButton && messages.length > 0}
          onClick={() => scrollToBottom('smooth')}
        />
      </div>

      {/* Banner above input (if provided) - only show when there are messages */}
      {messages.length > 0 && banner && (
        <div className="w-full max-w-4xl mx-auto mb-2 px-2">{banner}</div>
      )}

      {/* Only show bottom input when there are messages (not in empty state), or always when a custom empty state is provided */}
      {(messages.length > 0 || hasCustomEmptyState) && (
        <ChatInputSelector
          useStandardInput={useStandardInput}
          enableCommands={enableCommands}
          commands={commands}
          isLoadingCommands={isLoadingCommands}
          onSaveCommand={onSaveCommand}
          onDeleteCommand={onDeleteCommand}
          isSavingCommand={isSavingCommand}
          isAdmin={isAdmin}
          teamMembers={teamMembers}
          currentUser={currentUser}
          onSendTest={onSendTest}
          onToggleFavorite={onToggleFavorite}
          onRequestFilePreviewUrl={onRequestFilePreviewUrl}
          onUploadFile={onUploadFile}
          placeholder={placeholder}
          onSend={handleSendMessage}
          onStop={handleStop}
          disabled={isLoading || isStreaming}
          isStreaming={isStreaming}
          disableSubmit={disableSubmit}
          value={inputValue}
          onChange={setInputValue}
          onDisabledInput={onInputWhileDisabled}
          isAgentLocked={isAgentLocked}
          lockedConversationMode={lockedConversationMode}
          attachments={controlledAttachments}
          onRemoveAttachment={onRemoveAttachment}
          onFilesSelected={onFilesSelected}
          fileErrorMessage={fileErrorMessage}
          onDismissFileError={onDismissFileError}
          availableAgentModes={availableAgentModes}
          enableFileUpload={enableFileUpload}
          referenceContext={referenceContext}
          onRemoveReference={onRemoveReference}
          enableMentions={enableMentions}
          mentionItems={mentionItems}
          isLoadingMentions={isLoadingMentions}
          onSelectMention={onSelectMention}
          onMentionsActivated={onMentionsActivated}
        />
      )}
    </div>
  );
};

Chat.EmptyState = EmptyStateSlot;

export default Chat;
