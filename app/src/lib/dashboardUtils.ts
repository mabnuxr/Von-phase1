// Design components types
import type {
  Message as ChatMessage,
  TimelineStep,
} from "@vonlabs/design-components";
import type { ChatItem } from "@vonlabs/design-components";

// App services
import { conversationsService } from "../services/conversationsService";

// App types
import type { MessageWithStreaming, Conversation } from "../types/conversation";

// Existing utilities
import { replayAguiEvents } from "../utils/replayAguiEvents";
import { getDisplayTitle } from "./conversationUtils";
import {
  transformAguiToTimelineSteps,
  getElapsedTimeFromEvents,
  type ResearchResultsState,
} from "../utils/transformAguiToTimelineSteps";

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
 * Calls resumeConversation API - state updates come from Pusher events
 */
export async function handleToolApproval(
  toolCallId: string,
  runId: string,
  conversationId: string,
): Promise<void> {
  try {
    await conversationsService.resumeConversation(conversationId, true, runId);
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
 * Calls resumeConversation API - state updates come from Pusher events
 */
export async function handleToolRejection(
  toolCallId: string,
  runId: string,
  conversationId: string,
): Promise<void> {
  try {
    await conversationsService.resumeConversation(conversationId, false, runId);
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

/**
 * V2 live streaming data from Pusher channel
 */
export interface V2LiveData {
  timelineSteps: TimelineStep[];
  isThinking: boolean;
  elapsedTime: number;
  finalResponse: string;
  isFinalResponseStreaming: boolean;
  researchResults: ResearchResultsState;
}

/**
 * Result of transforming messages with research results
 */
export interface TransformMessagesResult {
  messages: ChatMessage[];
  researchResults: ResearchResultsState | null;
}

/**
 * Transform messages for V2 agent with timeline steps and extract persisted research results
 * (Internal helper - use transformConversationMessages instead)
 */
function transformMessagesForV2(
  conversationMessages: MessageWithStreaming[],
  v2LiveData: V2LiveData,
): TransformMessagesResult {
  const messages = transformMessagesToChatFormat(conversationMessages);
  const usableV2TimelineSteps = v2LiveData.timelineSteps.filter(
    (step) => step.category !== "e2b",
  );

  let persistedResearchResults: ResearchResultsState | null = null;

  // Check if live data already has research results
  const hasLiveResearchResults =
    v2LiveData.researchResults?.isStreaming ||
    v2LiveData.researchResults?.isCompleted;

  const transformedMessages = messages.map((msg, index) => {
    // Only process assistant messages
    if (msg.type !== "assistant") {
      return msg;
    }

    // Check if this is the latest assistant message
    const isLastAssistant = (() => {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].type === "assistant") {
          return i === index;
        }
      }
      return false;
    })();

    // If this is the latest message and we have live V2 data from Pusher, use it
    if (
      isLastAssistant &&
      (usableV2TimelineSteps.length > 0 ||
        v2LiveData.finalResponse ||
        v2LiveData.isThinking)
    ) {
      return {
        ...msg,
        isStreaming: v2LiveData.isThinking,
        timelineSteps: usableV2TimelineSteps,
        thinkingElapsedTime: v2LiveData.elapsedTime,
        v2FinalResponse: v2LiveData.finalResponse,
        v2FinalResponseStreaming: v2LiveData.isFinalResponseStreaming,
      };
    }

    // For persisted messages, transform events to timeline steps
    if (msg.events && msg.events.length > 0) {
      const {
        steps,
        finalResponse,
        isFinalResponseStreaming,
        researchResults,
      } = transformAguiToTimelineSteps(msg.events);
      const usableSteps = steps.filter((step) => step.category !== "e2b");
      const elapsed = getElapsedTimeFromEvents(msg.events);

      // Extract persisted research results; prefer the latest completed run when no live data
      // (allows full analysis to overwrite sample analysis after refresh)
      if (
        !hasLiveResearchResults &&
        researchResults.isCompleted &&
        researchResults.content
      ) {
        persistedResearchResults = researchResults;
      }

      return {
        ...msg,
        timelineSteps: usableSteps,
        thinkingElapsedTime: elapsed,
        v2FinalResponse: finalResponse,
        v2FinalResponseStreaming: isFinalResponseStreaming,
      };
    }

    return msg;
  });

  // Determine effective research results: live data takes precedence over persisted
  const effectiveResearchResults = hasLiveResearchResults
    ? v2LiveData.researchResults
    : persistedResearchResults;

  return {
    messages: transformedMessages,
    researchResults: effectiveResearchResults,
  };
}

/**
 * Transform messages for V1 agent (simple transformation, no research results)
 * (Internal helper - use transformConversationMessages instead)
 */
function transformMessagesForV1(
  conversationMessages: MessageWithStreaming[],
): TransformMessagesResult {
  return {
    messages: transformMessagesToChatFormat(conversationMessages),
    researchResults: null,
  };
}

/**
 * Unified function to transform conversation messages based on agent version
 *
 * This is the main entry point for message transformation. It handles:
 * - V1 agents: Simple message transformation
 * - V2 agents: Timeline steps, research results extraction, live streaming data
 *
 * @param conversationMessages - Raw messages from backend
 * @param isAgentV2 - Whether the agent is V2 (uses timeline thinking process)
 * @param v2LiveData - Live streaming data from Pusher (only used for V2)
 * @returns Transformed messages and research results (if any)
 */
export function transformConversationMessages(
  conversationMessages: MessageWithStreaming[],
  isAgentV2: boolean,
  v2LiveData?: V2LiveData,
): TransformMessagesResult {
  if (!isAgentV2) {
    return transformMessagesForV1(conversationMessages);
  }

  // V2 requires live data - provide defaults if not supplied
  const liveData: V2LiveData = v2LiveData ?? {
    timelineSteps: [],
    isThinking: false,
    elapsedTime: 0,
    finalResponse: "",
    isFinalResponseStreaming: false,
    researchResults: {
      isStreaming: false,
      isCompleted: false,
      content: "",
      metadata: null,
      messageId: null,
    },
  };

  return transformMessagesForV2(conversationMessages, liveData);
}
