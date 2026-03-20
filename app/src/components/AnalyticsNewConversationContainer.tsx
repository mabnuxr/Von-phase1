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
import { Chat } from "@vonlabs/design-components";
import { ConversationMode } from "@vonlabs/design-components";

import { useAppShell } from "../hooks/useAppShell";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { useSalesforceConnection } from "../hooks/useSalesforceConnection";
import { useCreateAndSendMessage } from "../hooks/useCreateAndSendMessage";
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
  const { user } = useAppShell();
  const { isSlashCommandsEnabled, isFileUploadEnabled } = useFeatureFlag();
  const {
    isConnected: isSalesforceConnected,
    isAuthenticated: isSalesforceAuthenticated,
  } = useSalesforceConnection();

  const canSubmit = isSalesforceConnected && isSalesforceAuthenticated;

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

  const { handleSendMessage, transformedMessages, isCreating } =
    useCreateAndSendMessage({
      agentVersion: "v2",
      isAgentV2: true,
      title: dashboardTitle,
      fixedMode: ConversationMode.DashboardBuilder,
      references: [dashboardRef],
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
