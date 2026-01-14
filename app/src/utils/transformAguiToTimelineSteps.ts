/**
 * Transform AGUI events to TimelineStep[] format for TimelineThinkingProcess component
 *
 * This is the v2 transformation layer that converts raw AGUI events into the
 * structured format expected by the new TimelineThinkingProcess component.
 */

import type { AguiEventWrapper } from "@vonlabs/design-components";
import type {
  TimelineStep,
  StepStatus,
  StepType,
  SourceType,
} from "@vonlabs/design-components";

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

  // VonIQ internal tools
  write_file: "voniq",
  execute_bash: "voniq",
  read_file: "voniq",
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
    write_file: "Writing analysis file",
    execute_bash: "Running analysis script",
    read_file: "Reading file contents",
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

/**
 * Get a short display text for a tool
 */
function getToolDisplayText(toolName: string): string {
  const displayNames: Record<string, string> = {
    execute_sql_query: "Fetching data from Salesforce",
    request_salesforce_approval: "Requesting approval",
    search_gong_calls: "Searching Gong calls",
    get_gong_call_transcript: "Getting transcript",
    search_emails: "Searching emails",
    get_email_content: "Getting email",
    get_calendar_events: "Checking calendar",
    request_google_calendar_approval: "Calendar approval",
    write_file: "Writing file",
    execute_bash: "Running script",
    read_file: "Reading file",
  };

  return displayNames[toolName] || toolName.replace(/_/g, " ");
}

export interface TransformResult {
  steps: TimelineStep[];
  isThinking: boolean;
}

/**
 * Transform AGUI events into TimelineStep[] format
 *
 * @param events - Array of AGUI event wrappers from Pusher
 * @returns Object with steps array and isThinking status
 */
export function transformAguiToTimelineSteps(
  events: AguiEventWrapper[] | null | undefined,
): TransformResult {
  if (!events || events.length === 0) {
    return { steps: [], isThinking: false };
  }

  // Sort events by sequence
  const sortedEvents = [...events].sort((a, b) => a.sequence - b.sequence);

  const steps: TimelineStep[] = [];
  const stepMap = new Map<string, TimelineStep>();
  const toolArgsMap = new Map<string, string>();
  let currentReasoningStep: TimelineStep | null = null;
  let isThinking = true;
  let stepCounter = 0;

  let runFinished = false;

  for (const wrapper of sortedEvents) {
    const event = wrapper.event;

    // Once RUN_FINISHED is received, ignore all subsequent events
    if (runFinished) {
      break;
    }

    switch (event.type) {
      case "RUN_STARTED": {
        // Initialize - no step created yet
        break;
      }

      case "TEXT_MESSAGE_START": {
        // Create a new reasoning step
        stepCounter++;
        const stepId = `reasoning-${event.message_id || stepCounter}`;

        currentReasoningStep = {
          id: stepId,
          text: "Analyzing your request",
          status: "in-progress" as StepStatus,
          type: "reasoning" as StepType,
          description: "",
        };

        stepMap.set(stepId, currentReasoningStep);
        steps.push(currentReasoningStep);
        break;
      }

      case "TEXT_MESSAGE_CONTENT": {
        // Update current reasoning step with content
        if (currentReasoningStep) {
          currentReasoningStep.description =
            (currentReasoningStep.description || "") + (event.delta || "");

          // Update the display text based on content
          const content = currentReasoningStep.description;
          if (content.length > 10) {
            // Extract first sentence or truncate
            const firstSentence = content.split(/[.!?]/)[0];
            if (firstSentence && firstSentence.length > 5) {
              currentReasoningStep.text =
                firstSentence.length > 50
                  ? firstSentence.slice(0, 50) + "..."
                  : firstSentence;
            }
          }
        }
        break;
      }

      case "TEXT_MESSAGE_END": {
        // Mark reasoning step as complete
        if (currentReasoningStep) {
          currentReasoningStep.status = "complete" as StepStatus;
          currentReasoningStep = null;
        }
        break;
      }

      case "TOOL_CALL_START": {
        // Mark any current reasoning step as complete
        if (currentReasoningStep) {
          currentReasoningStep.status = "complete" as StepStatus;
          currentReasoningStep = null;
        }

        // Create a new tool call step
        stepCounter++;
        const toolStepId = `tool-${event.tool_call_id || stepCounter}`;
        const toolName = event.tool_call_name || "unknown";

        const toolStep: TimelineStep = {
          id: toolStepId,
          text: getToolDisplayText(toolName),
          status: "in-progress" as StepStatus,
          type: "tool_call" as StepType,
          source: getToolSource(toolName),
          description: getToolDescription(toolName),
        };

        stepMap.set(event.tool_call_id || toolStepId, toolStep);
        toolArgsMap.set(event.tool_call_id || toolStepId, "");
        steps.push(toolStep);
        break;
      }

      case "TOOL_CALL_ARGS": {
        // Accumulate tool arguments
        const toolId = event.tool_call_id;
        if (toolId) {
          const currentArgs = toolArgsMap.get(toolId) || "";
          toolArgsMap.set(toolId, currentArgs + (event.delta || ""));

          // Update the step with parsed args for description
          const step = stepMap.get(toolId);
          if (step) {
            const accumulatedArgs = toolArgsMap.get(toolId) || "";
            try {
              const parsed = JSON.parse(accumulatedArgs);
              if (parsed.query) {
                // Show SQL query preview
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
        const step = stepMap.get(event.tool_call_id || "");
        if (step) {
          // Parse final args
          const argsJson = toolArgsMap.get(event.tool_call_id || "") || "{}";
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
        break;
      }

      case "TOOL_CALL_RESULT": {
        // Tool execution complete
        const step = stepMap.get(event.tool_call_id || "");
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
        break;
      }

      case "RUN_FINISHED":
      case "RUN_ERROR": {
        // Mark all steps as complete and stop processing
        isThinking = false;
        runFinished = true;

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

        // Also complete any current reasoning step
        if (currentReasoningStep) {
          currentReasoningStep.status = finalStatus;
          currentReasoningStep = null;
        }
        break;
      }
    }
  }

  return { steps, isThinking };
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
