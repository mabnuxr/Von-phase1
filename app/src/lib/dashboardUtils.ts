// Design components types and functions
import type { Message as ChatMessage } from "@vonlabs/design-components";
import type { ChatItem } from "@vonlabs/design-components";
import { resumeConversation } from "@vonlabs/design-components";

// App types
import type { MessageWithStreaming, Conversation } from "../types/conversation";

// Existing utilities
import { replayAguiEvents } from "../utils/replayAguiEvents";
import { getDisplayTitle } from "./conversationUtils";

/**
 * Transform backend MessageWithStreaming to Chat component Message format
 * Replays AGUI events if needed to reconstruct stepMessages and toolCalls
 */
export function transformMessagesToChatFormat(
  conversationMessages: MessageWithStreaming[],
): ChatMessage[] {
  return conversationMessages.map((msg) => {
    const streamingMsg = msg as MessageWithStreaming;

    // For fetched messages with events, replay them to reconstruct stepMessages and toolCalls
    let content = streamingMsg.messageContent;
    let stepMessages = streamingMsg.stepMessages;
    let toolCalls = streamingMsg.toolCalls;
    let stoppedByUser = streamingMsg.stoppedByUser;

    // If message has events but no stepMessages/toolCalls, replay the events
    if (
      streamingMsg.events &&
      streamingMsg.events.length > 0 &&
      !streamingMsg.isStreaming &&
      (!stepMessages || !toolCalls || !content)
    ) {
      const replayedData = replayAguiEvents(streamingMsg.events);
      if (replayedData) {
        content = replayedData.content || content;
        stepMessages = replayedData.stepMessages;
        toolCalls = replayedData.toolCalls;
        stoppedByUser = replayedData.stoppedByUser ?? stoppedByUser;
      }
    }

    return {
      id: streamingMsg.id,
      type:
        streamingMsg.role === "user"
          ? ("user" as const)
          : ("assistant" as const),
      content,
      timestamp: new Date(streamingMsg.createdAt),
      isStreaming: streamingMsg.isStreaming || false,
      isReasoningStreaming: streamingMsg.isReasoningStreaming || false,
      reasoningContent: streamingMsg.reasoningContent,
      // AGUI data (from backend or replayed)
      toolCalls,
      stepMessages,
      status: streamingMsg.status,
      errorMessage: streamingMsg.errorMessage,
      events: streamingMsg.events,
      // IDs for artifact fetching and retry operations
      messageId: streamingMsg.id, // Use actual message ID for API calls
      runId: streamingMsg.runId, // Preserve run ID separately
      conversationId: streamingMsg.conversationId,
      stoppedByUser,
    } as ChatMessage;
  });
}

/**
 * Transform Conversation entities to ChatSidebar items
 * Filters out empty titles and applies animated titles
 */
export function transformConversationsToChatItems(
  conversations: Conversation[],
  animatedTitles: Map<string, string>,
): ChatItem[] {
  return conversations
    .filter((conv) => conv.title && conv.title.trim() !== "")
    .map((conv) => {
      // Check if this conversation has an animated title in progress
      const animatedTitle = animatedTitles.get(conv.conversationId);
      const displayTitle = animatedTitle || getDisplayTitle(conv.title);

      return {
        id: conv.conversationId, // Use UUID instead of MongoDB ObjectId
        label: displayTitle, // Use animated title if available, otherwise use regular title
        timestamp: new Date(conv.updatedAt || conv.createdAt).toLocaleString(),
        href: `/chat/${conv.conversationId}`, // Add href for proper link behavior
      };
    });
}

/**
 * Handle approval of a tool call request
 * Sets message to streaming state and calls resumeConversation API
 */
export async function handleToolApproval(
  toolCallId: string,
  runId: string,
  conversationId: string,
  apiBaseUrl: string,
  setMessageStreaming: (runId: string) => void,
): Promise<void> {
  // Start streaming optimistically so Thinking animation shows immediately
  setMessageStreaming(runId);
  try {
    await resumeConversation(apiBaseUrl, conversationId, true, runId);
    if (import.meta.env.DEV) {
      console.log(
        "[Dashboard] Approval sent for tool:",
        toolCallId,
        "runId:",
        runId,
      );
    }
  } catch (error) {
    console.error("[Dashboard] Failed to send approval:", error);
  }
}

/**
 * Handle rejection of a tool call request
 * Sets message to streaming state and calls resumeConversation API
 */
export async function handleToolRejection(
  toolCallId: string,
  runId: string,
  conversationId: string,
  apiBaseUrl: string,
  setMessageStreaming: (runId: string) => void,
): Promise<void> {
  // Start streaming optimistically so Thinking animation shows immediately
  setMessageStreaming(runId);
  try {
    await resumeConversation(apiBaseUrl, conversationId, false, runId);
    if (import.meta.env.DEV) {
      console.log(
        "[Dashboard] Rejection sent for tool:",
        toolCallId,
        "runId:",
        runId,
      );
    }
  } catch (error) {
    console.error("[Dashboard] Failed to send rejection:", error);
  }
}
