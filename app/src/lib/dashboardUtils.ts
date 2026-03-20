// Design components types
import type {
  Message as ChatMessage,
  TimelineStep,
  RunFinishedEvent,
  EmailDraftArtifact,
} from "@vonlabs/design-components";
import type { ChatItem } from "@vonlabs/design-components";

// App services
import { conversationsService } from "../services/conversationsService";

// App types
import type {
  MessageWithStreaming,
  Conversation,
  DashboardMetadata,
} from "../types/conversation";

// Existing utilities
import { replayAguiEvents } from "../utils/replayAguiEvents";
import { findLast } from "../utils/findLast";
import { getDisplayTitle } from "./conversationUtils";
import {
  transformAguiToTimelineSteps,
  getElapsedTimeFromEvents,
  DEFAULT_EXPIRED_APPROVAL_MESSAGE,
  type ResearchResultsState,
} from "../utils/transformAguiToTimelineSteps";
import { draftCardToArtifact, type DraftCard } from "./emailUtils";

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

    // Scan tool call results for an email draft card (result.draft_card.type === "email_draft")
    const allToolCalls = [
      ...(toolCalls ?? []),
      ...(stepMessages?.flatMap((s) => s.toolCalls ?? []) ?? []),
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const draftCard = allToolCalls.reduce<DraftCard | null>((found, tc) => {
      if (found) return found;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = (tc.result as any)?.raw;
      if (raw?.draft_card?.type === "email_draft") return raw.draft_card as DraftCard;
      return null;
    }, null);

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
      attachments: streamingMsg.fileAttachments?.map((fa) => ({
        id: fa.fileId,
        name: fa.fileName,
        size: fa.fileSize,
        type: fa.mimeType,
        extension: fa.extension,
        category: fa.category as
          | "document"
          | "spreadsheet"
          | "presentation"
          | "text"
          | "image",
      })),
      // Map the quick command so ChatMessage can render CommandPreview
      command: streamingMsg.command
        ? {
            id: streamingMsg.command.id,
            name: streamingMsg.command.name,
            prompt: streamingMsg.command.prompt,
            createdAt: "",
            updatedAt: "",
            dataSources: streamingMsg.command.dataSources?.map((ds) => ({
              id: ds.fileId,
              name: ds.fileName,
              size: ds.fileSize,
              type: ds.mimeType,
              extension: ds.extension,
              category: ds.category,
              s3Key: ds.s3Key,
            })),
          }
        : undefined,
      // Email draft: from tool result draft_card payload
      emailDraftArtifacts: draftCard
        ? [draftCardToArtifact(draftCard, streamingMsg.id)]
        : undefined,
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
 * Retry an async operation with exponential backoff.
 * Retries on network errors (TypeError from fetch) and 5xx server errors.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelayMs: number = 1000,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isRetryable =
        error instanceof TypeError || // Network error (fetch failed)
        (error &&
          typeof error === "object" &&
          "status" in error &&
          (error as { status: number }).status >= 500);
      if (!isRetryable || attempt === maxRetries) break;
      await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** attempt));
    }
  }
  throw lastError;
}

/**
 * Handle approval of a tool call request
 * Calls resumeConversation API with retry - state updates come from Pusher events
 */
export async function handleToolApproval(
  toolCallId: string,
  runId: string,
  conversationId: string,
): Promise<void> {
  try {
    await withRetry(() =>
      conversationsService.resumeConversation(conversationId, true, runId),
    );
    if (import.meta.env.DEV) {
      console.log(
        "[Dashboard] Approval sent for tool:",
        toolCallId,
        "runId:",
        runId,
      );
    }
  } catch (error) {
    console.error("[Dashboard] Failed to send approval after retries:", error);
    throw error;
  }
}

/**
 * Handle rejection of a tool call request
 * Calls resumeConversation API with retry - state updates come from Pusher events
 */
export async function handleToolRejection(
  toolCallId: string,
  runId: string,
  conversationId: string,
): Promise<void> {
  try {
    await withRetry(() =>
      conversationsService.resumeConversation(conversationId, false, runId),
    );
    if (import.meta.env.DEV) {
      console.log(
        "[Dashboard] Rejection sent for tool:",
        toolCallId,
        "runId:",
        runId,
      );
    }
  } catch (error) {
    console.error("[Dashboard] Failed to send rejection after retries:", error);
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
  isAwaitingApproval: boolean;
  researchResults: ResearchResultsState;
  stoppedByUser: boolean;
  /** Error message if the current run failed */
  runErrorMessage: string;
  /** Run ID currently being processed by V2 (null when no run has been received) */
  currentRunId: string | null;
  /** Agent-generated file artifacts grouped by runId (from useAgentArtifacts) */
  agentArtifactsByRunId?: Map<
    string,
    import("../services/fileUploadService").FileMetadataResponse[]
  >;
  /** Conversation phase for approval button control */
  phase?: "plan-proposed" | "ask" | null;
  /** Dashboard metadata from the current run's RUN_FINISHED event (null if none) */
  dashboard?: DashboardMetadata | null;
  /** Email draft artifact detected from tool results during live streaming */
  emailDraftArtifact?: EmailDraftArtifact | null;
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

    // If this is the latest message and we have live V2 data from Pusher, use it.
    // Guard: when the message is already streaming (optimistic placeholder) but the
    // V2 hook hasn't started a new run yet (no part of the run is active — neither
    // thinking nor final response streaming), skip overwriting so the message keeps
    // isStreaming=true and the thinking process UI renders immediately.
    const hasLiveV2Data =
      usableV2TimelineSteps.length > 0 ||
      v2LiveData.finalResponse ||
      v2LiveData.isThinking ||
      !!v2LiveData.runErrorMessage ||
      v2LiveData.stoppedByUser ||
      !!v2LiveData.currentRunId;
    const isRunActive =
      v2LiveData.isThinking || v2LiveData.isFinalResponseStreaming;
    // V2 data is "stale" only when the message is still marked as streaming (optimistic
    // placeholder) but the V2 hook hasn't started a run yet. Once V2 has processed any
    // run (currentRunId set) or reached a terminal state (steps, response, error, stopped),
    // it should never be treated as stale — even if msg.isStreaming is still true.
    // Also check that the V2 data belongs to the current message's run (prevents
    // stale V2 data from a previous run leaking to a new back-to-back message).
    const msgBelongsToCurrentV2Run =
      !v2LiveData.currentRunId || msg.runId === v2LiveData.currentRunId;
    const hasV2TerminalData =
      usableV2TimelineSteps.length > 0 ||
      v2LiveData.finalResponse ||
      !!v2LiveData.runErrorMessage ||
      v2LiveData.stoppedByUser ||
      !!v2LiveData.currentRunId;
    const isStaleV2Data =
      msg.isStreaming &&
      !isRunActive &&
      (!hasV2TerminalData ||
        (!msgBelongsToCurrentV2Run &&
          !(v2LiveData.stoppedByUser && msg.runId)));

    // Don't overlay V2 live data on already-persisted completed messages
    // (they have their own events and should use the persisted path below).
    // Exception: if V2 just finished tracking a run and this is the latest
    // assistant message, keep using live data so the timer value (which
    // correctly excludes approval wait) is shown instead of wall-clock elapsed
    // from event timestamps. We can't compare msg.runId to v2LiveData.currentRunId
    // because updateMessageId sets msg.runId to the backend message ID (not run_id).
    const v2JustFinishedThisRun =
      isLastAssistant &&
      hasLiveV2Data &&
      !isRunActive &&
      !!v2LiveData.currentRunId;
    const shouldUsePersistedData =
      !msg.isStreaming &&
      !isRunActive &&
      msg.events &&
      msg.events.length > 0 &&
      !v2JustFinishedThisRun;

    if (
      isLastAssistant &&
      hasLiveV2Data &&
      !isStaleV2Data &&
      !shouldUsePersistedData
    ) {
      return {
        ...msg,
        isStreaming: v2LiveData.isThinking && !v2LiveData.isAwaitingApproval,
        timelineSteps: usableV2TimelineSteps,
        thinkingElapsedTime: v2LiveData.elapsedTime,
        v2FinalResponse: v2LiveData.finalResponse,
        v2FinalResponseStreaming: v2LiveData.isFinalResponseStreaming,
        stoppedByUser: v2LiveData.stoppedByUser,
        phase: v2LiveData.phase,
        dashboard: v2LiveData.dashboard ?? null,
        emailDraftArtifacts: v2LiveData.emailDraftArtifact
          ? [v2LiveData.emailDraftArtifact]
          : msg.emailDraftArtifacts,
        // Propagate error from failed run
        ...(v2LiveData.runErrorMessage
          ? {
              status: "failed" as const,
              errorMessage: v2LiveData.runErrorMessage,
            }
          : {}),
      };
    }

    // For persisted messages, transform events to timeline steps
    if (msg.events && msg.events.length > 0) {
      const {
        steps,
        finalResponse,
        researchResults,
        stoppedByUser: persistedStoppedByUser,
        runErrorMessage: persistedRunErrorMessage,
        emailDraftArtifact: persistedEmailDraftArtifact,
        isExpiredApproval: persistedIsExpiredApproval,
      } = transformAguiToTimelineSteps(msg.events);
      const usableSteps = steps.filter((step) => step.category !== "e2b");
      const elapsed = getElapsedTimeFromEvents(msg.events);

      // For persisted (non-streaming) messages, ensure any remaining in-progress
      // steps are marked complete. This handles cases where events were persisted
      // before a RUN_FINISHED event (e.g., stopped runs without a final event).
      // Steps still in "awaiting-approval" were never resolved (the user sent a
      // new message or the approval expired) — mark them as expired so the card
      // does not misleadingly show "Approved".
      for (const step of usableSteps) {
        if (step.status === "in-progress" || step.status === "pending") {
          step.status = "complete";
        } else if (step.status === "awaiting-approval") {
          // A completed (non-streaming) message should never have actionable
          // pending approvals.  If the step is still awaiting-approval the
          // approval was never resolved — the user sent a new message, the
          // page was refreshed, or the backend expired it without an explicit
          // TOOL_CALL_RESULT.  Mark it expired unconditionally so approve/
          // reject buttons don't reappear for a superseded run.
          step.status = "expired";
        }
      }

      // Use stoppedByUser from events, falling back to the message-level flag
      // (set by replayAguiEvents or the backend directly)
      const effectiveStoppedByUser =
        persistedStoppedByUser ||
        ("stoppedByUser" in msg && msg.stoppedByUser === true);

      // Extract phase and dashboard from persisted events
      const runFinishedEvent = findLast(
        msg.events,
        (e) => e.event?.type === "RUN_FINISHED",
      );
      const runFinishedResult = runFinishedEvent
        ? (
            runFinishedEvent.event as RunFinishedEvent & {
              result: {
                phase?: string | null;
                dashboard?: DashboardMetadata | null;
              };
            }
          ).result
        : null;
      const persistedPhase =
        (runFinishedResult?.phase as "plan-proposed" | "ask" | null) ?? null;
      const persistedDashboard = runFinishedResult?.dashboard ?? null;

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
        isStreaming: false,
        timelineSteps: usableSteps,
        thinkingElapsedTime: elapsed,
        v2FinalResponse: finalResponse,
        v2FinalResponseStreaming: false,
        stoppedByUser: effectiveStoppedByUser,
        phase: persistedPhase,
        dashboard: persistedDashboard,
        emailDraftArtifacts: persistedEmailDraftArtifact
          ? [persistedEmailDraftArtifact]
          : msg.emailDraftArtifacts,
        // Propagate expired or error status.  Check both the transform flag
        // (backend sent an explicit expired result) and the post-processed
        // steps (awaiting-approval unconditionally marked expired above, e.g.
        // when the user sent a new message and no expired TOOL_CALL_RESULT
        // exists in the persisted events).
        ...(persistedIsExpiredApproval ||
        usableSteps.some((s) => s.status === "expired" && s.approval)
          ? {
              status: "expired" as const,
              errorMessage:
                steps.find((s) => s.status === "expired")?.errorMessage ||
                DEFAULT_EXPIRED_APPROVAL_MESSAGE,
            }
          : persistedRunErrorMessage
            ? {
                status: "failed" as const,
                errorMessage: persistedRunErrorMessage,
              }
            : {}),
      };
    }

    // Fallback for completed messages with content but no events
    // (e.g., after force-complete persisted messageContent before events arrived)
    if (!msg.isStreaming && msg.content) {
      return {
        ...msg,
        v2FinalResponse: msg.content,
        v2FinalResponseStreaming: false,
      };
    }

    return msg;
  });

  // Attach agent-generated file artifacts to assistant messages by runId
  if (v2LiveData.agentArtifactsByRunId) {
    const artifactMap = v2LiveData.agentArtifactsByRunId;
    for (let i = 0; i < transformedMessages.length; i++) {
      const msg = transformedMessages[i];
      if (msg.type === "assistant" && msg.runId) {
        const artifacts = artifactMap.get(msg.runId);
        if (artifacts && artifacts.length > 0) {
          const previewPdfs = artifacts.filter(
            (a) => a.artifactType === "slide_preview_pdf",
          );
          const displayArtifacts = artifacts.filter(
            (a) => a.artifactType !== "slide_preview_pdf",
          );
          transformedMessages[i] = {
            ...msg,
            artifacts: displayArtifacts.map((a) => {
              const stem = a.fileName.replace(/\.pptx$/i, "");
              const pdfPreview = previewPdfs.find(
                (p) => p.fileName === `${stem}.pdf`,
              );
              return {
                fileId: a.id,
                fileName: a.fileName,
                artifactType: a.artifactType ?? "document",
                mimeType: a.mimeType,
                isPending: a.isPending ?? a.status !== "completed",
                pdfPreview: pdfPreview
                  ? { id: pdfPreview.id, fileName: pdfPreview.fileName }
                  : undefined,
              };
            }),
          };
        }
      }
    }
  }

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
    isAwaitingApproval: false,
    researchResults: {
      isStreaming: false,
      isCompleted: false,
      content: "",
      metadata: null,
      messageId: null,
    },
    stoppedByUser: false,
    runErrorMessage: "",
    currentRunId: null,
    phase: null,
  };

  return transformMessagesForV2(conversationMessages, liveData);
}
