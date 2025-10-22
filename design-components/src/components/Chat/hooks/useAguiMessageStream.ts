import { useEffect, useRef, useState } from 'react';
import type { Channel } from 'pusher-js';
import type {
  AguiEventWrapper,
  ToolCall,
  ToolResult,
  TableData,
  QueryInfo,
  MetricData,
  TextMessageStartEvent,
  TextMessageContentEvent,
  ToolCallStartEvent,
  ToolCallArgsEvent,
  ToolCallResultEvent,
} from '../types';

export interface MessageStreamEvents {
  onMessageStart?: (messageId: string) => void;
  onMessageChunk?: (messageId: string, chunk: string) => void;
  onMessageComplete?: (messageId: string, fullContent: string, toolCalls?: ToolCall[]) => void;
  onMessageReceived?: (messageId: string, content: string, role: 'user' | 'assistant') => void;
  onToolCallStart?: (messageId: string, toolCall: ToolCall) => void;
  onToolCallComplete?: (messageId: string, toolCallId: string, result: ToolResult) => void;
  onError?: (error: Error) => void;
}

interface StreamingState {
  currentRunId: string | null;
  currentMessageId: string | null;
  messageContent: Map<string, string>; // messageId -> accumulated content
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

  const stateRef = useRef<StreamingState>({
    currentRunId: null,
    currentMessageId: null,
    messageContent: new Map(),
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
  const parseToolResult = (resultJson: any): ToolResult => {
    try {
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

      // Detect query information
      if (resultJson.queries && Array.isArray(resultJson.queries)) {
        return {
          raw: resultJson,
          type: 'query',
          queries: resultJson.queries,
        };
      }

      // Detect metrics/counts
      if (
        resultJson.row_count !== undefined ||
        resultJson.value_count !== undefined ||
        resultJson.values
      ) {
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

        // Extract from values array if present
        if (resultJson.values && Array.isArray(resultJson.values)) {
          resultJson.values.slice(0, 5).forEach((item: any) => {
            metrics.push({
              label: String(item.value),
              value: item.count,
              type: 'count',
            });
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
          // Initialize new run/message
          state.currentRunId = wrapper.run_id;
          state.messageContent.set(wrapper.run_id, '');
          eventsRef.current.onMessageStart?.(wrapper.run_id);
          break;
        }

        case 'TEXT_MESSAGE_START': {
          const e = event as TextMessageStartEvent;
          state.currentMessageId = e.message_id;
          // Initialize content for this specific message block
          if (!state.messageContent.has(e.message_id)) {
            state.messageContent.set(e.message_id, '');
          }
          break;
        }

        case 'TEXT_MESSAGE_CONTENT': {
          const e = event as TextMessageContentEvent;
          const messageId = e.message_id;

          // Accumulate delta
          const current = state.messageContent.get(messageId) || '';
          const updated = current + e.delta;
          state.messageContent.set(messageId, updated);

          // Update streaming state
          setStreamingMessages(new Map(state.messageContent));

          eventsRef.current.onMessageChunk?.(messageId, e.delta);
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
          };

          state.toolCalls.set(e.tool_call_id, toolCall);
          state.toolCallArgs.set(e.tool_call_id, '');

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

            toolCall.status = 'running';
            state.toolCalls.set(e.tool_call_id, toolCall);

            // Update streaming tool calls
            const runToolCalls = Array.from(state.toolCalls.values()).filter(
              (tc) => tc.parentMessageId === toolCall.parentMessageId,
            );
            setStreamingToolCalls((prev) => {
              const next = new Map(prev);
              next.set(wrapper.run_id, runToolCalls);
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

              toolCall.result = parsedResult;
              toolCall.status = parsedResult ? 'success' : 'error';

              state.toolCalls.set(e.tool_call_id, toolCall);

              // Update streaming tool calls
              const runToolCalls = Array.from(state.toolCalls.values()).filter(
                (tc) => tc.parentMessageId === toolCall.parentMessageId,
              );
              setStreamingToolCalls((prev) => {
                const next = new Map(prev);
                next.set(wrapper.run_id, runToolCalls);
                return next;
              });

              eventsRef.current.onToolCallComplete?.(
                wrapper.run_id,
                e.tool_call_id,
                parsedResult,
              );
            } catch (error) {
              console.error('Error parsing tool result:', error);
              toolCall.status = 'error';
              state.toolCalls.set(e.tool_call_id, toolCall);
            }
          }
          break;
        }

        case 'RUN_FINISHED': {
          // Finalize the run
          const finalContent = state.messageContent.get(wrapper.run_id) || '';
          const finalToolCalls = Array.from(state.toolCalls.values()).filter(
            (tc) => tc.parentMessageId === state.currentMessageId,
          );

          eventsRef.current.onMessageComplete?.(
            wrapper.run_id,
            finalContent,
            finalToolCalls.length > 0 ? finalToolCalls : undefined,
          );

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

            // Clean up state
            state.messageContent.delete(wrapper.run_id);
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
  const handleAguiEvent = (data: string) => {
    try {
      const wrapper: AguiEventWrapper = JSON.parse(data);
      const state = stateRef.current;

      // Add to buffer
      state.eventBuffer.push(wrapper);
      state.eventBuffer.sort((a, b) => a.sequence - b.sequence);

      // Process events in order
      while (
        state.eventBuffer.length > 0 &&
        state.eventBuffer[0].sequence === state.nextExpectedSequence
      ) {
        const next = state.eventBuffer.shift()!;
        processEvent(next);
        state.nextExpectedSequence++;
      }

      // Warn if buffer is growing (possible missing events)
      if (state.eventBuffer.length > 10) {
        console.warn(
          `Event buffer growing: ${state.eventBuffer.length} events waiting. Next expected: ${state.nextExpectedSequence}`,
        );
      }
    } catch (error) {
      console.error('Error handling AGUI event:', error);
      eventsRef.current.onError?.(error as Error);
    }
  };

  // Handle user messages (non-streaming)
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
      stateRef.current = {
        currentRunId: null,
        currentMessageId: null,
        messageContent: new Map(),
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
    isStreaming: streamingMessages.size > 0 || streamingToolCalls.size > 0,
  };
}
