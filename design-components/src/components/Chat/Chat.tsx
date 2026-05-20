import React, { useCallback, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from './ChatMessage';
import { ChatEmptyState } from './ChatEmptyState';
import { ChatTypingIndicator } from './ChatTypingIndicator';
import { ScrollToBottomButton } from './ScrollToBottomButton';
import { ChatInputSelector } from './ChatInputSelector';
import type { ChatInputSelectorRef } from './ChatInputSelector';
import { useEscapeToStopStreaming } from './hooks/useEscapeToStopStreaming';
import { useAutoScroll } from './hooks/useAutoScroll';
import { useChatInput } from './hooks/useChatInput';
import { useVisibleMessages } from './hooks/useVisibleMessages';
import type { ChatProps, SendMessageOptions, ChatRef } from './types';
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
  ChatProps,
  SendMessageOptions,
} from './types';

/** Slot component for providing a custom empty state via <Chat.EmptyState> */
const EmptyStateSlot: React.FC<{ children: React.ReactNode }> = () => null;

/**
 * Chat component - pure rendering component
 * Receives messages as props and handles UI interactions
 */
const ChatBase = forwardRef<ChatRef, ChatProps>(
  (
    {
      userName,
      userEmail,
      messages: controlledMessages,
      onSendMessage,
      onStopStreaming,
      inputValue: externalInputValue,
      onInputValueChange,
      defaultInputValue,
      placeholder = 'Ask von anything',
      isLoading: controlledIsLoading = false,
      height = '600px',
      width = '400px',
      loadMoreRef,
      isFetchingMore = false,
      showMessagesFromIndex = 0,
      onArtifactClick,
      showArtifacts = false,
      renderArtifactCard,
      groupedArtifactRenderers,
      onFileArtifactClick,
      onArtifactDownload,
      onGoogleDriveClick,
      isDriveEnabled,
      isDriveConnected,
      driveTooltip,
      driveLoadingFileId,
      onBoxClick,
      isBoxEnabled,
      isBoxConnected,
      boxTooltip,
      boxLoadingFileId,
      onFileClick,
      banner,
      isIntegrationConnected,
      onIntegrate,
      getIntegrationMetadata,
      topBanner,
      disableSubmit = false,
      disableInput = false,
      disabledTooltip,
      examplePromptsDisabled = false,
      onExamplePromptDisabledClick,
      onTemplateCategoryClick,
      onTemplateClick,
      onTemplateArrowClick,
      onInputWhileDisabled,
      onApprove,
      onReject,
      onExpire,
      onApprovePlan,
      onRejectPlan,
      onDashboardPreview,
      onMentionClick,
      enableCommands = false,
      commands,
      isLoadingCommands,
      onSaveCommand,
      onDeleteCommand,
      isSavingCommand,
      teamMembers,
      currentUser,
      onSendTest,
      onToggleFavorite,
      onRequestFilePreviewUrl,
      onUploadFile,
      availableDashboards,
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
      // Read-only mode (hides input, used for shared/archived views)
      hideInput = false,
      hideScrollToBottom = false,
      disableFileAttachments = false,
      // Reference context
      // @ Mention props
      enableMentions = false,
      mentionItems,
      isLoadingMentions,
      onSelectMention,
      onMentionsActivated,
      dashboardMention,
      widgetMentions,
      onWidgetMentionRemoved,
      // Analytics callbacks
      onFileUploadClick,
      onSlashCommandOpened,
      onSlashCommandSelected,
      onManageCommandsClicked,
      onCreateNewCommandClicked,
      onThinkingStepExpanded,
      onCopyMessage,
      onDownloadMessage,
      onThumbsUp,
      onThumbsDown,
      onResponseLinkClicked,
      onResponseSectionCopied,
      children,
      compact = false,
    },
    ref
  ) => {
    // Extract custom empty state from Chat.EmptyState child (compound component pattern)
    let customEmptyState: React.ReactNode = null;
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === EmptyStateSlot) {
        customEmptyState = (child.props as { children: React.ReactNode }).children;
      }
    });
    const hasCustomEmptyState = customEmptyState !== null;

    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputSelectorRef = useRef<ChatInputSelectorRef | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          inputSelectorRef.current?.focus();
        },
      }),
      []
    );

    // Chat now always receives messages as prop (controlled mode only)
    const messages = useMemo(() => controlledMessages || [], [controlledMessages]);
    const isLoading = controlledIsLoading;

    // Extracted hooks
    const { inputValue, setInputValue } = useChatInput({
      externalInputValue,
      onInputValueChange,
    });

    const {
      containerRef,
      messagesEndRef,
      showScrollButton,
      isStreaming,
      scrollToBottom,
      prepareForNewMessage,
    } = useAutoScroll({ messages });

    const visibleMessages = useVisibleMessages({
      messages,
      isLoading,
      showMessagesFromIndex: showMessagesFromIndex || 0,
    });

    // Handle stop streaming
    const handleStop = useCallback(() => {
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
        prepareForNewMessage();
        onSendMessage?.(content, attachments, options);
      },
      [onSendMessage, prepareForNewMessage]
    );

    // Generate container class names
    const containerClassName = [
      'relative',
      'flex',
      'flex-col',
      'overflow-hidden',
      'bg-white',
      'antialiased',
      'chat-container',
      compact
        ? 'w-full h-full rounded-none border-none'
        : 'rounded-xl border border-gray-100 shadow-xs',
    ]
      .filter(Boolean)
      .join(' ');

    // Inline styles only for dynamic width/height and fixedPosition
    const containerStyles: React.CSSProperties = {
      ...(width && { width }),
      ...(height && { height }),
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
                defaultValue={defaultInputValue}
                placeholder={placeholder}
                onSendMessage={handleSendMessage}
                disabled={examplePromptsDisabled}
                onDisabledClick={onExamplePromptDisabledClick}
                onTemplateCategoryClick={onTemplateCategoryClick}
                onTemplateClick={onTemplateClick}
                onTemplateArrowClick={onTemplateArrowClick}
                enableCommands={enableCommands}
                commands={commands}
                isLoadingCommands={isLoadingCommands}
                onSaveCommand={onSaveCommand}
                onDeleteCommand={onDeleteCommand}
                isSavingCommand={isSavingCommand}
                teamMembers={teamMembers}
                currentUser={currentUser}
                onSendTest={onSendTest}
                onToggleFavorite={onToggleFavorite}
                onRequestFilePreviewUrl={onRequestFilePreviewUrl}
                onUploadFile={onUploadFile}
                availableDashboards={availableDashboards}
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
                dashboardMention={dashboardMention}
                widgetMentions={widgetMentions}
                onWidgetMentionRemoved={onWidgetMentionRemoved}
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
                    onExpire={onExpire}
                    onApprovePlan={onApprovePlan}
                    onRejectPlan={onRejectPlan}
                    onDashboardPreview={onDashboardPreview}
                    onMentionClick={onMentionClick}
                    runId={message.runId}
                    dashboards={message.dashboards}
                    executionId={message.executionId}
                    isDashboardBuilderMode={message.isDashboardBuilderMode}
                    researchResults={message.researchResults}
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
                    mentions={message.mentions}
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
                    onBoxClick={showArtifacts ? onBoxClick : undefined}
                    isBoxEnabled={isBoxEnabled}
                    isBoxConnected={isBoxConnected}
                    boxTooltip={boxTooltip}
                    boxLoadingFileId={boxLoadingFileId}
                    onRequestFilePreviewUrl={onRequestFilePreviewUrl}
                    disableFileAttachments={disableFileAttachments}
                    renderArtifactCard={showArtifacts ? renderArtifactCard : undefined}
                    groupedArtifactRenderers={showArtifacts ? groupedArtifactRenderers : undefined}
                    integrationBlocks={message.integrationBlocks}
                    isIntegrationConnected={isIntegrationConnected}
                    onIntegrate={onIntegrate}
                    getIntegrationMetadata={getIntegrationMetadata}
                    compact={compact}
                    onThinkingStepExpanded={onThinkingStepExpanded}
                    onCopyMessage={onCopyMessage}
                    onDownloadMessage={onDownloadMessage}
                    onThumbsUp={onThumbsUp}
                    onThumbsDown={onThumbsDown}
                    onResponseLinkClicked={
                      onResponseLinkClicked
                        ? (linkType, linkText) =>
                            onResponseLinkClicked(
                              linkType,
                              linkText,
                              message.messageId || message.id
                            )
                        : undefined
                    }
                    onResponseSectionCopied={
                      onResponseSectionCopied
                        ? (sectionType) =>
                            onResponseSectionCopied(sectionType, message.messageId || message.id)
                        : undefined
                    }
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
          {!hideScrollToBottom && (
            <ScrollToBottomButton
              visible={showScrollButton && messages.length > 0}
              onClick={() => scrollToBottom('smooth')}
            />
          )}
        </div>

        {/* Banner above input (if provided) - only show when there are messages */}
        {messages.length > 0 && banner && (
          <div className="w-full max-w-4xl mx-auto mb-2 px-2">{banner}</div>
        )}

        {/* Only show bottom input when there are messages (not in empty state), or always when a custom empty state is provided */}
        {!hideInput && (messages.length > 0 || hasCustomEmptyState) && (
          <ChatInputSelector
            ref={inputSelectorRef}
            useStandardInput={useStandardInput}
            enableCommands={enableCommands}
            commands={commands}
            isLoadingCommands={isLoadingCommands}
            onSaveCommand={onSaveCommand}
            onDeleteCommand={onDeleteCommand}
            isSavingCommand={isSavingCommand}
            teamMembers={teamMembers}
            currentUser={currentUser}
            onSendTest={onSendTest}
            onToggleFavorite={onToggleFavorite}
            onRequestFilePreviewUrl={onRequestFilePreviewUrl}
            onUploadFile={onUploadFile}
            availableDashboards={availableDashboards}
            placeholder={placeholder}
            onSend={handleSendMessage}
            onStop={handleStop}
            disabled={isLoading || isStreaming || disableInput}
            disabledTooltip={disabledTooltip}
            isStreaming={isStreaming}
            disableSubmit={disableSubmit || disableInput}
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
            onFileUploadClick={onFileUploadClick}
            onSlashCommandOpened={onSlashCommandOpened}
            onSlashCommandSelected={onSlashCommandSelected}
            onManageCommandsClicked={onManageCommandsClicked}
            onCreateNewCommandClicked={onCreateNewCommandClicked}
            enableMentions={enableMentions}
            mentionItems={mentionItems}
            isLoadingMentions={isLoadingMentions}
            onSelectMention={onSelectMention}
            onMentionsActivated={onMentionsActivated}
            dashboardMention={dashboardMention}
            widgetMentions={widgetMentions}
            onWidgetMentionRemoved={onWidgetMentionRemoved}
          />
        )}
      </div>
    );
  }
);
ChatBase.displayName = 'Chat';

export const Chat = ChatBase as typeof ChatBase & { EmptyState: typeof EmptyStateSlot };
Chat.EmptyState = EmptyStateSlot;

export default Chat;
