/**
 * Transform AGUI events to TimelineStep[] format for TimelineThinkingProcess component
 *
 * This is the v2 transformation layer that converts raw AGUI events into the
 * structured format expected by the new TimelineThinkingProcess component.
 */

import type {
  AguiEventWrapper,
  TimelineStep,
  StepStatus,
  StepType,
  SourceType,
  EventCategory,
  ResearchResultsMetadata,
  BulkOperation,
} from "@vonlabs/design-components";
import {
  isApprovalTool,
  isGoogleCalendarApprovalTool,
} from "@vonlabs/design-components";

/** Default message shown when an approval request has expired or was invalidated. */
export const DEFAULT_EXPIRED_APPROVAL_MESSAGE = "Approval request has expired";

/**
 * Research results state for Deep Research workflow
 * This is a simplified version for the transform output
 */
export interface ResearchResultsState {
  /** Whether research results are currently streaming */
  isStreaming: boolean;
  /** Whether research results have completed */
  isCompleted: boolean;
  /** Accumulated research results content (markdown) */
  content: string;
  /** Metadata from RESEARCH_RESULTS_START event */
  metadata: ResearchResultsMetadata | null;
  /** Message ID for the research results */
  messageId: string | null;
}

// Extended event types for STEP_STARTED/STEP_FINISHED with step_number
// These events provide step boundaries for timing and tracking
interface StepStartedEventWithNumber {
  type: "STEP_STARTED";
  step_number: number;
  step_name: string;
  metadata?: {
    category?: EventCategory;
  };
}

interface StepFinishedEventWithNumber {
  type: "STEP_FINISHED";
  step_number: number;
  step_name: string;
  metadata?: {
    category?: string;
  };
}

/**
 * Check if a tool is any type of approval tool (Salesforce, Google Calendar, or Deep Research)
 */
function isAnyApprovalTool(toolName: string): boolean {
  return isApprovalTool(toolName) || isGoogleCalendarApprovalTool(toolName);
}

/**
 * Get the approval type based on tool name
 */
function getApprovalType(
  toolName: string,
): "salesforce" | "calendar" | "generic" {
  if (isApprovalTool(toolName)) return "salesforce";
  if (isGoogleCalendarApprovalTool(toolName)) return "calendar";
  return "generic";
}

/**
 * Derive the fields for an expired approval from a tool result.
 */
function getExpiredApprovalFields(result: { message?: string }): {
  status: StepStatus;
  errorMessage: string;
} {
  return {
    status: "expired" as StepStatus,
    errorMessage: result.message || DEFAULT_EXPIRED_APPROVAL_MESSAGE,
  };
}

/**
 * Maps tool names to source types for the timeline visualization
 */
const TOOL_SOURCE_MAP: Record<string, SourceType> = {
  // Salesforce tools
  execute_sql_query: "salesforce",
  request_salesforce_approval: "salesforce",

  // Salesforce Tooling API
  salesforce_tooling_query: "salesforce",
  salesforce_tooling_mutate: "salesforce",

  // Gong tools
  search_gong_calls: "gong",
  get_gong_call_transcript: "gong",

  // Email tools
  search_emails: "email",
  get_email_content: "email",

  // Calendar tools
  get_calendar_events: "calendar",
  request_google_calendar_approval: "calendar",
};

/**
 * Get the source type for a tool name
 */
function getToolSource(toolName: string): SourceType {
  return TOOL_SOURCE_MAP[toolName] || "generic";
}

/**
 * Remove trailing colon from the previous step's text when a tool call step is hidden.
 * This prevents a dangling colon that was introducing the now-removed step.
 */
function removeTrailingColonFromPreviousStep(
  steps: TimelineStep[],
  stepIndex: number,
): void {
  if (stepIndex > 0) {
    const previousStep = steps[stepIndex - 1];
    if (previousStep.text && previousStep.text.trimEnd().endsWith(":")) {
      previousStep.text = previousStep.text.trimEnd().slice(0, -1);
    }
  }
}

/**
 * Approval data structure returned by detection
 */
interface DetectedApprovalData {
  toolCallId: string;
  summary: string;
  label: string;
  recordName?: string;
  recordId?: string;
  operation: "create" | "update" | "delete";
  changes?: Array<{
    field: string;
    before?: string | number | boolean | null;
    after?: string | number | boolean | null;
    display_name?: string;
  }>;
  fields?: Record<string, string | number | boolean | null>;
  approvalType:
    | "salesforce"
    | "calendar"
    | "bulk"
    | "deep_research"
    | "generic";
  // Bulk operations array for backward compat with BulkApprovalCard
  operations?: BulkOperation[];
  recordCount?: number;
  // Bulk records for per-record approval UI
  bulkRecords?: Array<{
    recordId: string;
    recordName: string;
    label: string;
    recordUrl?: string;
    changes: Array<{
      field: string;
      before?: string | number | boolean | null;
      after?: string | number | boolean | null;
      display_name?: string;
    }>;
  }>;
  // Deep research specific fields
  researchQuery?: string;
  estimatedTime?: string;
  sampleContent?: string;
  dataSources?: Array<{
    name: string;
    record_count: number;
    description?: string;
  }>;
}

/**
 * Normalize changes array: convert old_value/new_value to before/after for consistency.
 * This is a lightweight fallback — the backend now normalizes changes in _validate_operation(),
 * but TOOL_CALL_ARGS may arrive before backend validation completes.
 */
function normalizeChanges(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  changes: any[] | undefined,
):
  | Array<{
      field: string;
      before?: string | number | boolean | null;
      after?: string | number | boolean | null;
      display_name?: string;
    }>
  | undefined {
  if (!changes || changes.length === 0) return changes;

  return changes.map((change) => {
    const normalized: {
      field: string;
      before?: string | number | boolean | null;
      after?: string | number | boolean | null;
      display_name?: string;
    } = {
      field: change.field,
    };

    if ("before" in change && change.before !== undefined) {
      normalized.before = change.before;
    } else if ("old_value" in change && change.old_value !== undefined) {
      normalized.before = change.old_value;
    }

    if ("after" in change && change.after !== undefined) {
      normalized.after = change.after;
    } else if ("new_value" in change && change.new_value !== undefined) {
      normalized.after = change.new_value;
    }

    if (change.display_name) {
      normalized.display_name = change.display_name;
    }

    return normalized;
  });
}

/**
 * Map a single backend operation to the approval data format.
 * The backend now produces a uniform shape with `changes`, `record_id`, `label`,
 * and `record_name` across all tools (SF CRUD, Calendar, Tooling, Analytics).
 */
function mapUniformOperation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  op: Record<string, any>,
): {
  operation: "create" | "update" | "delete";
  recordId?: string;
  recordName: string;
  label: string;
  changes: Array<{
    field: string;
    before?: string | number | boolean | null;
    after?: string | number | boolean | null;
    display_name?: string;
  }>;
} {
  return {
    operation: (op.normalized_operation || op.operation || "update") as
      | "create"
      | "update"
      | "delete",
    recordId:
      op.record_id ||
      op.event_id ||
      op.report_id ||
      op.dashboard_id ||
      op.source_dashboard_id,
    recordName: op.record_name || op.summary || "Unknown",
    label: op.label || op.sobject_type || "Record",
    changes: normalizeChanges(op.changes) || [],
  };
}

/**
 * Generic approval detection from tool arguments.
 * The backend now produces uniform operations with `changes`, `record_id`, `label`,
 * so this function is a thin mapping layer rather than tool-specific normalization.
 *
 * @param toolCallId - The tool call ID for API calls
 * @param parsed - Parsed JSON arguments from the tool call
 * @param approvalTypeHint - Optional hint from TOOL_CALL_START (avoids heuristic detection)
 * @returns ApprovalData if this is an approval request, null otherwise
 */
function detectApprovalFromArgs(
  toolCallId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parsed: Record<string, any>,
  approvalTypeHint?: "salesforce" | "calendar" | "generic",
): DetectedApprovalData | null {
  // Pattern 1: Operations array with summary (Salesforce, Calendar, Tooling, Analytics)
  if (parsed.operations && Array.isArray(parsed.operations) && parsed.summary) {
    const ops = parsed.operations;
    const isBulk = ops.length > 1;
    const firstOp = ops[0];

    // Determine approval type: prefer hint from tool name, fallback to label-based heuristic
    const isCalendar =
      approvalTypeHint === "calendar" ||
      (!approvalTypeHint && firstOp?.label === "Calendar Event");

    const baseApprovalType =
      approvalTypeHint === "calendar" || isCalendar
        ? "calendar"
        : approvalTypeHint || "salesforce";

    // Map each operation to the uniform shape
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedOps = ops.map((op: Record<string, any>) =>
      mapUniformOperation(op),
    );
    const firstMapped = mappedOps[0];

    // Build bulkRecords for per-record approval UI
    const bulkRecords = isBulk
      ? mappedOps.map((mapped) => ({
          recordId:
            mapped.recordId || `record-${mapped.recordName || "unknown"}`,
          recordName: mapped.recordName,
          label: mapped.label,
          changes: mapped.changes,
        }))
      : undefined;

    // Build bulk operations array for backward compat with BulkApprovalCard
    const bulkOperations: BulkOperation[] | undefined = isBulk
      ? mappedOps.map((mapped) => ({
          operation: mapped.operation,
          sobject_type: mapped.label,
          record_name: mapped.recordName,
          record_id: mapped.recordId,
          changes: mapped.changes,
        }))
      : undefined;

    return {
      toolCallId,
      summary: parsed.summary,
      label: isBulk
        ? `${ops.length} ${firstMapped?.label || "Record"} records`
        : firstMapped?.label || "Record",
      recordName: isBulk
        ? `${ops.length} records to ${firstMapped?.operation || "update"}`
        : firstMapped?.recordName,
      recordId: !isBulk ? firstMapped?.recordId : undefined,
      operation: firstMapped?.operation || "update",
      changes: isBulk
        ? mappedOps.flatMap((m) => m.changes)
        : firstMapped?.changes || [],
      approvalType: isBulk ? "bulk" : baseApprovalType,
      operations: bulkOperations,
      bulkRecords,
      recordCount: isBulk ? ops.length : undefined,
    };
  }

  // Pattern 2: Deep Research approval (has research_query field)
  if (parsed.summary && parsed.research_query) {
    return {
      toolCallId,
      summary: parsed.summary,
      label: "Deep Research",
      recordName: parsed.research_query,
      operation: "create",
      approvalType: "deep_research",
      researchQuery: parsed.research_query,
      estimatedTime: parsed.estimated_time,
      sampleContent: parsed.sample_content,
      dataSources: parsed.data_sources,
    };
  }

  // Pattern 3: Generic approval with explicit approval_required flag
  if (
    (parsed.approval_required === true ||
      parsed.requires_approval === true ||
      parsed.needs_confirmation === true) &&
    parsed.summary
  ) {
    return {
      toolCallId,
      summary: parsed.summary,
      label: parsed.object_type || parsed.resource_type || "Resource",
      recordName: parsed.record_name || parsed.name || parsed.title,
      operation: parsed.operation || parsed.action || "update",
      changes: parsed.changes || parsed.modifications,
      approvalType: "generic",
    };
  }

  // Pattern 4: Generic approval with action/resource pattern
  if (
    parsed.summary &&
    parsed.action &&
    (parsed.resource || parsed.target || parsed.record)
  ) {
    return {
      toolCallId,
      summary: parsed.summary,
      label: parsed.resource_type || parsed.type || "Resource",
      recordName: parsed.resource || parsed.target || parsed.record,
      operation:
        parsed.action === "create" || parsed.action === "add"
          ? "create"
          : parsed.action === "delete" || parsed.action === "remove"
            ? "delete"
            : "update",
      changes: parsed.changes,
      approvalType: "generic",
    };
  }

  return null;
}

export interface TransformResult {
  steps: TimelineStep[];
  isThinking: boolean;
  /** Final response content (from TEXT_MESSAGE with parent_message_id) */
  finalResponse: string;
  /** Whether the final response is still streaming */
  isFinalResponseStreaming: boolean;
  /** Whether we're waiting for user approval (intermediate state between runs) */
  isAwaitingApproval: boolean;
  /** Research results state for Deep Research workflow */
  researchResults: ResearchResultsState;
  /** Whether a long-running deep research is in progress (user can leave) */
  isDeepResearchRunning: boolean;
  /** Whether the response was stopped by the user */
  stoppedByUser: boolean;
  /** Whether the run went through an approval pause (intermediate RUN_FINISHED) */
  hadApprovalPause: boolean;
  /** Error message if the run failed (from RUN_FINISHED with status=failed or RUN_ERROR) */
  runErrorMessage: string;
  /** Whether an approval request has expired */
  isExpiredApproval: boolean;
}

/**
 * Transform AGUI events into TimelineStep[] format
 *
 *
 * @param events - Array of AGUI event wrappers from Pusher
 * @returns Object with steps array and isThinking status
 */
export function transformAguiToTimelineSteps(
  events: AguiEventWrapper[] | null | undefined,
): TransformResult {
  if (!events || events.length === 0) {
    return {
      steps: [],
      isThinking: false,
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
      isDeepResearchRunning: false,
      stoppedByUser: false,
      hadApprovalPause: false,
      runErrorMessage: "",
      isExpiredApproval: false,
    };
  }

  // Sort events by sequence
  const sortedEvents = [...events].sort((a, b) => a.sequence - b.sequence);

  const steps: TimelineStep[] = [];
  // Map step_number to step for STEP_STARTED/STEP_FINISHED correlation
  const stepNumberMap = new Map<number, TimelineStep>();
  // Map step_name to step for correlation when step_number is undefined
  const stepNameMap = new Map<string, TimelineStep>();
  // Map tool_call_id to step_number for tool event -> step correlation
  const toolCallToStepMap = new Map<string, number>();
  // Map tool_call_id directly to step (for cases where step_number is undefined)
  const toolCallToStepDirectMap = new Map<string, TimelineStep>();
  // Map message_id to step for TEXT_MESSAGE events (reasoning only, not final response)
  const textMessageStepMap = new Map<string, TimelineStep>();
  // Track denied tool call IDs to ensure they stay marked as error
  const deniedToolCallIds = new Set<string>();
  // Accumulate tool arguments
  const toolArgsMap = new Map<string, string>();
  // Accumulate tool results (for chunked TOOL_CALL_RESULT events)
  const toolCallResultMap = new Map<string, string>();
  // Track the current active step (from STEP_STARTED, for tool calls only)
  let currentStep: TimelineStep | null = null;
  let currentStepNumber: number | null = null;
  let currentStepName: string | null = null;
  // Track current text message step (separate from tool steps)
  let currentTextStep: TimelineStep | null = null;
  let isThinking = true;
  // Counter for creating unique step IDs when step_number is undefined
  let stepCounter = 0;
  // Counter for creating unique reasoning step IDs when interleaved with tool calls
  let reasoningStepCounter = 0;

  // Final response tracking
  let finalResponse = "";
  let isFinalResponseStreaming = false;
  // Track the last TEXT_MESSAGE message_id (will become final response at RUN_FINISHED if is_final_response wasn't used)
  let lastTextMessageId: string | null = null;
  // Track message_id of the explicit final response (when is_final_response flag is present)
  let explicitFinalResponseMessageId: string | null = null;

  // Research results tracking
  let researchResultsIsStreaming = false;
  let researchResultsIsCompleted = false;
  let researchResultsContent = "";
  let researchResultsMetadata: ResearchResultsMetadata | null = null;
  let researchResultsMessageId: string | null = null;
  let isDeepResearchRunning = false;

  // Track if the response was stopped by the user
  let stoppedByUser = false;

  // Track error message from failed RUN_FINISHED or RUN_ERROR
  let runErrorMessage = "";

  // Track if we've seen RUN_FINISHED with pending approval (run paused for approval)
  let sawRunFinishedWithPendingApproval = false;

  for (const wrapper of sortedEvents) {
    const event = wrapper.event;

    // If run was paused for approval and we see new processing events, the run has resumed
    if (sawRunFinishedWithPendingApproval) {
      const isProcessingEvent =
        event.type === "STEP_STARTED" ||
        event.type === "TEXT_MESSAGE_START" ||
        event.type === "TOOL_CALL_START";

      if (isProcessingEvent) {
        // Run resumed after approval - mark approval steps as complete
        isThinking = true;
        sawRunFinishedWithPendingApproval = false;

        for (const step of steps) {
          if (step.status === "awaiting-approval") {
            step.status = "complete" as StepStatus;
          }
        }
      }
    }

    switch (event.type) {
      case "RUN_STARTED": {
        // Initialize - no step created yet
        break;
      }

      case "STEP_STARTED": {
        // Create a new step when STEP_STARTED arrives (for tool calls)
        const stepEvent = event as StepStartedEventWithNumber;

        // Generate unique step ID - use step_number + global counter to ensure uniqueness across runs
        // (step_number restarts from 1 in each run, so we need the counter for uniqueness)
        const hasStepNumber =
          stepEvent.step_number !== undefined && stepEvent.step_number !== null;
        stepCounter++;
        const stepId = hasStepNumber
          ? `step-${stepEvent.step_number}-${stepCounter}`
          : `step-name-${stepEvent.step_name || stepCounter}`;

        const step: TimelineStep = {
          id: stepId,
          text: stepEvent.step_name,
          status: "in-progress" as StepStatus,
          type: "reasoning" as StepType,
          category: stepEvent.metadata?.category as EventCategory,
          description: "",
        };

        // Store in appropriate map for later correlation
        if (hasStepNumber) {
          stepNumberMap.set(stepEvent.step_number, step);
        }
        if (stepEvent.step_name) {
          stepNameMap.set(stepEvent.step_name, step);
        }
        steps.push(step);

        // Track as current step for subsequent tool events
        currentStep = step;
        currentStepNumber = hasStepNumber ? stepEvent.step_number : null;
        currentStepName = stepEvent.step_name || null;

        // Mark current reasoning step as complete and clear it
        // This ensures any subsequent TEXT_MESSAGE_CONTENT creates a new reasoning step
        if (currentTextStep) {
          currentTextStep.status = "complete" as StepStatus;
          currentTextStep = null;
        }
        break;
      }

      case "STEP_FINISHED": {
        // Mark the step as complete when STEP_FINISHED arrives
        const finishedEvent = event as StepFinishedEventWithNumber;

        // Look up step by step_number first, then by step_name
        const hasStepNumber =
          finishedEvent.step_number !== undefined &&
          finishedEvent.step_number !== null;
        let step = hasStepNumber
          ? stepNumberMap.get(finishedEvent.step_number)
          : undefined;
        if (!step && finishedEvent.step_name) {
          step = stepNameMap.get(finishedEvent.step_name);
        }

        if (step) {
          // Only mark complete if the step hasn't already reached a
          // terminal/resolved status. STEP_FINISHED can arrive after a
          // TOOL_CALL_RESULT that set error, rejected, or expired — those
          // must not be overwritten to "complete".
          const preserveStatus =
            step.status === "awaiting-approval" ||
            step.status === "expired" ||
            step.status === "error" ||
            step.status === "rejected";
          if (!preserveStatus) {
            step.status = "complete" as StepStatus;
          }
        }

        // Clear current step if it matches
        const matchesByNumber =
          hasStepNumber && currentStepNumber === finishedEvent.step_number;
        const matchesByName =
          finishedEvent.step_name &&
          currentStepName === finishedEvent.step_name;
        if (matchesByNumber || matchesByName) {
          currentStep = null;
          currentStepNumber = null;
          currentStepName = null;
        }
        break;
      }

      case "TEXT_MESSAGE_START": {
        // Check if this is explicitly marked as the final response
        if (event.is_final_response) {
          // Stream directly to finalResponse instead of creating a reasoning step
          explicitFinalResponseMessageId = event.message_id;
          isFinalResponseStreaming = true;
          finalResponse = "";
          break;
        }

        // All TEXT_MESSAGE content streams into reasoning steps during streaming
        // The last one will be extracted as final response at RUN_FINISHED (fallback)
        lastTextMessageId = event.message_id;

        reasoningStepCounter++;
        const stepId = `reasoning-${event.message_id}-${reasoningStepCounter}`;

        const textStep: TimelineStep = {
          id: stepId,
          text: "",
          status: "in-progress" as StepStatus,
          type: "reasoning" as StepType,
          description: "",
        };

        textMessageStepMap.set(event.message_id, textStep);
        steps.push(textStep);
        currentTextStep = textStep;
        break;
      }

      case "TEXT_MESSAGE_CONTENT": {
        // Check if this is content for the explicit final response
        if (
          event.is_final_response ||
          (explicitFinalResponseMessageId &&
            event.message_id === explicitFinalResponseMessageId)
        ) {
          // Stream directly to finalResponse
          finalResponse += event.delta || "";
          break;
        }

        // All TEXT_MESSAGE_CONTENT streams into reasoning steps
        // If no current reasoning step exists, create a new one
        if (!currentTextStep) {
          reasoningStepCounter++;
          const newStep: TimelineStep = {
            id: `reasoning-${event.message_id}-${reasoningStepCounter}`,
            text: "",
            status: "in-progress" as StepStatus,
            type: "reasoning" as StepType,
            description: "",
          };
          steps.push(newStep);
          currentTextStep = newStep;
          textMessageStepMap.set(event.message_id, newStep);
        }

        // Accumulate content in the current reasoning step's description
        currentTextStep.text =
          (currentTextStep.text || "") + (event.delta || "");

        // Update the display text based on content (first sentence as summary)

        break;
      }

      case "TEXT_MESSAGE_END": {
        // Check if this is the end of the explicit final response
        if (
          event.is_final_response ||
          (explicitFinalResponseMessageId &&
            event.message_id === explicitFinalResponseMessageId)
        ) {
          // Final response streaming is complete
          isFinalResponseStreaming = false;
          break;
        }

        // Mark reasoning step as completed
        if (currentTextStep) {
          currentTextStep.status = "complete" as StepStatus;
          currentTextStep = null;
        }
        break;
      }

      case "TOOL_CALL_START": {
        const toolName = event.tool_call_name || "unknown";
        const toolId = event.tool_call_id;
        // Use step_number from event for proper correlation in interleaved scenarios
        const eventStepNumber = (event as { step_number?: number }).step_number;

        // Find the step to associate this tool call with
        // Priority: 1) step_number from event, 2) currentStep, 3) create new step
        let step: TimelineStep | undefined;
        let stepNum: number;

        if (eventStepNumber !== undefined) {
          // Use step_number from event for proper correlation
          step = stepNumberMap.get(eventStepNumber);
          stepNum = eventStepNumber;
        }

        if (!step && currentStep && currentStepNumber !== null) {
          // Fall back to current step from STEP_STARTED
          step = currentStep;
          stepNum = currentStepNumber;
        }

        if (!step) {
          // Check if we already have a step for this tool_call_id (deduplication)
          if (toolId) {
            step = toolCallToStepDirectMap.get(toolId);
          }

          if (!step) {
            // No STEP_STARTED and no existing step - create a new step for this tool call
            // Use a unique step number based on tool_call_id hash
            stepNum = steps.length + 1000; // Offset to avoid conflicts
            const stepId = `tool-${toolId || stepNum}`;

            step = {
              id: stepId,
              text: "",
              status: "in-progress" as StepStatus,
              type: "tool_call" as StepType,
              source: getToolSource(toolName),
              description: "",
            };

            stepNumberMap.set(stepNum, step);
            steps.push(step);
          }

          // Mark current reasoning step as complete
          if (currentTextStep) {
            currentTextStep.status = "complete" as StepStatus;
            currentTextStep = null;
          }
        }

        // Transform step to tool_call type
        step.source = getToolSource(toolName);

        // Early approval detection by tool name (like V1's isApprovalTool)
        // This allows the UI to show the approval state immediately
        // Skip if this step was already resolved (e.g., rejected) — the backend
        // may re-send TOOL_CALL_START for the same tool_call_id after rejection
        // with overlapping sequence numbers, so we must not overwrite the result.
        if (isAnyApprovalTool(toolName)) {
          const alreadyResolved =
            step.status === ("rejected" as StepStatus) ||
            step.status === ("error" as StepStatus) ||
            step.status === "expired" ||
            (step.status === ("complete" as StepStatus) &&
              step.type === ("approval" as StepType));
          if (!alreadyResolved) {
            step.type = "approval" as StepType;
            step.status = "awaiting-approval" as StepStatus;
            // Initialize approval data with tool call info (will be populated with args later)
            const approvalType = getApprovalType(toolName);
            step.approval = {
              toolCallId: toolId || "",
              summary: "Requesting approval...",
              label:
                approvalType === "calendar"
                  ? "Calendar Event"
                  : "Salesforce Record",
              operation: "update",
              approvalType,
            };
          }
        } else {
          step.type = "tool_call" as StepType;
        }

        // Map tool_call_id for subsequent tool events
        if (toolId) {
          toolCallToStepMap.set(toolId, stepNum!);
          // Also store direct reference to step (for when step_number is undefined)
          toolCallToStepDirectMap.set(toolId, step);
          toolArgsMap.set(toolId, "");
        }
        break;
      }

      case "TOOL_CALL_ARGS": {
        // Accumulate tool arguments and update step
        const toolId = event.tool_call_id;
        // Use step_number from event for proper correlation in interleaved scenarios
        const eventStepNumber = (event as { step_number?: number }).step_number;

        if (toolId) {
          const currentArgs = toolArgsMap.get(toolId) || "";
          toolArgsMap.set(toolId, currentArgs + (event.delta || ""));

          // Find the step for this tool call
          // Priority: 1) direct map, 2) step_number from event, 3) toolCallToStepMap lookup
          let step = toolCallToStepDirectMap.get(toolId);
          if (!step) {
            let stepNumber = eventStepNumber;
            if (stepNumber === undefined) {
              stepNumber = toolCallToStepMap.get(toolId);
            }
            step =
              stepNumber !== undefined
                ? stepNumberMap.get(stepNumber)
                : undefined;
          }

          if (step) {
            const accumulatedArgs = toolArgsMap.get(toolId) || "";
            try {
              const parsed = JSON.parse(accumulatedArgs);
              if (parsed.query) {
                step.code = parsed.query;
              }
            } catch (e) {
              // Args not complete JSON yet — expected during streaming
              if (import.meta.env.DEV && !(e instanceof SyntaxError)) {
                console.error(
                  "[transformAguiToTimelineSteps] Unexpected error parsing tool args:",
                  e,
                );
              }
            }
          }
        }
        break;
      }

      case "TOOL_CALL_END": {
        // Tool call submitted, waiting for result
        // At this point, we have the complete arguments and can populate approval data
        const toolId = event.tool_call_id;
        // Use step_number from event for proper correlation in interleaved scenarios
        const eventStepNumber = (event as { step_number?: number }).step_number;

        if (toolId) {
          // Priority: 1) direct map, 2) step_number from event, 3) toolCallToStepMap lookup
          let step = toolCallToStepDirectMap.get(toolId);
          if (!step) {
            let stepNumber = eventStepNumber;
            if (stepNumber === undefined) {
              stepNumber = toolCallToStepMap.get(toolId);
            }
            step =
              stepNumber !== undefined
                ? stepNumberMap.get(stepNumber)
                : undefined;
          }

          if (step) {
            const argsJson = toolArgsMap.get(toolId) || "{}";
            try {
              const parsed = JSON.parse(argsJson);
              if (parsed.query) {
                step.code = parsed.query;
              }

              // If step was already marked as approval (detected at TOOL_CALL_START by tool name),
              // update the approval data with the actual arguments
              if (step.type === "approval" && step.approval) {
                const approvalTypeHint = step.approval.approvalType as
                  | "salesforce"
                  | "calendar"
                  | "generic"
                  | undefined;
                const approvalData = detectApprovalFromArgs(
                  toolId,
                  parsed,
                  approvalTypeHint,
                );
                if (approvalData) {
                  // Update with parsed data from arguments
                  step.approval = approvalData;
                }
              } else {
                // Fallback: detect generic approvals by argument patterns
                // (for tools that aren't explicitly named as approval tools)
                const approvalData = detectApprovalFromArgs(toolId, parsed);
                if (approvalData) {
                  step.type = "approval" as StepType;
                  step.status = "awaiting-approval" as StepStatus;
                  step.approval = approvalData;
                }
              }
            } catch (e) {
              if (import.meta.env.DEV) {
                console.warn(
                  "[transformAguiToTimelineSteps] Failed to parse tool args:",
                  e,
                );
              }
            }
          }
        }
        break;
      }

      case "TOOL_CALL_RESULT": {
        // Tool execution complete
        const toolId = event.tool_call_id;
        // Use step_number from event for proper correlation in interleaved scenarios
        const eventStepNumber = (event as { step_number?: number }).step_number;

        if (toolId) {
          // Handle both delta (chunked) and content (non-chunked) fields
          if (event.delta) {
            // Chunked result - accumulate deltas
            const currentResult = toolCallResultMap.get(toolId) || "";
            toolCallResultMap.set(toolId, currentResult + event.delta);

            // Try to parse accumulated result (may be incomplete)
            const accumulated = toolCallResultMap.get(toolId) || "";

            // Find the step for this tool call
            let step = toolCallToStepDirectMap.get(toolId);
            if (!step) {
              let stepNumber = eventStepNumber;
              if (stepNumber === undefined) {
                stepNumber = toolCallToStepMap.get(toolId);
              }
              step =
                stepNumber !== undefined
                  ? stepNumberMap.get(stepNumber)
                  : undefined;
            }

            if (step) {
              try {
                const result = JSON.parse(accumulated);

                // Parse and update step (same logic as content handling)
                if (step.status === "awaiting-approval") {
                  // Handle approval results
                  if (result.approved === true) {
                    step.status = "complete" as StepStatus;
                    toolCallResultMap.delete(toolId);
                  } else if (result.status === "expired") {
                    Object.assign(step, getExpiredApprovalFields(result));
                    toolCallResultMap.delete(toolId);
                  } else if (result.approved === false) {
                    // User rejected - use 'rejected' status and store reason
                    step.status = "rejected" as StepStatus;
                    step.rejectionReason =
                      result.message || "Operation rejected by user";
                    toolCallResultMap.delete(toolId);
                  } else if (result.success === false || result.error) {
                    // System error - use 'error' status and store error message
                    step.status = "error" as StepStatus;
                    step.errorMessage =
                      result.error || result.message || "Operation failed";
                    toolCallResultMap.delete(toolId);
                  } else {
                    step.status = "complete" as StepStatus;
                    toolCallResultMap.delete(toolId);
                  }
                } else {
                  // Handle non-approval tool results
                  if (result._artifact) {
                    if (result._artifact.success) {
                      step.status = "complete" as StepStatus;
                      step.artifact = {
                        artifact_id: result._artifact.artifact_id,
                        run_id: result._artifact.run_id,
                        tool_name: result._artifact.tool_name,
                        artifact_type: result._artifact.artifact_type,
                      };
                      toolCallResultMap.delete(toolId);
                    } else {
                      // Remove failed step from steps array
                      const stepIndex = steps.indexOf(step);
                      if (stepIndex !== -1) {
                        removeTrailingColonFromPreviousStep(steps, stepIndex);
                        steps.splice(stepIndex, 1);
                      }
                      toolCallResultMap.delete(toolId);
                    }
                  } else if (result.success === false) {
                    // Remove failed step from steps array
                    const stepIndex = steps.indexOf(step);
                    if (stepIndex !== -1) {
                      removeTrailingColonFromPreviousStep(steps, stepIndex);
                      steps.splice(stepIndex, 1);
                    }
                    toolCallResultMap.delete(toolId);
                  } else {
                    step.status = "complete" as StepStatus;
                    toolCallResultMap.delete(toolId);
                  }
                }
              } catch (e) {
                // JSON incomplete, continue accumulating
                // Don't update step status yet - wait for more chunks
                if (import.meta.env.DEV && !(e instanceof SyntaxError)) {
                  console.warn(
                    "[transformAguiToTimelineSteps] Unexpected error parsing chunked tool result:",
                    e,
                  );
                }
              }
            }
          } else if (event.content) {
            // Non-chunked result (backward compatibility)
            const contentStr = event.content.trim();
            const isDenied =
              contentStr.includes("tool call was denied") ||
              contentStr.includes("Tool call was denied");
            if (isDenied) {
              deniedToolCallIds.add(toolId);
            }

            // Find the step for this tool call
            let step = toolCallToStepDirectMap.get(toolId);
            if (!step) {
              let stepNumber = eventStepNumber;
              if (stepNumber === undefined) {
                stepNumber = toolCallToStepMap.get(toolId);
              }
              step =
                stepNumber !== undefined
                  ? stepNumberMap.get(stepNumber)
                  : undefined;
            }

            if (step) {
              // Check for denied approval tool call first
              if (isDenied) {
                step.status = "error" as StepStatus;
                break;
              }

              // Handle approval tool results that were accepted
              if (step.status === "awaiting-approval") {
                try {
                  const result = JSON.parse(event.content);

                  // Trust backend's explicit approval status
                  if (result.approved === true) {
                    step.status = "complete" as StepStatus;
                  } else if (result.status === "expired") {
                    Object.assign(step, getExpiredApprovalFields(result));
                  } else if (result.approved === false) {
                    // User rejected - use 'rejected' status and store reason
                    step.status = "rejected" as StepStatus;
                    step.rejectionReason =
                      result.message || "Operation rejected by user";
                  } else if (result.success === false || result.error) {
                    // Fallback for execution errors (not approval decisions)
                    step.status = "error" as StepStatus;
                    step.errorMessage =
                      result.error || result.message || "Operation failed";
                  } else {
                    // Default to complete for backwards compatibility
                    step.status = "complete" as StepStatus;
                  }
                } catch (e) {
                  if (import.meta.env.DEV) {
                    console.warn(
                      "[transformAguiToTimelineSteps] Failed to parse non-chunked approval result:",
                      e,
                    );
                  }
                  step.status = "complete" as StepStatus;
                }
                break;
              }

              // Handle non-approval tool results
              try {
                const result = JSON.parse(event.content);

                // Check for artifact (success case)
                if (result._artifact) {
                  if (result._artifact.success) {
                    step.status = "complete" as StepStatus;
                    // Store artifact metadata for clickable links
                    // Display name is derived in the component from tool_name
                    step.artifact = {
                      artifact_id: result._artifact.artifact_id,
                      run_id: result._artifact.run_id,
                      tool_name: result._artifact.tool_name,
                      artifact_type: result._artifact.artifact_type,
                    };
                  } else {
                    // Remove failed step from steps array
                    const stepIndex = steps.indexOf(step);
                    if (stepIndex !== -1) {
                      removeTrailingColonFromPreviousStep(steps, stepIndex);
                      steps.splice(stepIndex, 1);
                    }
                  }
                } else if (result.success === false) {
                  // Remove failed step from steps array
                  const stepIndex = steps.indexOf(step);
                  if (stepIndex !== -1) {
                    removeTrailingColonFromPreviousStep(steps, stepIndex);
                    steps.splice(stepIndex, 1);
                  }
                } else {
                  step.status = "complete" as StepStatus;
                }
              } catch (e) {
                if (import.meta.env.DEV) {
                  console.warn(
                    "[transformAguiToTimelineSteps] Failed to parse non-chunked tool result:",
                    e,
                  );
                }
                step.status = "complete" as StepStatus;
              }
            }
          }
        }
        break;
      }

      case "RESEARCH_RESULTS_START": {
        // Research results streaming started
        researchResultsIsStreaming = true;
        researchResultsIsCompleted = false;
        researchResultsContent = "";
        researchResultsMessageId = event.message_id;
        researchResultsMetadata = event.metadata || null;
        isDeepResearchRunning = true;
        break;
      }

      case "RESEARCH_RESULTS_CONTENT": {
        // Accumulate research results content
        // Use snapshot if available (full content), otherwise append delta
        if (event.snapshot) {
          researchResultsContent = event.snapshot;
        } else if (event.delta) {
          researchResultsContent += event.delta;
        }
        break;
      }

      case "RESEARCH_RESULTS_END": {
        // Research results streaming completed
        researchResultsIsStreaming = false;
        researchResultsIsCompleted = true;
        isDeepResearchRunning = false;
        break;
      }

      case "RUN_FINISHED":
      case "RUN_ERROR": {
        // Detect if this RUN_FINISHED is actually a failure
        const isFailedRun =
          event.type === "RUN_FINISHED" && event.result?.status === "failed";

        // Check if there's a pending approval step
        // If so, this is an intermediate RUN_FINISHED (run paused for approval)
        // Don't finalize - wait for the next RUN_FINISHED after approval
        // But never treat a failed RUN_FINISHED as intermediate
        const hasPendingApproval = steps.some(
          (s) => s.status === "awaiting-approval",
        );

        if (
          hasPendingApproval &&
          event.type === "RUN_FINISHED" &&
          !isFailedRun
        ) {
          // Intermediate RUN_FINISHED - run paused for approval
          // Keep isThinking = true so the UI continues showing the loading state,
          // timer keeps ticking, and message actions don't appear prematurely.
          // The isAwaitingApproval flag (derived from step status) handles
          // approval-specific UI like the bell icon.
          sawRunFinishedWithPendingApproval = true;

          // Mark any in-progress steps (except approval steps) as complete
          for (const step of steps) {
            if (
              step.status === "in-progress" ||
              step.status === ("pending" as StepStatus)
            ) {
              step.status = "complete" as StepStatus;
            }
          }
          // Don't extract final response yet - it will come with the next RUN_FINISHED
          break;
        }

        // No pending approval - this is the final RUN_FINISHED
        // Mark all steps as complete and stop processing
        isThinking = false;
        isFinalResponseStreaming = false;

        // Extract stopped_by_user flag
        if (event.type === "RUN_FINISHED" && event.result?.stopped_by_user) {
          stoppedByUser = true;
        }

        // Extract error message from failed RUN_FINISHED
        if (
          event.type === "RUN_FINISHED" &&
          event.result?.status === "failed"
        ) {
          runErrorMessage =
            (event.result as { error_message?: string }).error_message ||
            "Agent run failed";
        }

        // Extract error message from RUN_ERROR
        if (event.type === "RUN_ERROR") {
          runErrorMessage = event.error || event.message || "An error occurred";
        }

        // Fallback: Extract the last TEXT_MESSAGE step as the final response
        // Only do this if we don't already have a finalResponse from explicit is_final_response flow
        if (!finalResponse && lastTextMessageId) {
          const lastTextStep = textMessageStepMap.get(lastTextMessageId);
          if (lastTextStep) {
            // Extract content as final response
            // Content may be in step.text (new behavior) or step.description (legacy)
            finalResponse = lastTextStep.text || lastTextStep.description || "";
            // Remove this step from the steps array
            const stepIndex = steps.indexOf(lastTextStep);
            if (stepIndex !== -1) {
              steps.splice(stepIndex, 1);
            }
          }
        }

        // Mark any in-progress steps as complete (or error for RUN_ERROR / failed RUN_FINISHED)
        const finalStatus =
          event.type === "RUN_ERROR" || isFailedRun
            ? ("error" as StepStatus)
            : ("complete" as StepStatus);

        for (const step of steps) {
          if (
            step.status === "in-progress" ||
            step.status === ("pending" as StepStatus)
          ) {
            step.status = finalStatus;
          }
        }

        currentStep = null;
        currentStepNumber = null;
        currentTextStep = null;
        break;
      }
    }
  }

  // Check if there's a pending approval step (for UI to show appropriate state)
  const isAwaitingApproval = steps.some(
    (s) => s.status === "awaiting-approval",
  );

  // Final pass: Ensure all denied tool calls are marked as error
  // This handles cases where the status was overwritten by other event processing
  if (deniedToolCallIds.size > 0) {
    for (const deniedToolId of deniedToolCallIds) {
      const step = toolCallToStepDirectMap.get(deniedToolId);
      if (step && step.status !== "error") {
        step.status = "error" as StepStatus;
      }
    }
  }

  // Finalize any pending tool call results that were being accumulated
  // This handles cases where chunked results didn't complete during streaming
  if (toolCallResultMap.size > 0) {
    for (const [toolId, accumulatedResult] of toolCallResultMap) {
      const step = toolCallToStepDirectMap.get(toolId);
      if (step && accumulatedResult) {
        try {
          const result = JSON.parse(accumulatedResult);

          // Handle approval results
          if (step.status === "awaiting-approval") {
            if (result.success === false && result.retry === true) {
              // Validation error — agent sent bad args, will retry.
              // Clean up map entries so future results don't attach to the removed step.
              toolCallToStepMap.delete(toolId);
              toolCallToStepDirectMap.delete(toolId);
              const stepIndex = steps.indexOf(step);
              if (stepIndex !== -1) {
                removeTrailingColonFromPreviousStep(steps, stepIndex);
                steps.splice(stepIndex, 1);
              }
            } else if (result.approved === true) {
              step.status = "complete" as StepStatus;
            } else if (result.status === "expired") {
              Object.assign(step, getExpiredApprovalFields(result));
            } else if (result.approved === false) {
              // User rejected - use 'rejected' status and store reason
              step.status = "rejected" as StepStatus;
              step.rejectionReason =
                result.message || "Operation rejected by user";
            } else if (result.success === false || result.error) {
              // System error - use 'error' status and store error message
              step.status = "error" as StepStatus;
              step.errorMessage =
                result.error || result.message || "Operation failed";
            } else {
              step.status = "complete" as StepStatus;
            }
          } else {
            // Handle non-approval tool results
            if (result._artifact) {
              if (result._artifact.success) {
                step.status = "complete" as StepStatus;
                step.artifact = {
                  artifact_id: result._artifact.artifact_id,
                  run_id: result._artifact.run_id,
                  tool_name: result._artifact.tool_name,
                  artifact_type: result._artifact.artifact_type,
                };
              } else {
                // Remove failed step from steps array
                const stepIndex = steps.indexOf(step);
                if (stepIndex !== -1) {
                  removeTrailingColonFromPreviousStep(steps, stepIndex);
                  steps.splice(stepIndex, 1);
                }
              }
            } else if (result.success === false) {
              // Remove failed step from steps array
              const stepIndex = steps.indexOf(step);
              if (stepIndex !== -1) {
                removeTrailingColonFromPreviousStep(steps, stepIndex);
                steps.splice(stepIndex, 1);
              }
            } else {
              step.status = "complete" as StepStatus;
            }
          }
        } catch {
          // Failed to parse accumulated result
          console.warn(
            "[transformAguiToTimelineSteps] Failed to parse accumulated result for tool:",
            toolId,
          );
          // Mark as complete anyway to avoid stuck UI
          step.status = "complete" as StepStatus;
        }
      }
    }
    toolCallResultMap.clear();
  }

  return {
    steps,
    isThinking,
    finalResponse,
    isFinalResponseStreaming,
    isAwaitingApproval,
    researchResults: {
      isStreaming: researchResultsIsStreaming,
      isCompleted: researchResultsIsCompleted,
      content: researchResultsContent,
      metadata: researchResultsMetadata,
      messageId: researchResultsMessageId,
    },
    isDeepResearchRunning,
    stoppedByUser,
    hadApprovalPause: sawRunFinishedWithPendingApproval,
    runErrorMessage,
    isExpiredApproval: steps.some((s) => s.status === "expired"),
  };
}

/**
 * Get elapsed time in seconds from events
 */
export function getElapsedTimeFromEvents(
  events: AguiEventWrapper[] | null | undefined,
): number {
  if (!events || events.length === 0) return 0;

  const sortedEvents = [...events].sort((a, b) => a.sequence - b.sequence);
  const firstEvent = sortedEvents[0];
  const lastEvent = sortedEvents[sortedEvents.length - 1];

  try {
    const startTime = new Date(firstEvent.timestamp).getTime();
    const endTime = new Date(lastEvent.timestamp).getTime();
    return Math.floor((endTime - startTime) / 1000);
  } catch {
    return 0;
  }
}
