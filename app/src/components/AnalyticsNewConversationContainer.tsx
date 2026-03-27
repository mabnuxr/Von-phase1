/**
 * AnalyticsNewConversationContainer
 *
 * Shown in the Analytics chat pane when no conversation exists yet.
 * On first message:
 *   1. Create a DashboardBuilder conversation
 *   2. Pre-populate conversation metadata cache
 *   3. Send the message via useSendMessage (optimistic chatStore update)
 *      with the dashboard as a reference
 *   4. Call onCreated(conversationId) — Analytics swaps to AnalyticsChatContainer
 */

import { useMemo } from "react";
import { Chat, ConversationMode } from "@vonlabs/design-components";

import { useAppShell } from "../hooks/useAppShell";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { useSalesforceConnection } from "../hooks/useSalesforceConnection";
import { useCreateAndSendMessage } from "../hooks/useCreateAndSendMessage";
import { useCommandsPanel } from "../hooks/useCommandsPanel";
import { useReferenceStack } from "../hooks/useReferenceStack";
import type { ReferenceStackLayer } from "../hooks/useReferenceStack";
import { ReferenceType } from "../types/conversation";
import type { MessageReference } from "../types/conversation";
import { AnalyticsChatEmptyState } from "./AnalyticsChatEmptyState";
import { config } from "../config";
import { CHAT_PANE_AGENT_MODES } from "../config/constants";

export interface AnalyticsNewConversationContainerProps {
  dashboardId: string;
  dashboardTitle: string;
  dashboardVersion: number;
  onCreated: (conversationId: string) => void;
}

export function AnalyticsNewConversationContainer({
  dashboardId,
  dashboardTitle,
  dashboardVersion,
  onCreated,
}: AnalyticsNewConversationContainerProps) {
  const { user } = useAppShell();
  const { isSlashCommandsEnabled, isFileUploadEnabled } = useFeatureFlag();
  const {
    isConnected: isSalesforceConnected,
    isAuthenticated: isSalesforceAuthenticated,
  } = useSalesforceConnection();

  const canSubmit = isSalesforceConnected && isSalesforceAuthenticated;

  const {
    commands,
    isLoadingCommands,
    isSavingCommand,
    handleSaveCommand,
    handleUploadFile,
    handleRequestFilePreviewUrl,
    handleDeleteCommand,
    handleToggleFavorite,
  } = useCommandsPanel(user?.id);

  const dashboardBaseLayer: ReferenceStackLayer = useMemo(
    () => ({
      display: {
        type: ReferenceType.Dashboard,
        name: dashboardTitle,
        id: dashboardId,
      },
      reference: {
        refId: `dashboard-${dashboardId}`,
        type: ReferenceType.Dashboard,
        context: {
          dashboardId,
          dashboardVersion,
          dashboardName: dashboardTitle,
        },
      },
    }),
    [dashboardId, dashboardTitle, dashboardVersion],
  );

  const refStack = useReferenceStack(dashboardBaseLayer);

  const references: MessageReference[] = useMemo(
    () => [dashboardBaseLayer.reference],
    [dashboardBaseLayer],
  );

  const {
    handleSendMessage,
    transformedMessages,
    isCreating,
    fileAttachments,
    addFiles,
    removeFile,
    fileErrorMessage,
    dismissFileError,
  } = useCreateAndSendMessage({
    agentVersion: "v2",
    isAgentV2: true,
    title: dashboardTitle,
    fixedMode: ConversationMode.DashboardBuilder,
    references,
    onCreated,
  });

  return (
    <Chat
      title={dashboardTitle}
      userId={user?.id}
      userName={user?.firstName || user?.name?.split(" ")[0]}
      userEmail={user?.email}
      apiBaseUrl={config.apiBaseUrl}
      conversationId=""
      messages={transformedMessages}
      onSendMessage={handleSendMessage}
      isLoading={false}
      placeholder="Make changes to this dashboard..."
      variant="floating"
      height="100%"
      width="100%"
      thinkingProcessVersion="v2"
      useStandardInput
      isAgentLocked={true}
      lockedConversationMode={ConversationMode.DashboardBuilder}
      disableSubmit={!canSubmit || isCreating}
      enableFileUpload={isFileUploadEnabled}
      controlledAttachments={fileAttachments}
      onFilesSelected={addFiles}
      onRemoveAttachment={removeFile}
      fileErrorMessage={fileErrorMessage}
      onDismissFileError={dismissFileError}
      enableCommands={isSlashCommandsEnabled}
      commands={commands}
      isLoadingCommands={isLoadingCommands}
      onSaveCommand={handleSaveCommand}
      onDeleteCommand={handleDeleteCommand}
      isSavingCommand={isSavingCommand}
      isAdmin={user?.roles?.some((r) => r.toLowerCase() === "admin")}
      onToggleFavorite={handleToggleFavorite}
      onRequestFilePreviewUrl={handleRequestFilePreviewUrl}
      onUploadFile={handleUploadFile}
      availableAgentModes={CHAT_PANE_AGENT_MODES}
      referenceContext={refStack.activeContext}
      onRemoveReference={refStack.canRemove ? refStack.removeTop : undefined}
    >
      <Chat.EmptyState>
        <AnalyticsChatEmptyState />
      </Chat.EmptyState>
    </Chat>
  );
}
