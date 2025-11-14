import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { Channel } from 'pusher-js';
import type {
  AguiEventWrapper,
  ToolCall,
  ToolResult,
  MetricData,
  StepMessage,
  TextMessageStartEvent,
  TextMessageContentEvent,
  ToolCallStartEvent,
  ToolCallArgsEvent,
  ToolCallResultEvent,
  Message,
} from '../types';

export interface AguiStateUpdate {
  runId: string;
  messageContent: string;
  stepMessages: StepMessage[];
  toolCalls: ToolCall[];
  isStreaming: boolean;
  status: 'created' | 'streaming' | 'completed' | 'failed';
}

export interface UserMessageData {
  id: string;
  conversationId: string;
  messageContent: string;
  messageType: string;
  role: 'user';
  createdAt: string;
  createdBy: string;
}

interface StreamingState {
  currentRunId: string | null;
  currentMessageId: string | null;
  messageContent: Map<string, string>; // messageId -> accumulated content
  stepMessages: Map<string, StepMessage>; // message_id -> StepMessage
  toolCalls: Map<string, ToolCall>; // toolCallId -> ToolCall
  toolCallArgs: Map<string, string>; // toolCallId -> accumulated JSON args
  eventBuffer: AguiEventWrapper[]; // Buffer for out-of-order events
  nextExpectedSequence: number;
}

/**
 * Hook for handling AGUI streaming events from Pusher
 * Supports tool calls, multi-step responses, and intelligent result parsing
 *
 * @param channel - Pusher channel for real-time events
 * @param onStateUpdate - Callback for state updates
 * @param onUserMessage - Callback for user messages
 * @param currentMessages - Current messages from store (for initialization after refresh)
 */
export function useAguiMessageStream(
  channel: Channel | null,
  onStateUpdate?: (update: AguiStateUpdate) => void,
  onUserMessage?: (data: UserMessageData) => void,
  currentMessages?: Message[]
) {
  const [streamingMessages, setStreamingMessages] = useState<Map<string, string>>(new Map());
  const [streamingToolCalls, setStreamingToolCalls] = useState<Map<string, ToolCall[]>>(new Map());
  const [streamingStepMessages, setStreamingStepMessages] = useState<Map<string, StepMessage[]>>(
    new Map()
  );

  const stateRef = useRef<StreamingState>({
    currentRunId: null,
    currentMessageId: null,
    messageContent: new Map(),
    stepMessages: new Map(),
    toolCalls: new Map(),
    toolCallArgs: new Map(),
    eventBuffer: [],
    nextExpectedSequence: 1,
  });

  const seenMessageIds = useRef<Set<string>>(new Set());
  const hasInitialized = useRef(false);

  // Initialize streaming state from current messages (for refresh recovery)
  // This pre-populates state with partial content from fetched messages after browser refresh
  useEffect(() => {
    // Only initialize once when we have valid messages
    if (hasInitialized.current || !currentMessages || currentMessages.length === 0) {
      return;
    }

    if (import.meta.env.DEV) {
      console.log(
        '[useAguiMessageStream] Attempting initialization with messages:',
        currentMessages
      );
    }

    currentMessages.forEach((msg) => {
      // Check for streaming status OR isStreaming flag (backend uses status, frontend uses flag)
      const shouldInitialize = (msg.isStreaming || msg.status === 'streaming') && msg.content;

      if (shouldInitialize) {
        // Use id as primary (always exists), messageId as fallback
        const runId = msg.id || msg.messageId;

        if (!runId) {
          console.warn(
            '[useAguiMessageStream] Message has no id or messageId, skipping initialization',
            msg
          );
          return;
        }

        // Pre-populate state Map with replayed content
        stateRef.current.messageContent.set(runId, msg.content);

        // CRITICAL: Set currentRunId so isStreaming detection works after reconnection
        // This ensures the thinking indicator stays visible when streaming continues
        stateRef.current.currentRunId = runId;

        // Also populate stepMessages if available
        if (msg.stepMessages) {
          msg.stepMessages.forEach((step) => {
            stateRef.current.stepMessages.set(step.message_id, step);
            stateRef.current.messageContent.set(step.message_id, step.content);
          });
        }

        // Also populate toolCalls if available
        if (msg.toolCalls) {
          msg.toolCalls.forEach((tool) => {
            stateRef.current.toolCalls.set(tool.id, tool);
          });
        }

        if (import.meta.env.DEV) {
          console.log(
            `[useAguiMessageStream] ✅ Initialized streaming state for runId ${runId} with ${msg.content.length} characters`
          );
        }
      }
    });

    hasInitialized.current = true;
  }, [currentMessages]);

  // Helper: Emit state update to parent
  const emitStateUpdate = (runId: string) => {
    if (!onStateUpdate) {
      console.warn('[useAguiMessageStream] No onStateUpdate callback provided');
      return;
    }

    const state = stateRef.current;
    const messageContent = state.messageContent.get(runId) || '';
    const stepMessages = Array.from(state.stepMessages.values());
    const toolCalls = Array.from(state.toolCalls.values());

    // More robust streaming detection: check if currentRunId matches OR we have active content
    // This handles both live streaming and refresh recovery scenarios
    const isStreaming =
      state.currentRunId === runId ||
      (state.messageContent.has(runId) && state.messageContent.get(runId) !== '');

    console.log('[useAguiMessageStream] Emitting state update:', {
      runId,
      contentLength: messageContent.length,
      stepMessagesCount: stepMessages.length,
      toolCallsCount: toolCalls.length,
      isStreaming,
    });

    onStateUpdate({
      runId,
      messageContent,
      stepMessages,
      toolCalls,
      isStreaming,
      status: isStreaming ? 'streaming' : 'completed',
    });
  };

  // Helper: Parse tool result and detect type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseToolResult = (resultJson: any): ToolResult | null => {
    try {
      // FIX: Check backend success field first
      // If backend indicates failure, return null to mark tool call as error
      if (resultJson.success === false) {
        return null; // This will cause status to be set to 'error'
      }

      // Auto-detect table data (SQL results)
      if (resultJson.sample?.columns && resultJson.sample?.rows) {
        return {
          raw: resultJson,
          type: 'table',
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
      // This takes priority over metrics to show beautiful value distributions
      if (resultJson.values && Array.isArray(resultJson.values) && resultJson.values.length > 0) {
        // Check if values have the right structure (value + count)
        const hasValidStructure = resultJson.values.every(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item: any) => item.value !== undefined && item.count !== undefined
        );

        if (hasValidStructure) {
          return {
            raw: resultJson,
            type: 'values',
            values: resultJson.values,
            queries: resultJson.queries,
          };
        }
      }

      // Detect schema information (sql_list_schema, sql_list_tables)
      if (resultJson.columns && Array.isArray(resultJson.columns)) {
        return {
          raw: resultJson,
          type: 'schema',
          schema: {
            tableName: resultJson.table_name,
            columns: resultJson.columns,
          },
          queries: resultJson.queries,
        };
      }

      // Detect table list (sql_list_tables)
      if (resultJson.materialized_views && Array.isArray(resultJson.materialized_views)) {
        return {
          raw: resultJson,
          type: 'table_list',
          tables: resultJson.materialized_views || resultJson.all_objects,
          queries: resultJson.queries,
        };
      }

      // Detect statistics (sql_get_statistics)
      if (resultJson.statistics && typeof resultJson.statistics === 'object') {
        return {
          raw: resultJson,
          type: 'statistics',
          statistics: resultJson.statistics,
          queries: resultJson.queries,
        };
      }

      // Detect query information
      if (resultJson.queries && Array.isArray(resultJson.queries)) {
        return {
          raw: resultJson,
          type: 'query',
          queries: resultJson.queries,
        };
      }

      // Detect metrics/counts (only if not values)
      if (resultJson.row_count !== undefined || resultJson.value_count !== undefined) {
        const metrics: MetricData[] = [];

        if (resultJson.row_count !== undefined) {
          metrics.push({
            label: 'Row Count',
            value: resultJson.row_count,
            type: 'count',
          });
        }

        if (resultJson.value_count !== undefined) {
          metrics.push({
            label: 'Unique Values',
            value: resultJson.value_count,
            type: 'count',
          });
        }

        return {
          raw: resultJson,
          type: 'metrics',
          metrics,
        };
      }

      // Fallback to JSON
      return {
        raw: resultJson,
        type: 'json',
      };
    } catch (error) {
      console.error('Error parsing tool result:', error);
      return {
        raw: resultJson,
        type: 'json',
      };
    }
  };

  // Process a single AGUI event
  const processEvent = (wrapper: AguiEventWrapper) => {
    const state = stateRef.current;
    const event = wrapper.event;

    try {
      switch (event.type) {
        case 'RUN_STARTED': {
          // Clear previous run data to prevent cross-contamination between runs
          // This ensures each new run starts with a clean slate
          state.stepMessages.clear();
          state.toolCalls.clear();
          state.toolCallArgs.clear();

          state.currentRunId = wrapper.run_id;

          // Initialize messageContent for this run if not already present (from refresh recovery)
          if (!state.messageContent.has(wrapper.run_id)) {
            state.messageContent.set(wrapper.run_id, '');
          }

          emitStateUpdate(wrapper.run_id);
          break;
        }

        case 'TEXT_MESSAGE_START': {
          const e = event as TextMessageStartEvent;
          state.currentMessageId = e.message_id;

          // Initialize content for this text block (step message)
          if (!state.messageContent.has(e.message_id)) {
            state.messageContent.set(e.message_id, '');
          }

          // Create step message entry
          if (!state.stepMessages.has(e.message_id)) {
            state.stepMessages.set(e.message_id, {
              message_id: e.message_id,
              content: '',
              toolCalls: [],
            });
          }
          break;
        }

        case 'TEXT_MESSAGE_CONTENT': {
          const e = event as TextMessageContentEvent;

          // Get existing step message (may have content from Redis initialization)
          const stepMsg = state.stepMessages.get(e.message_id);

          // Accumulate in the step message content
          // This preserves Redis-fetched content when streaming restarts after refresh
          const currentStepContent =
            state.messageContent.get(e.message_id) || stepMsg?.content || '';
          const newStepContent = currentStepContent + e.delta;
          state.messageContent.set(e.message_id, newStepContent);

          // Update step message object
          if (stepMsg) {
            stepMsg.content = newStepContent;
          }

          // CRITICAL: Also accumulate under the run_id for the UI to access
          const currentRunContent = state.messageContent.get(wrapper.run_id) || '';
          state.messageContent.set(wrapper.run_id, currentRunContent + e.delta);

          // Use flushSync to force immediate synchronous updates for smooth streaming
          flushSync(() => {
            // Update streaming state
            setStreamingMessages(new Map(state.messageContent));

            // Update streaming step messages
            const stepMessagesArray = Array.from(state.stepMessages.values());
            setStreamingStepMessages((prev) => {
              const next = new Map(prev);
              next.set(wrapper.run_id, stepMessagesArray);
              return next;
            });

            // Emit state update with current content
            emitStateUpdate(wrapper.run_id);
          });
          break;
        }

        case 'TEXT_MESSAGE_END': {
          // Text block complete - content remains in messageContent
          // We don't clear here because we might have multiple text blocks
          break;
        }

        case 'TOOL_CALL_START': {
          const e = event as ToolCallStartEvent;

          // Create tool call object
          const toolCall: ToolCall = {
            id: e.tool_call_id,
            name: e.tool_call_name,
            arguments: {},
            status: 'pending',
            parentMessageId: e.parent_message_id,
            startTime: Date.now(), // Track when tool started
          };

          state.toolCalls.set(e.tool_call_id, toolCall);
          state.toolCallArgs.set(e.tool_call_id, '');

          // Try to find parent step
          let parentStep = state.stepMessages.get(e.parent_message_id);

          if (!parentStep) {
            // FIX: Create parent step if it doesn't exist
            // This handles cases where TOOL_CALL_START arrives before TEXT_MESSAGE_START
            if (e.parent_message_id) {
              parentStep = {
                message_id: e.parent_message_id,
                content: '',
                toolCalls: [],
              };
              state.stepMessages.set(e.parent_message_id, parentStep);
            } else {
              // No parent_message_id, try last step as fallback
              const allSteps = Array.from(state.stepMessages.values());
              parentStep = allSteps[allSteps.length - 1];
            }
          }

          if (parentStep) {
            if (!parentStep.toolCalls) {
              parentStep.toolCalls = [];
            }
            parentStep.toolCalls.push(toolCall);
          } else {
            console.warn(
              '[useAguiMessageStream] No parent step found for tool call - this should not happen!'
            );
          }

          // Update streaming step messages immediately to show tool call in UI
          const stepMessagesArray = Array.from(state.stepMessages.values());
          setStreamingStepMessages((prev) => {
            const next = new Map(prev);
            next.set(wrapper.run_id, stepMessagesArray);
            return next;
          });

          // Emit state update with new tool call
          emitStateUpdate(wrapper.run_id);
          break;
        }

        case 'TOOL_CALL_ARGS': {
          const e = event as ToolCallArgsEvent;

          // Accumulate JSON args (streaming)
          const currentArgs = state.toolCallArgs.get(e.tool_call_id) || '';
          state.toolCallArgs.set(e.tool_call_id, currentArgs + e.delta);
          break;
        }

        case 'TOOL_CALL_END': {
          const e = event;
          const toolCall = state.toolCalls.get(e.tool_call_id);

          if (toolCall) {
            // Parse accumulated args
            const argsJson = state.toolCallArgs.get(e.tool_call_id) || '{}';
            try {
              toolCall.arguments = JSON.parse(argsJson);
            } catch (error) {
              console.error('Error parsing tool args:', error);
              toolCall.arguments = { raw: argsJson };
            }

            // Mark as success immediately (no intermediate "running" state)
            // If TOOL_CALL_RESULT arrives later, it will override this
            toolCall.status = 'success';
            toolCall.endTime = Date.now();
            state.toolCalls.set(e.tool_call_id, toolCall);

            // Update streaming step messages (tool call ref is already in step message)
            const stepMessagesArray = Array.from(state.stepMessages.values());
            setStreamingStepMessages((prev) => {
              const next = new Map(prev);
              next.set(wrapper.run_id, stepMessagesArray);
              return next;
            });
          }
          break;
        }

        case 'TOOL_CALL_RESULT': {
          const e = event as ToolCallResultEvent;
          const toolCall = state.toolCalls.get(e.tool_call_id);

          if (toolCall) {
            // Parse result
            try {
              const resultJson = JSON.parse(e.content);

              // Check if this is an artifact reference
              if (resultJson._artifact) {
                // Artifact-backed result - store metadata
                toolCall.artifact = {
                  artifact_id: resultJson._artifact.artifact_id,
                  artifact_type: resultJson._artifact.artifact_type,
                  size_bytes: resultJson._artifact.size_bytes,
                  tool_name: resultJson._artifact.tool_name,
                  run_id: resultJson._artifact.run_id, // Include run_id for artifact fetching
                  success: resultJson._artifact.success, // Include tool execution success status
                  error: resultJson._artifact.error, // Include error message if present
                };
                // No inline result - will be fetched lazily
                toolCall.result = undefined;
                // Set status based on tool execution success
                toolCall.status = resultJson._artifact.success === false ? 'error' : 'success';
                toolCall.endTime = Date.now();

                state.toolCalls.set(e.tool_call_id, toolCall);

                // Update streaming step messages
                const stepMessagesArray = Array.from(state.stepMessages.values());
                setStreamingStepMessages((prev) => {
                  const next = new Map(prev);
                  next.set(wrapper.run_id, stepMessagesArray);
                  return next;
                });

                // No callback for artifact - content not available yet
              } else {
                // Regular inline result (backward compatibility)
                const parsedResult = parseToolResult(resultJson);

                if (parsedResult) {
                  toolCall.result = parsedResult;
                  toolCall.status = 'success';
                } else {
                  // parsedResult is null, meaning backend indicated failure
                  toolCall.status = 'error';
                }
                toolCall.endTime = Date.now(); // Track when tool completed

                state.toolCalls.set(e.tool_call_id, toolCall);

                // Update streaming step messages (tool call ref is already in step message)
                const stepMessagesArray = Array.from(state.stepMessages.values());
                setStreamingStepMessages((prev) => {
                  const next = new Map(prev);
                  next.set(wrapper.run_id, stepMessagesArray);
                  return next;
                });

                // Emit state update with tool result
                emitStateUpdate(wrapper.run_id);
              }
            } catch {
              console.warn('Tool result is not valid JSON, treating as error message:', e.content);

              // Handle non-JSON content as an error message
              // Store the error text in raw field and mark as json type
              toolCall.result = {
                raw: { error: e.content || 'Unknown error occurred' },
                type: 'json',
              };
              toolCall.status = 'error';
              toolCall.endTime = Date.now(); // Track when tool completed with error
              state.toolCalls.set(e.tool_call_id, toolCall);

              // Update streaming step messages (tool call ref is already in step message)
              const stepMessagesArray = Array.from(state.stepMessages.values());
              setStreamingStepMessages((prev) => {
                const next = new Map(prev);
                next.set(wrapper.run_id, stepMessagesArray);
                return next;
              });
            }
          }
          break;
        }

        case 'RUN_FINISHED': {
          // Emit final state update with completed status
          if (onStateUpdate) {
            const messageContent = state.messageContent.get(wrapper.run_id) || '';
            const stepMessages = Array.from(state.stepMessages.values());
            const toolCalls = Array.from(state.toolCalls.values());

            onStateUpdate({
              runId: wrapper.run_id,
              messageContent,
              stepMessages,
              toolCalls,
              isStreaming: false,
              status: 'completed',
            });
          }

          // FIX: Clear event buffer immediately to prevent memory leak
          state.eventBuffer = [];
          state.nextExpectedSequence = 1;

          // Cleanup after short delay
          setTimeout(() => {
            setStreamingMessages((prev) => {
              const next = new Map(prev);
              next.delete(wrapper.run_id);
              return next;
            });
            setStreamingToolCalls((prev) => {
              const next = new Map(prev);
              next.delete(wrapper.run_id);
              return next;
            });

            // FIX: Clear all maps to prevent memory leaks
            state.messageContent.delete(wrapper.run_id);
            // NOTE: Don't clear stepMessages here - they need to persist for React rendering
            // They'll be cleared on the next RUN_STARTED
            state.currentRunId = null;
            state.currentMessageId = null;
          }, 100);
          break;
        }

        default:
          console.warn('Unknown AGUI event type:', event);
      }
    } catch (error) {
      console.error('Error processing AGUI event:', error);
      // Error handling removed - parent can monitor status field
    }
  };

  // Handle event with sequence ordering
  const handleAguiEvent = (data: string | AguiEventWrapper) => {
    try {
      // Pusher may send data as a string or already-parsed object
      const wrapper: AguiEventWrapper = typeof data === 'string' ? JSON.parse(data) : data;
      const state = stateRef.current;

      // CRITICAL OPTIMIZATION: Process text and tool call events immediately
      // TEXT_MESSAGE_START must be processed immediately to create the step before content arrives
      // TEXT_MESSAGE_CONTENT must be processed immediately for smooth token-by-token streaming
      // TOOL_CALL_* events must be processed immediately to show tool calls in real-time
      // RUN_FINISHED must be processed immediately to re-enable the input without delay
      // We can do this safely because these events are independent and order-insensitive
      const immediateEvents = [
        'TEXT_MESSAGE_START',
        'TEXT_MESSAGE_CONTENT',
        'TEXT_MESSAGE_END',
        'TOOL_CALL_START',
        'TOOL_CALL_ARGS',
        'TOOL_CALL_END',
        'TOOL_CALL_RESULT',
        'RUN_FINISHED', // FIX: Process immediately to re-enable input
      ];

      if (immediateEvents.includes(wrapper.event.type)) {
        processEvent(wrapper);
        // Update sequence tracking - accept any sequence >= current
        if (wrapper.sequence >= state.nextExpectedSequence) {
          state.nextExpectedSequence = wrapper.sequence + 1;
        }
        return;
      }

      // For non-content events, use buffering to ensure correct order
      // Add to buffer
      state.eventBuffer.push(wrapper);
      state.eventBuffer.sort((a, b) => a.sequence - b.sequence);

      // Process events in order
      while (
        state.eventBuffer.length > 0 &&
        state.eventBuffer[0].sequence <= state.nextExpectedSequence
      ) {
        const next = state.eventBuffer.shift()!;
        processEvent(next);
        // Advance to next sequence
        if (next.sequence >= state.nextExpectedSequence) {
          state.nextExpectedSequence = next.sequence + 1;
        }
      }

      // Gap recovery: If we have buffered events but they're ahead of expected sequence
      // This can happen if some events were lost or delayed
      // Wait for a reasonable buffer before skipping (increased to 5 for stability)
      if (state.eventBuffer.length > 5 && state.eventBuffer[0]) {
        const firstBufferedSequence = state.eventBuffer[0].sequence;
        const gap = firstBufferedSequence - state.nextExpectedSequence;

        // Only skip if gap is significant (more than 3 events)
        if (gap > 3) {
          console.warn(
            `Gap detected: waiting for ${state.nextExpectedSequence}, but buffer starts at ${firstBufferedSequence}. Skipping ${gap} events to recover.`
          );

          // Skip ahead to the first available event
          state.nextExpectedSequence = firstBufferedSequence;

          // Process all available events immediately
          while (
            state.eventBuffer.length > 0 &&
            state.eventBuffer[0].sequence === state.nextExpectedSequence
          ) {
            const next = state.eventBuffer.shift()!;
            processEvent(next);
            state.nextExpectedSequence++;
          }
        }
      }

      // Debug log if buffer is growing significantly
      if (state.eventBuffer.length > 10) {
        console.warn(
          `[STREAMING] Event buffer: ${state.eventBuffer.length} events waiting. Next expected: ${state.nextExpectedSequence}`
        );
      }
    } catch (error) {
      console.error('Error handling AGUI event:', error);
      // Error handling removed - parent can monitor status field
    }
  };

  // Handle user messages (non-streaming)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUserMessage = (data: any) => {
    if (import.meta.env.DEV) {
      console.log('[useAguiMessageStream] Received user_message event:', data);
    }

    const parsed = typeof data === 'string' ? JSON.parse(data) : data;

    // Prevent duplicate processing
    if (seenMessageIds.current.has(parsed.id)) {
      return;
    }
    seenMessageIds.current.add(parsed.id);

    // Call parent callback if provided
    if (onUserMessage) {
      onUserMessage(parsed as UserMessageData);
    }
  };

  useEffect(() => {
    if (!channel) {
      return;
    }

    // Bind to AGUI events - all use the same handler
    channel.bind('agent.run_started', handleAguiEvent);
    channel.bind('agent.step_started', handleAguiEvent);
    channel.bind('agent.text_message_start', handleAguiEvent);
    channel.bind('agent.text_message_content', handleAguiEvent);
    channel.bind('agent.text_message_end', handleAguiEvent);
    channel.bind('agent.tool_call_start', handleAguiEvent);
    channel.bind('agent.tool_call_args', handleAguiEvent);
    channel.bind('agent.tool_call_end', handleAguiEvent);
    channel.bind('agent.tool_call_result', handleAguiEvent);
    channel.bind('agent.step_finished', handleAguiEvent);
    channel.bind('agent.run_finished', handleAguiEvent);

    // User messages (non-streaming)
    channel.bind('user_message', handleUserMessage);

    // Cleanup
    return () => {
      channel.unbind('agent.run_started', handleAguiEvent);
      channel.unbind('agent.step_started', handleAguiEvent);
      channel.unbind('agent.text_message_start', handleAguiEvent);
      channel.unbind('agent.text_message_content', handleAguiEvent);
      channel.unbind('agent.text_message_end', handleAguiEvent);
      channel.unbind('agent.tool_call_start', handleAguiEvent);
      channel.unbind('agent.tool_call_args', handleAguiEvent);
      channel.unbind('agent.tool_call_end', handleAguiEvent);
      channel.unbind('agent.tool_call_result', handleAguiEvent);
      channel.unbind('agent.step_finished', handleAguiEvent);
      channel.unbind('agent.run_finished', handleAguiEvent);
      channel.unbind('user_message', handleUserMessage);
    };
  }, [channel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      seenMessageIds.current.clear();
      setStreamingMessages(new Map());
      setStreamingToolCalls(new Map());
      setStreamingStepMessages(new Map());
      stateRef.current = {
        currentRunId: null,
        currentMessageId: null,
        messageContent: new Map(),
        stepMessages: new Map(),
        toolCalls: new Map(),
        toolCallArgs: new Map(),
        eventBuffer: [],
        nextExpectedSequence: 1,
      };
    };
  }, []);

  return {
    streamingMessages,
    streamingToolCalls,
    streamingStepMessages,
    isStreaming: streamingMessages.size > 0 || streamingStepMessages.size > 0,
  };
}
