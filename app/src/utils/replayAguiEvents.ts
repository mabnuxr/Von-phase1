/**
 * Replay AGUI events to reconstruct stepMessages and toolCalls
 * This is used when fetching messages from the backend where events are persisted
 * but stepMessages and toolCalls need to be reconstructed
 */

import type {
  StepMessage,
  ToolCall,
  AguiEventWrapper,
  ToolResult,
  MetricData,
} from "@vonlabs/design-components";

interface ReplayResult {
  content: string;
  stepMessages: StepMessage[];
  toolCalls: ToolCall[];
}

/**
 * Parse tool result JSON to detect type and structure
 * Same logic as used in useAguiMessageStream for consistency
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseToolResult(resultJson: any): ToolResult {
  try {
    // Auto-detect table data (SQL results)
    if (resultJson.sample?.columns && resultJson.sample?.rows) {
      return {
        raw: resultJson,
        type: "table",
        table: {
          columns: resultJson.sample.columns,
          rows: resultJson.sample.rows,
          rowCount: resultJson.row_count || resultJson.sample.size || 0,
          isComplete: resultJson.sample.is_complete ?? true,
        },
        queries: resultJson.queries,
      };
    }

    // Detect values discovery (e.g., sql_discover_values)
    if (
      resultJson.values &&
      Array.isArray(resultJson.values) &&
      resultJson.values.length > 0
    ) {
      const hasValidStructure = resultJson.values.every(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any) => item.value !== undefined && item.count !== undefined,
      );

      if (hasValidStructure) {
        return {
          raw: resultJson,
          type: "values",
          values: resultJson.values,
          queries: resultJson.queries,
        };
      }
    }

    // Detect query information
    if (resultJson.queries && Array.isArray(resultJson.queries)) {
      return {
        raw: resultJson,
        type: "query",
        queries: resultJson.queries,
      };
    }

    // Detect metrics/counts
    if (
      resultJson.row_count !== undefined ||
      resultJson.value_count !== undefined
    ) {
      const metrics: MetricData[] = [];

      if (resultJson.row_count !== undefined) {
        metrics.push({
          label: "Row Count",
          value: resultJson.row_count,
          type: "count",
        });
      }

      if (resultJson.value_count !== undefined) {
        metrics.push({
          label: "Unique Values",
          value: resultJson.value_count,
          type: "count",
        });
      }

      return {
        raw: resultJson,
        type: "metrics",
        metrics,
      };
    }

    // Fallback to JSON
    return {
      raw: resultJson,
      type: "json",
    };
  } catch (error) {
    console.error("[parseToolResult] Error parsing tool result:", error);
    return {
      raw: resultJson,
      type: "json",
    };
  }
}

/**
 * Replay AGUI events to reconstruct the message content, stepMessages, and toolCalls
 */
export function replayAguiEvents(
  events: AguiEventWrapper[] | null | undefined,
): ReplayResult {
  console.log("[replayAguiEvents] Called with events:", events?.length || 0);

  const result: ReplayResult = {
    content: "",
    stepMessages: [],
    toolCalls: [],
  };

  if (!events || events.length === 0) {
    console.log("[replayAguiEvents] No events to process");
    return result;
  }

  // Sort events by sequence to ensure correct order
  const sortedEvents = [...events].sort((a, b) => a.sequence - b.sequence);
  console.log("[replayAguiEvents] Processing", sortedEvents.length, "events");

  // State maps for tracking
  const stepMessagesMap = new Map<string, StepMessage>();
  const toolCallsMap = new Map<string, ToolCall>();
  const toolCallArgsMap = new Map<string, string>();

  // Count event types for debugging
  const eventTypeCounts: Record<string, number> = {};

  // Process each event
  for (const wrapper of sortedEvents) {
    const event = wrapper.event;

    // Count event types
    eventTypeCounts[event.type] = (eventTypeCounts[event.type] || 0) + 1;

    switch (event.type) {
      case "TEXT_MESSAGE_START": {
        if (event.message_id) {
          console.log(
            "[replayAguiEvents] TEXT_MESSAGE_START:",
            event.message_id,
          );
          stepMessagesMap.set(event.message_id, {
            message_id: event.message_id,
            content: "",
            toolCalls: [],
          });
        }
        break;
      }

      case "TEXT_MESSAGE_CONTENT": {
        if (event.message_id && event.delta) {
          const step = stepMessagesMap.get(event.message_id);
          if (step) {
            step.content += event.delta;
            result.content += event.delta;
          }
        }
        break;
      }

      case "TOOL_CALL_START": {
        console.log("[replayAguiEvents] TOOL_CALL_START event:", {
          tool_call_id: event.tool_call_id,
          tool_call_name: event.tool_call_name,
          parent_message_id: event.parent_message_id,
          sequence: wrapper.sequence,
        });

        if (event.tool_call_id && event.tool_call_name) {
          const toolCall: ToolCall = {
            id: event.tool_call_id,
            name: event.tool_call_name,
            arguments: {},
            status: "pending",
            startTime: Date.now(),
            parentMessageId: event.parent_message_id || "",
          };

          toolCallsMap.set(event.tool_call_id, toolCall);
          toolCallArgsMap.set(event.tool_call_id, "");

          // Attach to parent step or last step
          let parentStep = stepMessagesMap.get(event.parent_message_id || "");
          console.log(
            "[replayAguiEvents] Looking for parent step:",
            event.parent_message_id,
            "found:",
            !!parentStep,
          );

          if (!parentStep) {
            const allSteps = Array.from(stepMessagesMap.values());
            parentStep = allSteps[allSteps.length - 1];
            console.log(
              "[replayAguiEvents] Using last step instead. Total steps:",
              allSteps.length,
            );
          }

          if (parentStep) {
            if (!parentStep.toolCalls) {
              parentStep.toolCalls = [];
            }
            parentStep.toolCalls.push(toolCall);
            console.log(
              "[replayAguiEvents] Attached tool call to step. Step now has",
              parentStep.toolCalls.length,
              "tool calls",
            );
          } else {
            console.warn(
              "[replayAguiEvents] No parent step found for tool call!",
            );
          }
        }
        break;
      }

      case "TOOL_CALL_ARGS": {
        if (event.tool_call_id && event.delta) {
          const currentArgs = toolCallArgsMap.get(event.tool_call_id) || "";
          toolCallArgsMap.set(event.tool_call_id, currentArgs + event.delta);
          console.log(
            "[replayAguiEvents] TOOL_CALL_ARGS accumulated for",
            event.tool_call_id,
            "- total length:",
            (currentArgs + event.delta).length,
          );
        }
        break;
      }

      case "TOOL_CALL_END": {
        if (event.tool_call_id) {
          const toolCall = toolCallsMap.get(event.tool_call_id);
          if (toolCall) {
            // Parse accumulated args
            const argsJson = toolCallArgsMap.get(event.tool_call_id) || "{}";
            console.log(
              "[replayAguiEvents] TOOL_CALL_END - parsing args:",
              argsJson,
            );

            try {
              toolCall.arguments = JSON.parse(argsJson);
              toolCall.args = toolCall.arguments; // Alias
              console.log(
                "[replayAguiEvents] Successfully parsed args:",
                toolCall.arguments,
              );
            } catch {
              console.error("[replayAguiEvents] Error parsing tool args");
              toolCall.arguments = { raw: argsJson };
            }

            toolCall.status = "success";
            toolCall.endTime = Date.now();
          }
        }
        break;
      }

      case "TOOL_CALL_RESULT": {
        if (event.tool_call_id && event.content) {
          const toolCall = toolCallsMap.get(event.tool_call_id);
          console.log(
            "[replayAguiEvents] TOOL_CALL_RESULT for",
            event.tool_call_id,
            "- found toolCall:",
            !!toolCall,
          );

          if (toolCall) {
            try {
              const resultData = JSON.parse(event.content);
              // Use parseToolResult to properly detect SQL results, tables, metrics, etc.
              toolCall.result = parseToolResult(resultData);
              toolCall.status = "success";
              console.log(
                "[replayAguiEvents] Successfully parsed result with type:",
                toolCall.result.type,
              );
            } catch (error) {
              // If result is not JSON, store raw string in 'raw' field
              toolCall.result = { raw: event.content, type: "json" };
              toolCall.status = "error";
              console.log(
                "[replayAguiEvents] Result is not JSON, treating as error:",
                error,
              );
            }
          }
        }
        break;
      }
    }
  }

  // Convert maps to arrays
  result.stepMessages = Array.from(stepMessagesMap.values());
  result.toolCalls = Array.from(toolCallsMap.values());

  console.log("[replayAguiEvents] Event type counts:", eventTypeCounts);
  console.log("[replayAguiEvents] Final result:", {
    contentLength: result.content.length,
    stepMessagesCount: result.stepMessages.length,
    toolCallsCount: result.toolCalls.length,
    stepMessages: result.stepMessages.map((sm) => ({
      message_id: sm.message_id,
      contentLength: sm.content.length,
      toolCallsCount: sm.toolCalls?.length || 0,
    })),
  });

  return result;
}
