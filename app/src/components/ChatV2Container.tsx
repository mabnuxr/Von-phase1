/**
 * ChatV2Container - Container component for V2 chat conversations
 *
 * Renders the V2 chat experience using either:
 * - DeepResearchConversation (when in deep research mode)
 * - Chat with thinkingProcessVersion="v2" (regular mode)
 *
 * All business logic lives in useChatV2 — this component is JSX only.
 *
 * Mounted with key={conversationId} from Dashboard, so it remounts cleanly
 * on conversation switch (no stale state, no race conditions).
 */

import { Profiler } from "react";
import {
  Chat,
  FilePreviewModal,
  ArtifactViewerPanel,
} from "@vonlabs/design-components";
import type { AgentMode } from "@vonlabs/design-components";

import type { MessageWithStreaming, Conversation } from "../types/conversation";
import type { User } from "../services";
import { config } from "../config";
import { useChatV2 } from "../hooks/useChatV2";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { DeepResearchConversation } from "./DeepResearchConversation";
import { SingleArtifactDrawerContainer } from "./SingleArtifactDrawerContainer";
import { LazyTransparencyDrawer } from "./LazyTransparencyDrawer";
import { reportRenderTiming } from "../lib/datadog";

export interface ChatV2ContainerProps {
  conversationId: string;
  user: User | null;
  currentConversation: Conversation;
  conversationMessages: MessageWithStreaming[];
  isLoadingMessages: boolean;
  fetchNextMessagePage: () => void;
  hasNextMessagePage: boolean;
  isFetchingNextMessagePage: boolean;
  refetchMessages: () => Promise<unknown>;
  lockedAgentMode: AgentMode;
  isAgentLocked: boolean;
  canSubmit: boolean;
  onDisabledInteraction: () => void;
  salesforceInstanceUrl?: string;
  isSlashCommandsEnabled: boolean;
  isActionsEnabled: boolean;
  isDeepLinksEnabled: boolean;
  isSourcesEnabled: boolean;
  isFileUploadEnabled: boolean;
  syncAgentModeToBackend: (mode: AgentMode) => Promise<void>;
  banner: React.ReactNode;
}

export function ChatV2Container(props: ChatV2ContainerProps) {
  const {
    conversationId,
    user,
    isFetchingNextMessagePage,
    fetchNextMessagePage,
    hasNextMessagePage,
    lockedAgentMode,
    isAgentLocked,
    onDisabledInteraction,
    salesforceInstanceUrl,
    isSlashCommandsEnabled,
    isActionsEnabled,
    isDeepLinksEnabled,
    isSourcesEnabled,
    isFileUploadEnabled,
    banner,
  } = props;

  const chatV2 = useChatV2({
    conversationId: props.conversationId,
    user: props.user,
    currentConversation: props.currentConversation,
    conversationMessages: props.conversationMessages,
    refetchMessages: props.refetchMessages,
    lockedAgentMode: props.lockedAgentMode,
    isAgentLocked: props.isAgentLocked,
    canSubmit: props.canSubmit,
    onDisabledInteraction: props.onDisabledInteraction,
    salesforceInstanceUrl: props.salesforceInstanceUrl,
    isSlashCommandsEnabled: props.isSlashCommandsEnabled,
    isActionsEnabled: props.isActionsEnabled,
    isDeepLinksEnabled: props.isDeepLinksEnabled,
    isSourcesEnabled: props.isSourcesEnabled,
    isFileUploadEnabled: props.isFileUploadEnabled,
    syncAgentModeToBackend: props.syncAgentModeToBackend,
  });

  const loadMoreMessagesRef = useInfiniteScroll({
    onLoadMore: fetchNextMessagePage,
    hasMore: !!hasNextMessagePage,
    isLoading: isFetchingNextMessagePage,
  });

  return (
    <Profiler id="ChatV2Container" onRender={reportRenderTiming}>
      {chatV2.isDeepResearchMode && chatV2.transformedMessages.length > 0 ? (
        /* Deep Research Mode */
        <>
          {banner}
          <DeepResearchConversation
            messages={chatV2.transformedMessages}
            userName={user?.firstName || user?.name?.split(" ")[0]}
            userEmail={user?.email}
            conversationId={conversationId}
            researchResults={chatV2.effectiveResearchResults ?? undefined}
            isDeepResearchRunning={chatV2.isDeepResearchRunning}
            onSendMessage={chatV2.handleSendMessage}
            onStopStreaming={chatV2.handleStopStreaming}
            onArtifactClick={chatV2.handleArtifactClick}
            onApprove={chatV2.handleApproval}
            onReject={chatV2.handleRejection}
            placeholder="Ask von anything"
            disableSubmit={!chatV2.canSubmitFinal}
            onInputWhileDisabled={onDisabledInteraction}
            enableCommands={isSlashCommandsEnabled}
            showPlusMenu={isFileUploadEnabled}
          />
        </>
      ) : (
        /* Regular V2 Mode */
        <div className="flex h-full w-full">
          <div className="flex-1 min-w-0">
            <Chat
              title="von AI"
              userId={user?.id}
              userName={user?.firstName || user?.name?.split(" ")[0]}
              userEmail={user?.email}
              apiBaseUrl={config.apiBaseUrl}
              conversationId={conversationId}
              messages={chatV2.transformedMessages}
              onSendMessage={chatV2.handleSendMessage}
              onStopStreaming={chatV2.handleStopStreaming}
              inputValue={chatV2.autoPopulatedInput}
              onInputValueChange={chatV2.setAutoPopulatedInput}
              isLoading={false}
              loadMoreRef={loadMoreMessagesRef}
              isFetchingMore={isFetchingNextMessagePage}
              placeholder="Ask von anything"
              variant="floating"
              height="100%"
              width="100%"
              showMessagesFromIndex={chatV2.showMessagesFromIndex}
              onArtifactClick={chatV2.handleArtifactClick}
              banner={banner}
              disableSubmit={!chatV2.canSubmitFinal}
              examplePromptsDisabled={!chatV2.canSubmitFinal}
              onExamplePromptDisabledClick={onDisabledInteraction}
              onInputWhileDisabled={onDisabledInteraction}
              enableCommands={isSlashCommandsEnabled}
              enableActions={isActionsEnabled}
              onApprove={chatV2.handleApproval}
              onReject={chatV2.handleRejection}
              showTransparency={isSourcesEnabled}
              onTransparencyClick={chatV2.handleTransparencyClick}
              salesforceInstanceUrl={salesforceInstanceUrl}
              enableDeepLinks={isDeepLinksEnabled}
              thinkingProcessVersion="v2"
              useStandardInput={true}
              isAgentLocked={isAgentLocked}
              lockedAgentMode={lockedAgentMode}
              showPlusMenu={isFileUploadEnabled}
              controlledAttachments={chatV2.fileAttachmentState}
              onRemoveAttachment={chatV2.handleRemoveAttachment}
              onFilesSelected={chatV2.handleFilesSelected}
              onFileClick={chatV2.handleFileClick}
              onFileError={(_error: string, message: string) => {
                chatV2.setFileErrorMessage(message);
              }}
              fileErrorMessage={chatV2.fileErrorMessage}
              onDismissFileError={() => chatV2.setFileErrorMessage(null)}
              onFileArtifactClick={chatV2.handleFileArtifactClick}
              onArtifactDownload={chatV2.handleArtifactDownload}
            />
          </div>

          {/* File Artifact Viewer Panel (self-manages width + resize) */}
          {chatV2.fileArtifactPanel.isOpen &&
            chatV2.fileArtifactPanel.fileName && (
              <ArtifactViewerPanel
                fileName={chatV2.fileArtifactPanel.fileName}
                artifactType={
                  chatV2.fileArtifactPanel.artifactType ?? "document"
                }
                mimeType={chatV2.fileArtifactPanel.mimeType}
                downloadUrl={chatV2.fileArtifactPanel.downloadUrl}
                onClose={chatV2.closeFileArtifactPanel}
                onDownload={
                  chatV2.fileArtifactPanel.fileId
                    ? () =>
                        chatV2.handleArtifactDownload(
                          chatV2.fileArtifactPanel.fileId!,
                        )
                    : undefined
                }
              />
            )}
        </div>
      )}

      {/* Transparency Drawer */}
      <LazyTransparencyDrawer
        isOpen={chatV2.isTransparencyOpen}
        onClose={chatV2.handleCloseTransparency}
        conversationId={conversationId}
        runId={chatV2.transparencyRunId}
        artifactSummaries={chatV2.transparencyArtifactSummaries}
        isListLoading={chatV2.isTransparencyLoading}
        title="Data Sources"
      />

      {/* Artifact Drawer (V2 style) */}
      <SingleArtifactDrawerContainer
        conversationId={conversationId}
        drawerState={chatV2.artifactState}
        onClose={chatV2.closeArtifact}
      />

      {/* File Preview Modal */}
      {chatV2.filePreviewAttachment && (
        <FilePreviewModal
          attachment={chatV2.filePreviewAttachment}
          downloadUrl={chatV2.filePreviewUrl}
          isLoading={chatV2.isFilePreviewLoading}
          onClose={() => {
            chatV2.setFilePreviewAttachment(null);
            chatV2.setFilePreviewUrl(null);
          }}
        />
      )}
    </Profiler>
  );
}
