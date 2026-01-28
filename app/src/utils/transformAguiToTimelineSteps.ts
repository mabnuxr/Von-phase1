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
} from "@vonlabs/design-components";
import {
  isApprovalTool,
  isGoogleCalendarApprovalTool,
} from "@vonlabs/design-components";

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
): "salesforce" | "calendar" | "deep_research" | "generic" {
  if (isApprovalTool(toolName)) return "salesforce";
  if (isGoogleCalendarApprovalTool(toolName)) return "calendar";
  return "generic";
}

/**
 * Maps tool names to source types for the timeline visualization
 */
const TOOL_SOURCE_MAP: Record<string, SourceType> = {
  // Salesforce tools
  execute_sql_query: "salesforce",
  request_salesforce_approval: "salesforce",

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
 * Approval data structure returned by detection
 */
interface DetectedApprovalData {
  toolCallId: string;
  summary: string;
  objectType: string;
  recordName?: string;
  operation: "create" | "update" | "delete";
  changes?: Array<{
    field: string;
    before?: string | number | boolean | null;
    after: string | number | boolean | null;
  }>;
  approvalType:
    | "salesforce"
    | "calendar"
    | "bulk"
    | "deep_research"
    | "generic";
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
 * Generic approval detection from tool arguments
 * Supports: Salesforce, Google Calendar, Bulk operations, and generic approvals
 *
 * @param toolCallId - The tool call ID for API calls
 * @param parsed - Parsed JSON arguments from the tool call
 * @returns ApprovalData if this is an approval request, null otherwise
 */
function detectApprovalFromArgs(
  toolCallId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parsed: Record<string, any>,
): DetectedApprovalData | null {
  // Pattern 1: Operations array with summary (Salesforce or Google Calendar)
  if (parsed.operations && Array.isArray(parsed.operations) && parsed.summary) {
    const ops = parsed.operations;
    const isBulk = ops.length > 1;
    const firstOp = ops[0];

    // Detect if this is Google Calendar (has start_datetime or calendar_id)
    const isCalendar =
      firstOp?.start_datetime ||
      firstOp?.calendar_id ||
      firstOp?.attendees_emails;

    if (isCalendar) {
      // Google Calendar operations
      return {
        toolCallId,
        summary: parsed.summary,
        objectType: isBulk ? `${ops.length} Calendar Events` : "Calendar Event",
        recordName: isBulk
          ? `${ops.length} events to ${firstOp?.operation || "create"}`
          : firstOp?.summary || firstOp?.event_summary,
        operation: firstOp?.operation || "create",
        changes: isBulk
          ? ops.flatMap(
              (op: { changes?: DetectedApprovalData["changes"] }) =>
                op.changes || [],
            )
          : firstOp?.changes,
        approvalType: isBulk ? "bulk" : "calendar",
      };
    }

    // Salesforce operations (has sobject_type or record_name)
    return {
      toolCallId,
      summary: parsed.summary,
      objectType: isBulk
        ? `${ops.length} Salesforce Records`
        : firstOp?.sobject_type || "Salesforce Record",
      recordName: isBulk
        ? `${ops.length} records to ${firstOp?.operation || "update"}`
        : firstOp?.record_name,
      operation: firstOp?.operation || "update",
      changes: isBulk
        ? ops.flatMap(
            (op: { changes?: DetectedApprovalData["changes"] }) =>
              op.changes || [],
          )
        : firstOp?.changes,
      approvalType: isBulk ? "bulk" : "salesforce",
    };
  }

  // Pattern 2: Google Calendar approval (direct fields without operations array)
  if (
    parsed.summary &&
    (parsed.event_summary ||
      parsed.start_datetime ||
      parsed.end_datetime ||
      parsed.calendar_id ||
      parsed.attendees)
  ) {
    return {
      toolCallId,
      summary: parsed.summary,
      objectType: "Calendar Event",
      recordName: parsed.event_summary || parsed.title || parsed.summary,
      operation: parsed.operation || "create",
      changes: parsed.changes,
      approvalType: "calendar",
    };
  }

  // Pattern 3: Deep Research approval (has research_query field)
  if (parsed.summary && parsed.research_query) {
    return {
      toolCallId,
      summary: parsed.summary,
      objectType: "Deep Research",
      recordName: parsed.research_query,
      operation: "create", // Research is always a "create" operation conceptually
      approvalType: "deep_research",
      researchQuery: parsed.research_query,
      estimatedTime: parsed.estimated_time,
      sampleContent: parsed.sample_content,
      dataSources: parsed.data_sources,
    };
  }

  // Pattern 5: Generic approval with explicit approval_required or requires_approval flag
  if (
    (parsed.approval_required === true ||
      parsed.requires_approval === true ||
      parsed.needs_confirmation === true) &&
    parsed.summary
  ) {
    return {
      toolCallId,
      summary: parsed.summary,
      objectType: parsed.object_type || parsed.resource_type || "Resource",
      recordName: parsed.record_name || parsed.name || parsed.title,
      operation: parsed.operation || parsed.action || "update",
      changes: parsed.changes || parsed.modifications,
      approvalType: "generic",
    };
  }

  // Pattern 6: Generic approval with action/resource pattern
  if (
    parsed.summary &&
    parsed.action &&
    (parsed.resource || parsed.target || parsed.record)
  ) {
    return {
      toolCallId,
      summary: parsed.summary,
      objectType: parsed.resource_type || parsed.type || "Resource",
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

/**
 * Get a human-readable description for a tool call
 */
function getToolDescription(toolName: string, args?: string): string {
  const baseDescriptions: Record<string, string> = {
    execute_sql_query: "Querying data from Salesforce",
    request_salesforce_approval: "Requesting approval for Salesforce changes",
    search_gong_calls: "Searching through Gong call recordings",
    get_gong_call_transcript: "Retrieving call transcript",
    search_emails: "Searching through emails",
    get_email_content: "Retrieving email content",
    get_calendar_events: "Checking calendar events",
    request_google_calendar_approval:
      "Requesting approval for calendar changes",
  };

  let description = baseDescriptions[toolName] || `Executing ${toolName}`;

  // Add query preview for SQL queries
  if (toolName === "execute_sql_query" && args) {
    try {
      const parsed = JSON.parse(args);
      if (parsed.dataset_name) {
        description = `Querying: ${parsed.dataset_name}`;
      }
    } catch {
      // Ignore parse errors
    }
  }

  return description;
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
    };
  }

  console.log("events", events);

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
  // Accumulate tool arguments
  const toolArgsMap = new Map<string, string>();
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

  for (const wrapper of sortedEvents) {
    const event = wrapper.event;

    switch (event.type) {
      case "RUN_STARTED": {
        // Initialize - no step created yet
        break;
      }

      case "STEP_STARTED": {
        // Create a new step when STEP_STARTED arrives (for tool calls)
        const stepEvent = event as StepStartedEventWithNumber;

        // Generate unique step ID - use step_number if available, otherwise use step_name or counter
        const hasStepNumber =
          stepEvent.step_number !== undefined && stepEvent.step_number !== null;
        const stepId = hasStepNumber
          ? `step-${stepEvent.step_number}`
          : `step-name-${stepEvent.step_name || stepCounter++}`;

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
          // Only mark complete if not awaiting approval
          if (step.status !== "awaiting-approval") {
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
          text: "Analyzing your request",
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
            text: "Continuing analysis",
            status: "in-progress" as StepStatus,
            type: "reasoning" as StepType,
            description: "",
          };
          steps.push(newStep);
          currentTextStep = newStep;
          textMessageStepMap.set(event.message_id, newStep);
        }

        // Accumulate content in the current reasoning step's description
        currentTextStep.description =
          (currentTextStep.description || "") + (event.delta || "");

        // Update the display text based on content (first sentence as summary)
        const content = currentTextStep.description;
        if (content.length > 10) {
          const firstSentence = content.split(/[.!?]/)[0];
          if (firstSentence && firstSentence.length > 5) {
            currentTextStep.text =
              firstSentence.length > 150
                ? firstSentence.slice(0, 150) + "..."
                : firstSentence;
          }
        }
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
          // No STEP_STARTED - create a step for this tool call
          // Use a unique step number based on tool_call_id hash
          stepNum = steps.length + 1000; // Offset to avoid conflicts
          const stepId = `tool-${toolId || stepNum}`;

          step = {
            id: stepId,
            text: getToolDescription(toolName),
            status: "in-progress" as StepStatus,
            type: "tool_call" as StepType,
            source: getToolSource(toolName),
            description: "",
          };

          stepNumberMap.set(stepNum, step);
          steps.push(step);

          // Mark current reasoning step as complete
          if (currentTextStep) {
            currentTextStep.status = "complete" as StepStatus;
            currentTextStep = null;
          }
        }

        // Transform step to tool_call type
        step.source = getToolSource(toolName);
        step.description = getToolDescription(
          toolName,
          toolArgsMap.get(toolId || ""),
        );

        // Early approval detection by tool name (like V1's isApprovalTool)
        // This allows the UI to show the approval state immediately
        if (isAnyApprovalTool(toolName)) {
          step.type = "approval" as StepType;
          step.status = "awaiting-approval" as StepStatus;
          // Initialize approval data with tool call info (will be populated with args later)
          const approvalType = getApprovalType(toolName);
          const objectType =
            approvalType === "calendar"
              ? "Calendar Event"
              : approvalType === "deep_research"
                ? "Deep Research"
                : "Salesforce Record";
          step.approval = {
            toolCallId: toolId || "",
            summary:
              approvalType === "deep_research"
                ? "Awaiting approval to proceed with full research..."
                : "Requesting approval...",
            objectType,
            operation: approvalType === "deep_research" ? "create" : "update",
            approvalType,
          };
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
              if (parsed.dataset_name) {
                step.description = `Querying: ${parsed.dataset_name}`;
              }
            } catch {
              // Args not complete JSON yet, ignore
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
              if (parsed.dataset_name) {
                step.description = `Querying: ${parsed.dataset_name}`;
              }

              // If step was already marked as approval (detected at TOOL_CALL_START by tool name),
              // update the approval data with the actual arguments
              if (step.type === "approval" && step.approval) {
                const approvalData = detectApprovalFromArgs(toolId, parsed);
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
            } catch {
              // Ignore parse errors
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
            try {
              const result = event.content ? JSON.parse(event.content) : {};

              // Handle approval tool results
              if (step.status === "awaiting-approval") {
                // TOOL_CALL_RESULT for approval tool = approval was accepted (otherwise tool wouldn't execute)
                // Mark complete unless explicitly failed
                if (result.approved === false || result.error) {
                  step.status = "error" as StepStatus;
                } else {
                  step.status = "complete" as StepStatus;
                }
              } else {
                // Handle non-approval tool results
                // Check for artifact (success case)
                if (result._artifact) {
                  step.status = result._artifact.success
                    ? ("complete" as StepStatus)
                    : ("error" as StepStatus);
                  // Store artifact metadata for clickable links
                  // Display name is derived in the component from tool_name
                  step.artifact = {
                    artifact_id: result._artifact.artifact_id,
                    run_id: result._artifact.run_id,
                    tool_name: result._artifact.tool_name,
                    artifact_type: result._artifact.artifact_type,
                  };
                } else if (result.success === false) {
                  step.status = "error" as StepStatus;
                } else {
                  step.status = "complete" as StepStatus;
                }
              }
            } catch {
              // Only mark complete if not awaiting approval
              if (step.status !== "awaiting-approval") {
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
        // Check if there's a pending approval step
        // If so, this is an intermediate RUN_FINISHED (run paused for approval)
        // Don't finalize - wait for the next RUN_FINISHED after approval
        const hasPendingApproval = steps.some(
          (s) => s.status === "awaiting-approval",
        );

        if (hasPendingApproval && event.type === "RUN_FINISHED") {
          // Intermediate RUN_FINISHED - run paused for approval
          // Stop thinking - run is complete, just waiting for user approval
          isThinking = false;

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

        // Fallback: Extract the last TEXT_MESSAGE step as the final response
        // Only do this if we don't already have a finalResponse from explicit is_final_response flow
        if (!finalResponse && lastTextMessageId) {
          const lastTextStep = textMessageStepMap.get(lastTextMessageId);
          if (lastTextStep) {
            // Extract content as final response
            finalResponse = lastTextStep.description || "";
            // Remove this step from the steps array
            const stepIndex = steps.indexOf(lastTextStep);
            if (stepIndex !== -1) {
              steps.splice(stepIndex, 1);
            }
          }
        }

        // Mark any in-progress steps as complete (or error for RUN_ERROR)
        const finalStatus =
          event.type === "RUN_ERROR"
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
