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
} from "@vonlabs/design-components";

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
    };
  }

  // Sort events by sequence
  const sortedEvents = [...events].sort((a, b) => a.sequence - b.sequence);

  const steps: TimelineStep[] = [];
  // Map step_number to step for STEP_STARTED/STEP_FINISHED correlation
  const stepNumberMap = new Map<number, TimelineStep>();
  // Map tool_call_id to step_number for tool event -> step correlation
  const toolCallToStepMap = new Map<string, number>();
  // Map message_id to step for TEXT_MESSAGE events (reasoning only, not final response)
  const textMessageStepMap = new Map<string, TimelineStep>();
  // Accumulate tool arguments
  const toolArgsMap = new Map<string, string>();
  // Track the current active step (from STEP_STARTED, for tool calls only)
  let currentStep: TimelineStep | null = null;
  let currentStepNumber: number | null = null;
  // Track current text message step (separate from tool steps)
  let currentTextStep: TimelineStep | null = null;
  let isThinking = true;
  // Counter for creating unique reasoning step IDs when interleaved with tool calls
  let reasoningStepCounter = 0;

  // Final response tracking
  let finalResponse = "";
  let isFinalResponseStreaming = false;
  // Track which message_ids are final responses (to extract ALL their steps at the end)
  const finalResponseMessageIds = new Set<string>();

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
        const stepId = `step-${stepEvent.step_number}`;

        const step: TimelineStep = {
          id: stepId,
          text: stepEvent.step_name,
          status: "in-progress" as StepStatus,
          type: "reasoning" as StepType,
          category: stepEvent.metadata?.category as EventCategory,
          description: "",
        };

        stepNumberMap.set(stepEvent.step_number, step);
        steps.push(step);

        // Track as current step for subsequent tool events
        currentStep = step;
        currentStepNumber = stepEvent.step_number;

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
        const step = stepNumberMap.get(finishedEvent.step_number);

        if (step) {
          // Only mark complete if not awaiting approval
          if (step.status !== "awaiting-approval") {
            step.status = "complete" as StepStatus;
          }
        }

        // Clear current step if it matches
        if (currentStepNumber === finishedEvent.step_number) {
          currentStep = null;
          currentStepNumber = null;
        }
        break;
      }

      case "TEXT_MESSAGE_START": {
        // Check if this is a final response (has parent_message_id)
        const parentId = (event as { parent_message_id?: string })
          .parent_message_id;

        // Always create a reasoning step for TEXT_MESSAGE_START
        // All text content goes inside the thinking block during streaming
        reasoningStepCounter++;
        const stepId = `reasoning-${event.message_id}-${reasoningStepCounter}`;

        const textStep: TimelineStep = {
          id: stepId,
          text: parentId ? "Preparing response" : "Analyzing your request",
          status: "in-progress" as StepStatus,
          type: "reasoning" as StepType,
          description: "",
        };

        textMessageStepMap.set(event.message_id, textStep);
        steps.push(textStep);
        currentTextStep = textStep;

        // Mark this message_id as final response (to extract ALL its steps at RUN_FINISHED)
        if (parentId) {
          finalResponseMessageIds.add(event.message_id);
          isFinalResponseStreaming = true;
        }
        break;
      }

      case "TEXT_MESSAGE_CONTENT": {
        // All TEXT_MESSAGE_CONTENT goes to reasoning steps (inside thinking block)
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
              firstSentence.length > 50
                ? firstSentence.slice(0, 50) + "..."
                : firstSentence;
          }
        }
        break;
      }

      case "TEXT_MESSAGE_END": {
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

        // If there's a current step from STEP_STARTED, use it
        // Otherwise, create a new step for this tool call
        let step: TimelineStep;
        let stepNum: number;

        if (currentStep && currentStepNumber !== null) {
          // Use existing step from STEP_STARTED
          step = currentStep;
          stepNum = currentStepNumber;
        } else {
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
        step.type = "tool_call" as StepType;
        step.source = getToolSource(toolName);
        step.description = getToolDescription(
          toolName,
          toolArgsMap.get(toolId || ""),
        );

        // Map tool_call_id to step for subsequent tool events
        if (toolId) {
          toolCallToStepMap.set(toolId, stepNum);
          toolArgsMap.set(toolId, "");
        }
        break;
      }

      case "TOOL_CALL_ARGS": {
        // Accumulate tool arguments and update step
        const toolId = event.tool_call_id;
        if (toolId) {
          const currentArgs = toolArgsMap.get(toolId) || "";
          toolArgsMap.set(toolId, currentArgs + (event.delta || ""));

          // Find the step for this tool call
          const stepNumber = toolCallToStepMap.get(toolId);
          const step =
            stepNumber !== undefined ? stepNumberMap.get(stepNumber) : null;

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
        const toolId = event.tool_call_id;
        if (toolId) {
          const stepNumber = toolCallToStepMap.get(toolId);
          const step =
            stepNumber !== undefined ? stepNumberMap.get(stepNumber) : null;

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
              // For approval tools, extract approval data
              if (parsed.operations && parsed.summary) {
                step.type = "approval" as StepType;
                step.status = "awaiting-approval" as StepStatus;
                step.approval = {
                  summary: parsed.summary,
                  objectType:
                    parsed.operations[0]?.sobject_type || "Salesforce Record",
                  recordName: parsed.operations[0]?.record_name,
                  operation: parsed.operations[0]?.operation || "update",
                  changes: parsed.operations[0]?.changes,
                };
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
        if (toolId) {
          const stepNumber = toolCallToStepMap.get(toolId);
          const step =
            stepNumber !== undefined ? stepNumberMap.get(stepNumber) : null;

          if (step && step.status !== "awaiting-approval") {
            try {
              const result = event.content ? JSON.parse(event.content) : {};

              // Check for artifact (success case)
              if (result._artifact) {
                step.status = result._artifact.success
                  ? ("complete" as StepStatus)
                  : ("error" as StepStatus);
                if (result._artifact.artifact_type === "table") {
                  step.artifactName = `${result._artifact.tool_name} results`;
                }
              } else if (result.success === false) {
                step.status = "error" as StepStatus;
              } else {
                step.status = "complete" as StepStatus;
              }
            } catch {
              step.status = "complete" as StepStatus;
            }
          }
        }
        break;
      }

      case "RUN_FINISHED":
      case "RUN_ERROR": {
        // Mark all steps as complete and stop processing
        isThinking = false;
        isFinalResponseStreaming = false;

        // Find the LAST step belonging to final response message_id
        // Only that last step is the actual final response; earlier ones are intermediate reasoning
        // Step IDs are formatted as "reasoning-{message_id}-{counter}"
        let lastFinalResponseStepIndex = -1;
        for (let i = steps.length - 1; i >= 0; i--) {
          const step = steps[i];
          const isFinalResponseStep = Array.from(finalResponseMessageIds).some(
            (msgId) => step.id.includes(msgId),
          );
          if (isFinalResponseStep) {
            lastFinalResponseStepIndex = i;
            break; // Found the last one, stop searching
          }
        }

        // Extract only the last final response step
        if (lastFinalResponseStepIndex >= 0) {
          const step = steps[lastFinalResponseStepIndex];
          finalResponse = step.description || "";
          steps.splice(lastFinalResponseStepIndex, 1);
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

  return { steps, isThinking, finalResponse, isFinalResponseStreaming };
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
