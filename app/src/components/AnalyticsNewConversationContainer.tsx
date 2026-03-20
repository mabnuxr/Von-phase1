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

import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Chat } from "@vonlabs/design-components";
import { ConversationMode } from "@vonlabs/design-components";

import { useAppShell } from "../hooks/useAppShell";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { useSalesforceConnection } from "../hooks/useSalesforceConnection";
import { useCreateConversation } from "../hooks/useConversations";
import { useSendMessage } from "../hooks/useSendMessage";
import { useReferenceStack } from "../hooks/useReferenceStack";
import type { ReferenceStackLayer } from "../hooks/useReferenceStack";
import { ReferenceType } from "../types/conversation";
import type { MessageReference } from "../types/conversation";
import { AnalyticsChatEmptyState } from "./AnalyticsChatEmptyState";
import { config } from "../config";

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
  const queryClient = useQueryClient();
  const { user } = useAppShell();
  const { isSlashCommandsEnabled, isFileUploadEnabled } = useFeatureFlag();
  const {
    isConnected: isSalesforceConnected,
    isAuthenticated: isSalesforceAuthenticated,
  } = useSalesforceConnection();

  const canSubmit = isSalesforceConnected && isSalesforceAuthenticated;

  const { mutateAsync: createConversation } = useCreateConversation();
  const { mutate: sendMessage } = useSendMessage();

  const [isCreating, setIsCreating] = useState(false);

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

  const dashboardRef: MessageReference = useMemo(
    () => ({
      refId: `dashboard-${dashboardId}`,
      type: ReferenceType.Dashboard,
      context: {
        dashboardId,
        dashboardVersion,
        dashboardName: dashboardTitle,
      },
    }),
    [dashboardId, dashboardTitle, dashboardVersion],
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (isCreating) return;
      setIsCreating(true);
      try {
        // 1. Create DashboardBuilder conversation
        const res = await createConversation({
          title: dashboardTitle,
          agentVersion: "v2",
          mode: ConversationMode.DashboardBuilder,
        });
        const newId = res.conversation.conversationId;

        // 2. Pre-populate conversation metadata cache
        queryClient.setQueryData(["conversation", newId], res.conversation);

        // 3. Send the first message with the dashboard reference
        sendMessage({
          conversationId: newId,
          content,
          references: [dashboardRef],
        });

        // 4. Notify parent — Analytics swaps to AnalyticsChatContainer
        onCreated(newId);
      } catch (error) {
        console.error(
          "[AnalyticsNewConversationContainer] Failed to create conversation:",
          error,
        );
        setIsCreating(false);
      }
    },
    [
      createConversation,
      dashboardRef,
      dashboardTitle,
      isCreating,
      onCreated,
      queryClient,
      sendMessage,
    ],
  );

  return (
    <Chat
      title={dashboardTitle}
      userId={user?.id}
      userName={user?.firstName || user?.name?.split(" ")[0]}
      userEmail={user?.email}
      apiBaseUrl={config.apiBaseUrl}
      conversationId=""
      messages={[]}
      onSendMessage={handleSendMessage}
      isLoading={false}
      placeholder="Make changes to this dashboard..."
      variant="floating"
      height="100%"
      width="100%"
      thinkingProcessVersion="v2"
      useStandardInput
      disableSubmit={!canSubmit || isCreating}
      enableFileUpload={isFileUploadEnabled}
      enableCommands={isSlashCommandsEnabled}
      referenceContext={refStack.activeContext}
      onRemoveReference={refStack.canRemove ? refStack.removeTop : undefined}
    >
      <Chat.EmptyState>
        <AnalyticsChatEmptyState />
      </Chat.EmptyState>
    </Chat>
  );
}
