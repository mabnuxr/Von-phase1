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
} from '../types';

export interface MessageStreamEvents {
  onMessageStart?: (messageId: string) => void;
  onMessageChunk?: (messageId: string, chunk: string) => void;
  onMessageComplete?: (
    messageId: string,
    fullContent: string,
    toolCalls?: ToolCall[],
    stepMessages?: StepMessage[]
  ) => void;
  onMessageReceived?: (messageId: string, content: string, role: 'user' | 'assistant') => void;
  onToolCallStart?: (messageId: string, toolCall: ToolCall) => void;
  onToolCallComplete?: (messageId: string, toolCallId: string, result: ToolResult) => void;
  onError?: (error: Error) => void;
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
 */
export function useAguiMessageStream(channel: Channel | null, events: MessageStreamEvents = {}) {
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

  const eventsRef = useRef(events);
  const seenMessageIds = useRef<Set<string>>(new Set());

  // Update refs when events change
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

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
          // Initialize new run - this creates THE ONE message for this entire run
          state.currentRunId = wrapper.run_id;
          state.messageContent.set(wrapper.run_id, ''); // Main message content

          // Clear step messages from previous run
          state.stepMessages.clear();

          // Create the assistant message in the UI with run_id
          eventsRef.current.onMessageStart?.(wrapper.run_id);
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

          // Accumulate in the step message content
          const currentStepContent = state.messageContent.get(e.message_id) || '';
          const newStepContent = currentStepContent + e.delta;
          state.messageContent.set(e.message_id, newStepContent);

          // Update step message object
          const stepMsg = state.stepMessages.get(e.message_id);
          if (stepMsg) {
            stepMsg.content = newStepContent;
          }

          // CRITICAL: Also accumulate under the run_id for the UI to access
          const currentRunContent = state.messageContent.get(wrapper.run_id) || '';
          state.messageContent.set(wrapper.run_id, currentRunContent + e.delta);

          // Use flushSync to force immediate synchronous updates for smooth streaming
          flushSync(() => {
            // Send the chunk to the RUN (not the individual message block)
            // The parent will render this in the appropriate place
            eventsRef.current.onMessageChunk?.(state.currentRunId!, e.delta);

            // Update streaming state
            setStreamingMessages(new Map(state.messageContent));

            // Update streaming step messages
            const stepMessagesArray = Array.from(state.stepMessages.values());
            setStreamingStepMessages((prev) => {
              const next = new Map(prev);
              next.set(wrapper.run_id, stepMessagesArray);
              return next;
            });
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

          eventsRef.current.onToolCallStart?.(wrapper.run_id, toolCall);
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

              if (parsedResult) {
                eventsRef.current.onToolCallComplete?.(
                  wrapper.run_id,
                  e.tool_call_id,
                  parsedResult
                );
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
          // Finalize the run
          const finalContent = state.messageContent.get(wrapper.run_id) || '';
          const finalToolCalls = Array.from(state.toolCalls.values()).filter(
            (tc) => tc.parentMessageId === state.currentMessageId
          );
          const finalStepMessages = Array.from(state.stepMessages.values());

          eventsRef.current.onMessageComplete?.(
            wrapper.run_id,
            finalContent,
            finalToolCalls.length > 0 ? finalToolCalls : undefined,
            finalStepMessages.length > 0 ? finalStepMessages : undefined
          );

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
            // NOTE: Don't delete stepMessages from React state - they need to persist
            // for the final render. They'll be replaced on next RUN_STARTED.
            // setStreamingStepMessages((prev) => {
            //   const next = new Map(prev);
            //   next.delete(wrapper.run_id);
            //   return next;
            // });

            // FIX: Clear all maps to prevent memory leaks
            state.messageContent.delete(wrapper.run_id);
            state.toolCallArgs.clear(); // Clear accumulated args
            state.toolCalls.clear(); // Clear tool calls map
            // NOTE: Don't clear stepMessages here - they need to persist for React rendering
            // They'll be cleared on the next RUN_STARTED
            state.currentRunId = null;
            state.currentMessageId = null;
          }, 100);
          break;
        }

        case 'STEP_STARTED':
        case 'STEP_FINISHED':
          // These are informational - we don't need to act on them
          break;

        default:
          console.warn('Unknown AGUI event type:', event);
      }
    } catch (error) {
      console.error('Error processing AGUI event:', error);
      eventsRef.current.onError?.(error as Error);
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
      eventsRef.current.onError?.(error as Error);
    }
  };

  // Handle user messages (non-streaming)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUserMessage = (data: any) => {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    const { id, messageContent, content, role } = parsed;
    const messageText = messageContent || content || '';

    // Prevent duplicate processing
    if (seenMessageIds.current.has(id)) {
      return;
    }
    seenMessageIds.current.add(id);

    eventsRef.current.onMessageReceived?.(id, messageText, role as 'user' | 'assistant');
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

    // Error handling
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    channel.bind('error', (data: any) => {
      eventsRef.current.onError?.(new Error(data.error || 'Unknown error'));
    });

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
      channel.unbind('error');
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
