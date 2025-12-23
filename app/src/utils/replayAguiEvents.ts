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
  stoppedByUser?: boolean;
}

/**
 * Parse tool result JSON to detect type and structure
 * Same logic as used in useAguiMessageStream for consistency
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseToolResult(resultJson: any): ToolResult | null {
  try {
    // FIX: Check backend success field first
    // If backend indicates failure, return null to mark tool call as error
    if (resultJson.success === false) {
      return null;
    }

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

    // Detect schema information (sql_list_schema, sql_list_tables)
    if (resultJson.columns && Array.isArray(resultJson.columns)) {
      return {
        raw: resultJson,
        type: "schema",
        schema: {
          tableName: resultJson.table_name,
          columns: resultJson.columns,
        },
        queries: resultJson.queries,
      };
    }

    // Detect table list (sql_list_tables)
    if (
      resultJson.materialized_views &&
      Array.isArray(resultJson.materialized_views)
    ) {
      return {
        raw: resultJson,
        type: "table_list",
        tables: resultJson.materialized_views || resultJson.all_objects,
        queries: resultJson.queries,
      };
    }

    // Detect statistics (sql_get_statistics)
    if (resultJson.statistics && typeof resultJson.statistics === "object") {
      return {
        raw: resultJson,
        type: "statistics",
        statistics: resultJson.statistics,
        queries: resultJson.queries,
      };
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
  const result: ReplayResult = {
    content: "",
    stepMessages: [],
    toolCalls: [],
  };

  if (!events || events.length === 0) {
    return result;
  }

  // Sort events by sequence to ensure correct order
  const sortedEvents = [...events].sort((a, b) => a.sequence - b.sequence);

  // State maps for tracking
  const stepMessagesMap = new Map<string, StepMessage>();
  const toolCallsMap = new Map<string, ToolCall>();
  const toolCallArgsMap = new Map<string, string>();

  // Process each event
  for (const wrapper of sortedEvents) {
    const event = wrapper.event;

    switch (event.type) {
      case "TEXT_MESSAGE_START": {
        if (event.message_id) {
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

      // TOOL_CALL_START: Create tool call or reuse existing one
      // During resume flows, LangGraph may emit TOOL_CALL_START events for tool calls
      // that were already started in the original run (due to checkpoint replay).
      // We deduplicate by tool_call_id to prevent duplicate approval cards in the UI.
      case "TOOL_CALL_START": {
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

          if (!parentStep) {
            // FIX: Create parent step if it doesn't exist
            // This handles cases where TOOL_CALL_START arrives before TEXT_MESSAGE_START
            if (event.parent_message_id) {
              parentStep = {
                message_id: event.parent_message_id,
                content: "",
                toolCalls: [],
              };
              stepMessagesMap.set(event.parent_message_id, parentStep);
            } else {
              // No parent_message_id, try last step as fallback
              const allSteps = Array.from(stepMessagesMap.values());
              parentStep = allSteps[allSteps.length - 1];
            }
          }

          if (parentStep) {
            if (!parentStep.toolCalls) {
              parentStep.toolCalls = [];
            }

            // FIX: Deduplication check by tool_call_id
            // During resume, LangGraph replays TOOL_CALL_START events for already-seen tools
            // Check if this tool call already exists in the parent step's toolCalls array
            const existingToolCallIndex = parentStep.toolCalls.findIndex(
              (tc) => tc.id === event.tool_call_id,
            );

            if (existingToolCallIndex === -1) {
              // Tool call doesn't exist yet, add it normally
              parentStep.toolCalls.push(toolCall);
            } else {
              // Tool call already exists (duplicate from resume flow)
              // Update the map reference to point to the existing one in the array
              // This ensures subsequent events (TOOL_CALL_ARGS, TOOL_CALL_END, TOOL_CALL_RESULT)
              // update the correct object that's already in the UI
              toolCallsMap.set(
                event.tool_call_id,
                parentStep.toolCalls[existingToolCallIndex],
              );
            }
          }
        }
        break;
      }

      case "TOOL_CALL_ARGS": {
        if (event.tool_call_id && event.delta) {
          const currentArgs = toolCallArgsMap.get(event.tool_call_id) || "";
          toolCallArgsMap.set(event.tool_call_id, currentArgs + event.delta);
        }
        break;
      }

      case "TOOL_CALL_END": {
        if (event.tool_call_id) {
          const toolCall = toolCallsMap.get(event.tool_call_id);
          if (toolCall) {
            // Parse accumulated args
            const argsJson = toolCallArgsMap.get(event.tool_call_id) || "{}";

            try {
              toolCall.arguments = JSON.parse(argsJson);
              toolCall.args = toolCall.arguments; // Alias
            } catch {
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

          if (toolCall) {
            try {
              const resultData = JSON.parse(event.content);

              // Check if this is an artifact reference
              if (resultData._artifact) {
                // Artifact-backed result - store metadata
                toolCall.artifact = {
                  artifact_id: resultData._artifact.artifact_id,
                  artifact_type: resultData._artifact.artifact_type,
                  size_bytes: resultData._artifact.size_bytes,
                  tool_name: resultData._artifact.tool_name,
                  run_id: resultData._artifact.run_id, // Include run_id for artifact fetching
                  success: resultData._artifact.success, // Include tool execution success status
                  error: resultData._artifact.error, // Include error message if present
                };
                // No inline result - will be fetched lazily
                toolCall.result = undefined;
                // Set status based on tool execution success
                toolCall.status =
                  resultData._artifact.success === false ? "error" : "success";
              } else {
                // Regular inline result (backward compatibility)

                const parsedResult = parseToolResult(resultData);

                if (parsedResult) {
                  toolCall.result = parsedResult;
                  toolCall.status = "success";
                } else {
                  // parsedResult is null, meaning backend indicated failure
                  toolCall.status = "error";
                }
              }
            } catch {
              // If result is not JSON, store raw string in 'raw' field
              toolCall.result = { raw: event.content, type: "json" };
              toolCall.status = "error";
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

  // Force-complete all pending tool calls to stop animations
  result.toolCalls.forEach((toolCall) => {
    if (!toolCall.result && !toolCall.artifact && toolCall.status !== "error") {
      toolCall.status = "success";
      toolCall.endTime = toolCall.endTime || Date.now();
    }
  });

  // Check if stopped by user from RUN_FINISHED event
  const runFinishedEvent = events.find((e) => e.event.type === "RUN_FINISHED");
  if (runFinishedEvent && runFinishedEvent.event.type === "RUN_FINISHED") {
    result.stoppedByUser =
      runFinishedEvent.event.result?.stopped_by_user || false;
  }

  return result;
}
