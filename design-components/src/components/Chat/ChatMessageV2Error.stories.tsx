import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import type { TimelineStep } from '../TimelineThinkingProcess';

const meta = {
  title: 'Components/ChatMessage/V2 Error States',
  component: ChatMessage,
  parameters: {
    layout: 'padded',
    componentSubtitle:
      'V2 agent error handling — thinking process preserved alongside error messages',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Shared step data
// ---------------------------------------------------------------------------

const thinkingSteps: TimelineStep[] = [
  {
    id: '1',
    text: 'Understanding the request',
    status: 'complete',
    type: 'reasoning',
    description: 'Analyzing the user query to understand what information is needed.',
  },
  {
    id: '2',
    text: 'Fetching account data from Salesforce',
    status: 'complete',
    type: 'tool_call',
    source: 'salesforce',
    description: 'Querying Salesforce API to retrieve account details and related opportunities.',
  },
  {
    id: '3',
    text: 'Analyzing Gong call recordings',
    status: 'complete',
    type: 'tool_call',
    source: 'gong',
    description: 'Searching through recent call recordings for relevant discussions.',
  },
];

const errorSteps: TimelineStep[] = thinkingSteps.map((step) => ({
  ...step,
  status: 'error' as const,
}));

const mixedSteps: TimelineStep[] = [
  { ...thinkingSteps[0], status: 'complete' as const },
  { ...thinkingSteps[1], status: 'complete' as const },
  { ...thinkingSteps[2], status: 'error' as const },
];

// ---------------------------------------------------------------------------
// Stories: Static states
// ---------------------------------------------------------------------------

/**
 * When a V2 agent run fails (`RUN_FINISHED` with `status: "failed"`),
 * the thinking process is shown collapsed above the error message.
 * All in-progress steps are marked as "error".
 */
export const FailedRunWithThinkingProcess: Story = {
  args: {
    type: 'assistant',
    content: '',
    thinkingProcessVersion: 'v2',
    timelineSteps: errorSteps,
    thinkingElapsedTime: 8,
    status: 'failed',
    errorMessage: 'Agent failed to generate the response, please try again.',
    isStreaming: false,
  },
};

/**
 * Some steps completed successfully before the failure occurred.
 * The error status is only on the step that was in-progress when the run failed.
 */
export const PartialSuccessThenFailure: Story = {
  args: {
    type: 'assistant',
    content: '',
    thinkingProcessVersion: 'v2',
    timelineSteps: mixedSteps,
    thinkingElapsedTime: 12,
    status: 'failed',
    errorMessage: 'Agent failed to generate the response, please try again.',
    isStreaming: false,
  },
};

/**
 * V1 messages with errors still replace the entire content (original behavior).
 */
export const V1ErrorBehaviorUnchanged: Story = {
  args: {
    type: 'assistant',
    content: 'This content should not be visible.',
    thinkingProcessVersion: 'v1',
    status: 'failed',
    errorMessage: 'An error occurred while generating the response.',
    isStreaming: false,
  },
};

/**
 * A successful V2 run for comparison — no error, final response shown.
 */
export const SuccessfulV2Run: Story = {
  args: {
    type: 'assistant',
    content: '',
    thinkingProcessVersion: 'v2',
    timelineSteps: thinkingSteps.map((s) => ({ ...s, status: 'complete' as const })),
    thinkingElapsedTime: 15,
    v2FinalResponse:
      'Based on my analysis, Acme Corp has $2.4M in pipeline this quarter with 3 deals in negotiation stage.',
    status: 'completed',
    isStreaming: false,
  },
};

/**
 * After page refresh, persisted events reconstruct both timeline steps and the error.
 * This simulates what the user sees after refreshing during a failed run.
 */
export const PersistedFailedRun: Story = {
  args: {
    type: 'assistant',
    content: '',
    thinkingProcessVersion: 'v2',
    timelineSteps: mixedSteps,
    thinkingElapsedTime: 10,
    status: 'failed',
    errorMessage: 'Agent failed to generate the response, please try again.',
    isStreaming: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Simulates a page refresh scenario: the error and thinking steps are reconstructed from persisted AGUI events. The timeline auto-collapses and the error is shown below.',
      },
    },
  },
};

/**
 * When the user stops streaming, the full text block appears at once
 * (no streaming animation). `stoppedByUser` is true, `isStreaming` is false.
 */
export const StoppedByUser: Story = {
  args: {
    type: 'assistant',
    content: '',
    thinkingProcessVersion: 'v2',
    timelineSteps: thinkingSteps.map((s) => ({ ...s, status: 'complete' as const })),
    thinkingElapsedTime: 7,
    v2FinalResponse:
      'Here is the partial analysis before the user stopped: Acme Corp pipeline looks strong with...',
    status: 'completed',
    stoppedByUser: true,
    isStreaming: false,
  },
};

// ---------------------------------------------------------------------------
// Interactive: Simulated failed run
// ---------------------------------------------------------------------------

const SimulatedFailedRun = () => {
  const [steps, setSteps] = useState<TimelineStep[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [isThinking, setIsThinking] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<'streaming' | 'failed'>('streaming');

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const sequence = async () => {
      // Step 1: reasoning
      setSteps([{ ...thinkingSteps[0], status: 'in-progress' }]);
      await new Promise((r) => setTimeout(r, 1500));
      setSteps([{ ...thinkingSteps[0], status: 'complete' }]);

      // Step 2: Salesforce call
      setSteps((prev) => [...prev, { ...thinkingSteps[1], status: 'in-progress' }]);
      await new Promise((r) => setTimeout(r, 2000));
      setSteps((prev) =>
        prev.map((s) => (s.id === '2' ? { ...s, status: 'complete' as const } : s))
      );

      // Step 3: Gong call — fails mid-execution
      setSteps((prev) => [...prev, { ...thinkingSteps[2], status: 'in-progress' }]);
      await new Promise((r) => setTimeout(r, 1500));

      // RUN_FINISHED with status: "failed" arrives
      setSteps((prev) =>
        prev.map((s) => (s.status === 'in-progress' ? { ...s, status: 'error' as const } : s))
      );
      setIsThinking(false);
      setStatus('failed');
      setErrorMessage('Agent failed to generate the response, please try again.');
    };

    sequence();
  }, []);

  return (
    <ChatMessage
      type="assistant"
      content=""
      thinkingProcessVersion="v2"
      timelineSteps={steps}
      thinkingElapsedTime={elapsed}
      isStreaming={isThinking}
      status={status}
      errorMessage={errorMessage}
    />
  );
};

/**
 * Interactive simulation of a V2 run that starts thinking,
 * completes some steps, then receives `RUN_FINISHED` with `status: "failed"`.
 * The thinking process stays visible and the error appears below it.
 */
export const SimulatedFailure: Story = {
  args: {
    type: 'assistant',
    content: '',
    thinkingProcessVersion: 'v2',
  },
  render: () => <SimulatedFailedRun />,
};

// ---------------------------------------------------------------------------
// Interactive: Simulated stop streaming
// ---------------------------------------------------------------------------

const SimulatedStopStreaming = () => {
  const [steps, setSteps] = useState<TimelineStep[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [isThinking, setIsThinking] = useState(true);
  const [finalResponse, setFinalResponse] = useState('');
  const [isStopped, setIsStopped] = useState(false);
  const stoppedRef = useRef(false);

  const fullResponse =
    'Based on my analysis of your Salesforce data and recent Gong calls, Acme Corp has $2.4M in pipeline this quarter. Three deals are currently in the negotiation stage, with the largest being the Enterprise Platform deal at $850K. The VP of Sales at Acme expressed strong buying intent during the last call on January 8th.';

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const sequence = async () => {
      // Steps complete quickly
      for (let i = 0; i < thinkingSteps.length; i++) {
        if (stoppedRef.current) return;
        setSteps((prev) => [
          ...prev.map((s) => ({ ...s, status: 'complete' as const })),
          { ...thinkingSteps[i], status: 'in-progress' as const },
        ]);
        await new Promise((r) => setTimeout(r, 800));
        if (stoppedRef.current) return;
        setSteps((prev) => prev.map((s) => ({ ...s, status: 'complete' as const })));
      }

      // Start streaming final response character by character
      for (let i = 0; i < fullResponse.length; i++) {
        if (stoppedRef.current) return;
        await new Promise((r) => setTimeout(r, 30));
        if (stoppedRef.current) return;
        setFinalResponse(fullResponse.slice(0, i + 1));
      }

      setIsThinking(false);
    };

    sequence();
  }, []);

  const handleStop = () => {
    // Simulates markStopped() — immediately push full text, stop animation.
    // stoppedRef breaks the async loop so no further partial writes occur.
    stoppedRef.current = true;
    setIsStopped(true);
    setIsThinking(false);
    setFinalResponse(fullResponse);
    setSteps((prev) => prev.map((s) => ({ ...s, status: 'complete' as const })));
  };

  return (
    <div>
      {isThinking && !isStopped && (
        <button
          onClick={handleStop}
          style={{
            marginBottom: 16,
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            background: '#fff',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Stop streaming
        </button>
      )}
      <ChatMessage
        type="assistant"
        content=""
        thinkingProcessVersion="v2"
        timelineSteps={steps}
        thinkingElapsedTime={elapsed}
        isStreaming={isThinking && !isStopped}
        v2FinalResponse={finalResponse}
        status={isStopped ? 'completed' : 'streaming'}
        stoppedByUser={isStopped}
      />
    </div>
  );
};

/**
 * Interactive simulation of stop streaming.
 * Click "Stop streaming" while text is appearing — the full block should
 * render instantly with no further animation.
 */
export const SimulatedStopStreaming_: Story = {
  name: 'Simulated Stop Streaming',
  args: {
    type: 'assistant',
    content: '',
    thinkingProcessVersion: 'v2',
  },
  render: () => <SimulatedStopStreaming />,
};

// ---------------------------------------------------------------------------
// Interactive: Simulated failure with late events arriving after RUN_FINISHED
// ---------------------------------------------------------------------------

const SimulatedFailureWithLateEventsRender = () => {
  const [steps, setSteps] = useState<TimelineStep[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [isThinking, setIsThinking] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<'streaming' | 'failed'>('streaming');
  const [log, setLog] = useState<string[]>([]);
  const cancelledRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      clearInterval(timer);
      cancelledRef.current = true;
    };
  }, []);

  useEffect(() => {
    const sequence = async () => {
      const addLog = (msg: string) => setLog((prev) => [...prev, msg]);

      // Step 1: reasoning
      addLog('← STEP_STARTED: Understanding the request');
      setSteps([{ ...thinkingSteps[0], status: 'in-progress' }]);
      await new Promise((r) => setTimeout(r, 1200));
      if (cancelledRef.current) return;
      setSteps([{ ...thinkingSteps[0], status: 'complete' }]);

      // Step 2: Salesforce call
      addLog('← STEP_STARTED: Fetching account data');
      setSteps((prev) => [...prev, { ...thinkingSteps[1], status: 'in-progress' }]);
      await new Promise((r) => setTimeout(r, 1500));
      if (cancelledRef.current) return;
      setSteps((prev) =>
        prev.map((s) => (s.id === '2' ? { ...s, status: 'complete' as const } : s))
      );

      // Step 3: Gong call — in progress when failure arrives
      addLog('← STEP_STARTED: Analyzing Gong calls');
      setSteps((prev) => [...prev, { ...thinkingSteps[2], status: 'in-progress' }]);
      await new Promise((r) => setTimeout(r, 1500));
      if (cancelledRef.current) return;

      // RUN_FINISHED with status: "failed"
      addLog('← RUN_FINISHED: { status: "failed", error_message: "Agent failed..." }');
      setSteps((prev) =>
        prev.map((s) => (s.status === 'in-progress' ? { ...s, status: 'error' as const } : s))
      );
      setIsThinking(false);
      setStatus('failed');
      setErrorMessage('Agent failed to generate the response, please try again.');

      // Late events keep arriving (backend doesn't stop immediately)
      // These should be IGNORED — the error and thinking process must stay visible
      await new Promise((r) => setTimeout(r, 800));
      if (cancelledRef.current) return;
      addLog('← STEP_STARTED (late): Querying HubSpot — IGNORED by V2 hook');
      await new Promise((r) => setTimeout(r, 600));
      if (cancelledRef.current) return;
      addLog('← TOOL_CALL_START (late): hubspot_search — IGNORED');
      await new Promise((r) => setTimeout(r, 500));
      if (cancelledRef.current) return;
      addLog('← TOOL_CALL_ARGS (late): { query: "..." } — IGNORED');
      await new Promise((r) => setTimeout(r, 400));
      if (cancelledRef.current) return;
      addLog('← STEP_STARTED (late): Summarizing — IGNORED');
      await new Promise((r) => setTimeout(r, 300));
      if (cancelledRef.current) return;
      addLog('✓ All late events ignored. Error + thinking process preserved.');
    };

    sequence();
  }, []);

  return (
    <div>
      <ChatMessage
        type="assistant"
        content=""
        thinkingProcessVersion="v2"
        timelineSteps={steps}
        thinkingElapsedTime={elapsed}
        isStreaming={isThinking}
        status={status}
        errorMessage={errorMessage}
      />
      <div
        style={{
          marginTop: 24,
          padding: 12,
          background: '#f8f9fa',
          borderRadius: 8,
          fontFamily: 'monospace',
          fontSize: 12,
          lineHeight: 1.6,
          maxHeight: 200,
          overflow: 'auto',
        }}
      >
        <strong>Event log:</strong>
        {log.map((entry, i) => (
          <div key={i} style={{ color: entry.includes('IGNORED') ? '#9ca3af' : '#374151' }}>
            {entry}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Simulates the real-world scenario where `RUN_FINISHED` with `status: "failed"`
 * arrives, but the backend keeps emitting events (steps, tool calls) afterward.
 *
 * The V2 hook adds the run to `finishedRunsRef` and ignores late events.
 * The error message and thinking process must remain visible throughout.
 */
export const SimulatedFailureWithLateEvents: Story = {
  name: 'Simulated Failure + Late Events',
  args: {
    type: 'assistant',
    content: '',
    thinkingProcessVersion: 'v2',
  },
  render: () => <SimulatedFailureWithLateEventsRender />,
};

// ---------------------------------------------------------------------------
// Interactive: Simulated failure during text streaming
// ---------------------------------------------------------------------------

const SimulatedFailureDuringTextStreamingRender = () => {
  const [steps, setSteps] = useState<TimelineStep[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [isThinking, setIsThinking] = useState(true);
  const [finalResponse, setFinalResponse] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<'streaming' | 'failed'>('streaming');
  const cancelledRef = useRef(false);

  const partialResponse =
    'Based on my analysis of your Salesforce data and recent Gong calls, Acme Corp has $2.4M in pipeline this quarter. Three deals are currently in the negoti';

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      clearInterval(timer);
      cancelledRef.current = true;
    };
  }, []);

  useEffect(() => {
    const sequence = async () => {
      // Complete all steps quickly
      for (let i = 0; i < thinkingSteps.length; i++) {
        setSteps((prev) => [
          ...prev.map((s) => ({ ...s, status: 'complete' as const })),
          { ...thinkingSteps[i], status: 'in-progress' as const },
        ]);
        await new Promise((r) => setTimeout(r, 700));
        if (cancelledRef.current) return;
        setSteps((prev) => prev.map((s) => ({ ...s, status: 'complete' as const })));
      }

      // Start streaming final response character by character
      for (let i = 0; i < partialResponse.length; i++) {
        if (cancelledRef.current) return;
        await new Promise((r) => setTimeout(r, 25));
        setFinalResponse(partialResponse.slice(0, i + 1));
      }

      if (cancelledRef.current) return;

      // RUN_FINISHED with status: "failed" arrives mid-stream
      // Text streaming stops, error replaces the partial response, steps preserved
      setFinalResponse('');
      setIsThinking(false);
      setStatus('failed');
      setErrorMessage('Agent failed to generate the response, please try again.');
    };

    sequence();
  }, []);

  return (
    <ChatMessage
      type="assistant"
      content=""
      thinkingProcessVersion="v2"
      timelineSteps={steps}
      thinkingElapsedTime={elapsed}
      isStreaming={isThinking}
      v2FinalResponse={finalResponse}
      status={status}
      errorMessage={errorMessage}
    />
  );
};

/**
 * Simulates a failure arriving while the final response text is actively streaming.
 * Steps complete → text starts streaming character by character → `RUN_FINISHED`
 * with `status: "failed"` arrives mid-text → partial text is cleared, error shown,
 * thinking process steps preserved (collapsed).
 */
export const SimulatedFailureDuringTextStreaming: Story = {
  name: 'Simulated Failure During Text Streaming',
  args: {
    type: 'assistant',
    content: '',
    thinkingProcessVersion: 'v2',
  },
  render: () => <SimulatedFailureDuringTextStreamingRender />,
};
