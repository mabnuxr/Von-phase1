/**
 * ChatV1Container - Container component for V1 chat conversations
 *
 * Renders the V1 chat experience using the Chat component from design-components.
 * All business logic lives in useChatV1 — this component is JSX only.
 *
 * Mounted with key={conversationId} from Dashboard, so it remounts cleanly
 * on conversation switch (no stale state, no race conditions).
 */

import { Profiler } from "react";
import { Chat, FilePreviewModal } from "@vonlabs/design-components";

import type { MessageWithStreaming } from "../types/conversation";
import type { User } from "../services";
import { config } from "../config";
import { useChatV1 } from "../hooks/useChatV1";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { ArtifactPaneContainer } from "./ArtifactPaneContainer";
import { reportRenderTiming } from "../lib/datadog";
import { useCommandsPanel } from "../hooks/useCommandsPanel";
import { useTenantMembers } from "../hooks/useTenantMembers";

export interface ChatV1ContainerProps {
  conversationId: string;
  user: User | null;
  conversationMessages: MessageWithStreaming[];
  isLoadingMessages: boolean;
  fetchNextMessagePage: () => void;
  hasNextMessagePage: boolean;
  isFetchingNextMessagePage: boolean;
  refetchMessages: () => Promise<unknown>;
  canSubmit: boolean;
  onDisabledInteraction: () => void;
  salesforceInstanceUrl?: string;
  isActionsEnabled: boolean;
  banner: React.ReactNode;
  onCollapseSidebar: () => void;
}

export function ChatV1Container(props: ChatV1ContainerProps) {
  const {
    conversationId,
    user,
    isFetchingNextMessagePage,
    fetchNextMessagePage,
    hasNextMessagePage,
    canSubmit,
    onDisabledInteraction,
    salesforceInstanceUrl,
    isActionsEnabled,
    banner,
  } = props;

  const {
    transformedMessages,
    showMessagesFromIndex,
    autoPopulatedInput,
    setAutoPopulatedInput,
    handleSendMessage,
    handleStopStreaming,
    fileAttachmentState,
    handleFilesSelected,
    handleRemoveAttachment,
    handleFileClick,
    fileErrorMessage,
    setFileErrorMessage,
    filePreviewAttachment,
    setFilePreviewAttachment,
    filePreviewUrl,
    setFilePreviewUrl,
    isFilePreviewLoading,
    artifactState,
    handleArtifactClick,
    closeArtifact,
    canSubmitFinal,
  } = useChatV1({
    conversationId: props.conversationId,
    user: props.user,
    conversationMessages: props.conversationMessages,
    refetchMessages: props.refetchMessages,
    canSubmit: props.canSubmit,
    onDisabledInteraction: props.onDisabledInteraction,
    isSalesforceReady: canSubmit,
    salesforceInstanceUrl: props.salesforceInstanceUrl,
    isSlashCommandsEnabled: true,
    isActionsEnabled: props.isActionsEnabled,
    isDeepLinksEnabled: true,
    isSourcesEnabled: true,
    isFileUploadEnabled: true,
  });

  const loadMoreMessagesRef = useInfiniteScroll({
    onLoadMore: fetchNextMessagePage,
    hasMore: !!hasNextMessagePage,
    isLoading: isFetchingNextMessagePage,
  });

  const {
    commands,
    isLoadingCommands,
    isSavingCommand,
    handleSaveCommand,
    handleUploadFile,
    handleRequestFilePreviewUrl,
    handleDeleteCommand,
    handleToggleFavorite,
    handleSendTest,
  } = useCommandsPanel(user?.id);

  const { data: tenantMembersData } = useTenantMembers(user?.tenantId);
  const tenantMembersForSchedule = (tenantMembersData ?? []).map((m) => ({
    id: m.id,
    email: m.email,
    firstName: m.firstName,
    lastName: m.lastName,
  }));
  const currentUserRecipient = user
    ? {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? user.name?.split(" ")[0] ?? "",
        lastName:
          user.lastName ?? user.name?.split(" ").slice(1).join(" ") ?? "",
      }
    : undefined;

  return (
    <Profiler id="ChatV1Container" onRender={reportRenderTiming}>
      <Chat
        title="von AI"
        userId={user?.id}
        userName={user?.firstName || user?.name?.split(" ")[0]}
        userEmail={user?.email}
        apiBaseUrl={config.apiBaseUrl}
        conversationId={conversationId}
        messages={transformedMessages}
        onSendMessage={handleSendMessage}
        onStopStreaming={handleStopStreaming}
        inputValue={autoPopulatedInput}
        onInputValueChange={setAutoPopulatedInput}
        isLoading={false}
        loadMoreRef={loadMoreMessagesRef}
        isFetchingMore={isFetchingNextMessagePage}
        placeholder="Reply.."
        height="100%"
        width="100%"
        showMessagesFromIndex={showMessagesFromIndex}
        onArtifactClick={handleArtifactClick}
        banner={banner}
        disableSubmit={!canSubmitFinal}
        onExamplePromptDisabledClick={onDisabledInteraction}
        onInputWhileDisabled={onDisabledInteraction}
        enableCommands={true}
        commands={commands}
        isLoadingCommands={isLoadingCommands}
        onSaveCommand={handleSaveCommand}
        onDeleteCommand={handleDeleteCommand}
        isSavingCommand={isSavingCommand}
        tenantMembers={tenantMembersForSchedule}
        currentUser={currentUserRecipient}
        onSendTest={handleSendTest}
        onToggleFavorite={handleToggleFavorite}
        onRequestFilePreviewUrl={handleRequestFilePreviewUrl}
        onUploadFile={handleUploadFile}
        enableActions={isActionsEnabled}
        salesforceInstanceUrl={salesforceInstanceUrl}
        enableDeepLinks={true}
        thinkingProcessVersion="v1"
        useStandardInput={false}
        controlledAttachments={fileAttachmentState}
        onRemoveAttachment={handleRemoveAttachment}
        onFilesSelected={handleFilesSelected}
        onFileClick={handleFileClick}
        onFileError={(_error: string, message: string) => {
          setFileErrorMessage(message);
        }}
        fileErrorMessage={fileErrorMessage}
        onDismissFileError={() => setFileErrorMessage(null)}
      />

      {/* Artifact Pane (V1 style) */}
      <ArtifactPaneContainer
        conversationId={conversationId}
        paneState={artifactState}
        onClose={closeArtifact}
      />

      {/* File Preview Modal */}
      {filePreviewAttachment && (
        <FilePreviewModal
          attachment={filePreviewAttachment}
          downloadUrl={filePreviewUrl}
          isLoading={isFilePreviewLoading}
          onClose={() => {
            setFilePreviewAttachment(null);
            setFilePreviewUrl(null);
          }}
        />
      )}
    </Profiler>
  );
}
