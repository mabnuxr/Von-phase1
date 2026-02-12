import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Chat } from '../components/Chat';
import type { Message } from '../components/Chat/types';
import type { TimelineStep } from '../components/TimelineThinkingProcess';

const meta = {
  title: 'Organisms/Chat/V2 Event Simulation',
  component: Chat,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'End-to-end simulation of V2 agent event flow through the Chat component. ' +
          'These stories simulate how AGUI events progressively build up timeline steps, ' +
          'stream final responses, handle failures, and respond to user actions like stop.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Chat>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const STEPS: TimelineStep[] = [
  {
    id: 'step-1',
    text: 'Understanding the request',
    status: 'complete',
    type: 'reasoning',
    description: 'Analyzing the user query to determine the best approach.',
  },
  {
    id: 'step-2',
    text: 'Fetching account data from Salesforce',
    status: 'complete',
    type: 'tool_call',
    source: 'salesforce',
    description: 'Querying Salesforce API for account details and related opportunities.',
  },
  {
    id: 'step-3',
    text: 'Analyzing Gong call recordings',
    status: 'complete',
    type: 'tool_call',
    source: 'gong',
    description: 'Searching through recent call recordings for relevant discussion points.',
  },
  {
    id: 'step-4',
    text: 'Cross-referencing email threads',
    status: 'complete',
    type: 'tool_call',
    source: 'email',
    description: 'Scanning email conversations for follow-ups and commitments.',
  },
];

const FINAL_RESPONSE =
  'Based on my analysis of your Salesforce data, Gong recordings, and email threads:\n\n' +
  '**Acme Corp** has $2.4M in pipeline this quarter with 3 deals in negotiation stage. ' +
  'The largest is the Enterprise Platform deal at $850K. VP of Sales expressed strong buying intent ' +
  'during the January 8th call.\n\n' +
  '**Key Risks:**\n' +
  '- Budget approval pending from CFO (mentioned in Jan 12 email)\n' +
  '- Competitor demo scheduled for next week (flagged in Gong)\n\n' +
  '**Recommended Actions:**\n' +
  '1. Schedule executive alignment call before competitor demo\n' +
  '2. Send updated ROI analysis addressing CFO concerns\n' +
  '3. Prepare champion with internal selling materials';

const USER_MESSAGE: Message = {
  id: 'user-1',
  type: 'user',
  content: 'Give me a full pipeline analysis for Acme Corp including risks and next steps',
  timestamp: new Date(Date.now() - 30000),
};

/** Small delay helper */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Successful run: steps → final response streams in
// ---------------------------------------------------------------------------

const SuccessfulRunSimulation = () => {
  const [messages, setMessages] = useState<Message[]>([USER_MESSAGE]);
  const [elapsed, setElapsed] = useState(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const buildAssistant = useCallback(
    (overrides: Partial<Message>): Message => ({
      id: 'assistant-1',
      type: 'assistant',
      content: '',
      runId: 'run_abc123',
      isLatestMessage: true,
      ...overrides,
    }),
    [],
  );

  useEffect(() => {
    const run = async () => {
      // Initial thinking state
      setMessages([
        USER_MESSAGE,
        buildAssistant({ isStreaming: true, status: 'streaming', thinkingElapsedTime: 0 }),
      ]);

      // Step 1: reasoning
      await wait(800);
      if (cancelledRef.current) return;
      setMessages([
        USER_MESSAGE,
        buildAssistant({
          isStreaming: true,
          status: 'streaming',
          timelineSteps: [{ ...STEPS[0], status: 'in-progress' }],
          thinkingElapsedTime: elapsed,
        }),
      ]);

      await wait(1200);
      if (cancelledRef.current) return;

      // Step 2: Salesforce
      setMessages([
        USER_MESSAGE,
        buildAssistant({
          isStreaming: true,
          status: 'streaming',
          timelineSteps: [
            { ...STEPS[0], status: 'complete' },
            { ...STEPS[1], status: 'in-progress' },
          ],
          thinkingElapsedTime: elapsed,
        }),
      ]);

      await wait(1500);
      if (cancelledRef.current) return;

      // Step 3: Gong
      setMessages([
        USER_MESSAGE,
        buildAssistant({
          isStreaming: true,
          status: 'streaming',
          timelineSteps: [
            { ...STEPS[0], status: 'complete' },
            { ...STEPS[1], status: 'complete' },
            { ...STEPS[2], status: 'in-progress' },
          ],
          thinkingElapsedTime: elapsed,
        }),
      ]);

      await wait(1200);
      if (cancelledRef.current) return;

      // Step 4: Email
      setMessages([
        USER_MESSAGE,
        buildAssistant({
          isStreaming: true,
          status: 'streaming',
          timelineSteps: [
            { ...STEPS[0], status: 'complete' },
            { ...STEPS[1], status: 'complete' },
            { ...STEPS[2], status: 'complete' },
            { ...STEPS[3], status: 'in-progress' },
          ],
          thinkingElapsedTime: elapsed,
        }),
      ]);

      await wait(1000);
      if (cancelledRef.current) return;

      // All steps done, stream final response
      const allComplete = STEPS.map((s) => ({ ...s, status: 'complete' as const }));
      for (let i = 0; i < FINAL_RESPONSE.length; i++) {
        if (cancelledRef.current) return;
        await wait(15);
        setMessages([
          USER_MESSAGE,
          buildAssistant({
            isStreaming: true,
            status: 'streaming',
            timelineSteps: allComplete,
            thinkingElapsedTime: elapsed,
            v2FinalResponse: FINAL_RESPONSE.slice(0, i + 1),
            v2FinalResponseStreaming: true,
          }),
        ]);
      }

      // Done
      if (cancelledRef.current) return;
      setMessages([
        USER_MESSAGE,
        buildAssistant({
          isStreaming: false,
          status: 'completed',
          timelineSteps: allComplete,
          thinkingElapsedTime: elapsed,
          v2FinalResponse: FINAL_RESPONSE,
          v2FinalResponseStreaming: false,
        }),
      ]);
    };

    run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Chat
      title="Pipeline Analysis"
      thinkingProcessVersion="v2"
      messages={messages}
      variant="fullpage"
    />
  );
};

/**
 * Full successful V2 run: user message → thinking steps stream in one by one →
 * final response streams character by character → completed state.
 */
export const SuccessfulRun: Story = {
  args: { title: '' },
  render: () => <SuccessfulRunSimulation />,
};

// ---------------------------------------------------------------------------
// Failed run: steps → RUN_FINISHED with failed → error shown, steps preserved
// ---------------------------------------------------------------------------

const FailedRunSimulation = () => {
  const [messages, setMessages] = useState<Message[]>([USER_MESSAGE]);
  const [elapsed, setElapsed] = useState(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const buildAssistant = useCallback(
    (overrides: Partial<Message>): Message => ({
      id: 'assistant-1',
      type: 'assistant',
      content: '',
      runId: 'run_fail456',
      isLatestMessage: true,
      ...overrides,
    }),
    [],
  );

  useEffect(() => {
    const run = async () => {
      // Thinking starts
      setMessages([
        USER_MESSAGE,
        buildAssistant({ isStreaming: true, status: 'streaming', thinkingElapsedTime: 0 }),
      ]);

      // Steps 1 & 2 complete
      await wait(1000);
      if (cancelledRef.current) return;
      setMessages([
        USER_MESSAGE,
        buildAssistant({
          isStreaming: true,
          status: 'streaming',
          timelineSteps: [{ ...STEPS[0], status: 'complete' }],
          thinkingElapsedTime: elapsed,
        }),
      ]);

      await wait(1500);
      if (cancelledRef.current) return;
      setMessages([
        USER_MESSAGE,
        buildAssistant({
          isStreaming: true,
          status: 'streaming',
          timelineSteps: [
            { ...STEPS[0], status: 'complete' },
            { ...STEPS[1], status: 'in-progress' },
          ],
          thinkingElapsedTime: elapsed,
        }),
      ]);

      await wait(2000);
      if (cancelledRef.current) return;

      // Step 3 starts, then fails
      setMessages([
        USER_MESSAGE,
        buildAssistant({
          isStreaming: true,
          status: 'streaming',
          timelineSteps: [
            { ...STEPS[0], status: 'complete' },
            { ...STEPS[1], status: 'complete' },
            { ...STEPS[2], status: 'in-progress' },
          ],
          thinkingElapsedTime: elapsed,
        }),
      ]);

      await wait(1500);
      if (cancelledRef.current) return;

      // RUN_FINISHED with status: "failed"
      setMessages([
        USER_MESSAGE,
        buildAssistant({
          isStreaming: false,
          status: 'failed',
          errorMessage: 'Agent failed to generate the response, please try again.',
          timelineSteps: [
            { ...STEPS[0], status: 'complete' },
            { ...STEPS[1], status: 'complete' },
            { ...STEPS[2], status: 'error' },
          ],
          thinkingElapsedTime: elapsed,
        }),
      ]);
    };

    run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Chat
      title="Pipeline Analysis"
      thinkingProcessVersion="v2"
      messages={messages}
      variant="fullpage"
    />
  );
};

/**
 * Failed V2 run: steps stream in → `RUN_FINISHED` with `status: "failed"` arrives →
 * in-progress step marked as error, error message shown below collapsed thinking process.
 */
export const FailedRun: Story = {
  args: { title: '' },
  render: () => <FailedRunSimulation />,
};

// ---------------------------------------------------------------------------
// Failed run with late events: failure arrives, then more events come in
// ---------------------------------------------------------------------------

const FailedRunWithLateEventsSimulation = () => {
  const [messages, setMessages] = useState<Message[]>([USER_MESSAGE]);
  const [elapsed, setElapsed] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const addLog = (msg: string) => setLog((prev) => [...prev, msg]);

  const buildAssistant = useCallback(
    (overrides: Partial<Message>): Message => ({
      id: 'assistant-1',
      type: 'assistant',
      content: '',
      runId: 'run_late789',
      isLatestMessage: true,
      ...overrides,
    }),
    [],
  );

  useEffect(() => {
    const run = async () => {
      addLog('← RUN_STARTED');

      setMessages([
        USER_MESSAGE,
        buildAssistant({ isStreaming: true, status: 'streaming', thinkingElapsedTime: 0 }),
      ]);

      // Steps 1-2
      addLog('← STEP_STARTED: Understanding the request');
      await wait(1000);
      if (cancelledRef.current) return;
      setMessages([
        USER_MESSAGE,
        buildAssistant({
          isStreaming: true,
          status: 'streaming',
          timelineSteps: [{ ...STEPS[0], status: 'complete' }],
          thinkingElapsedTime: elapsed,
        }),
      ]);

      addLog('← STEP_STARTED: Fetching account data');
      await wait(1200);
      if (cancelledRef.current) return;
      setMessages([
        USER_MESSAGE,
        buildAssistant({
          isStreaming: true,
          status: 'streaming',
          timelineSteps: [
            { ...STEPS[0], status: 'complete' },
            { ...STEPS[1], status: 'in-progress' },
          ],
          thinkingElapsedTime: elapsed,
        }),
      ]);

      await wait(1500);
      if (cancelledRef.current) return;

      // FAILURE
      addLog('← RUN_FINISHED: { status: "failed", error_message: "Agent failed..." }');
      const failedMessages: Message[] = [
        USER_MESSAGE,
        buildAssistant({
          isStreaming: false,
          status: 'failed',
          errorMessage: 'Agent failed to generate the response, please try again.',
          timelineSteps: [
            { ...STEPS[0], status: 'complete' },
            { ...STEPS[1], status: 'error' },
          ],
          thinkingElapsedTime: elapsed,
        }),
      ];
      setMessages(failedMessages);

      // Late events arrive — in the real hook, these are IGNORED via finishedRunsRef.
      // The UI must not change.
      await wait(800);
      if (cancelledRef.current) return;
      addLog('← STEP_STARTED (late): Analyzing Gong calls — IGNORED');
      // Messages stay the same — we don't update

      await wait(600);
      if (cancelledRef.current) return;
      addLog('← TOOL_CALL_START (late): gong_search — IGNORED');

      await wait(500);
      if (cancelledRef.current) return;
      addLog('← STEP_STARTED (late): Cross-referencing emails — IGNORED');

      await wait(400);
      if (cancelledRef.current) return;
      addLog('✓ All late events ignored. Error + thinking process preserved.');
    };

    run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Chat
          title="Pipeline Analysis"
          thinkingProcessVersion="v2"
          messages={messages}
          variant="fullpage"
        />
      </div>
      <div
        style={{
          width: 280,
          padding: 12,
          background: '#f8f9fa',
          fontFamily: 'monospace',
          fontSize: 11,
          lineHeight: 1.6,
          overflow: 'auto',
          borderLeft: '1px solid #e5e7eb',
          flexShrink: 0,
        }}
      >
        <strong style={{ display: 'block', marginBottom: 8 }}>Event log (Pusher):</strong>
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
 * Simulates the real-world bug scenario: `RUN_FINISHED` with `status: "failed"` arrives,
 * but the backend keeps emitting events afterward. The event log shows late events being
 * ignored while the error and thinking process stay visible in the Chat.
 */
export const FailedRunWithLateEvents: Story = {
  args: { title: '' },
  render: () => <FailedRunWithLateEventsSimulation />,
};

// ---------------------------------------------------------------------------
// Stop streaming: user stops mid-response, full text appears at once
// ---------------------------------------------------------------------------

const StopStreamingSimulation = () => {
  const [messages, setMessages] = useState<Message[]>([USER_MESSAGE]);
  const [elapsed, setElapsed] = useState(0);
  const stoppedRef = useRef(false);
  const responseIndexRef = useRef(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const allComplete = STEPS.map((s) => ({ ...s, status: 'complete' as const }));

  useEffect(() => {
    const run = async () => {
      // Quick step sequence
      setMessages([
        USER_MESSAGE,
        {
          id: 'assistant-1',
          type: 'assistant',
          content: '',
          runId: 'run_stop',
          isLatestMessage: true,
          isStreaming: true,
          status: 'streaming',
          thinkingElapsedTime: 0,
        },
      ]);

      for (let i = 0; i < STEPS.length; i++) {
        if (stoppedRef.current || cancelledRef.current) return;
        const steps = STEPS.slice(0, i + 1).map((s, idx) => ({
          ...s,
          status: (idx === i ? 'in-progress' : 'complete') as TimelineStep['status'],
        }));
        setMessages([
          USER_MESSAGE,
          {
            id: 'assistant-1',
            type: 'assistant',
            content: '',
            runId: 'run_stop',
            isLatestMessage: true,
            isStreaming: true,
            status: 'streaming',
            timelineSteps: steps,
            thinkingElapsedTime: elapsed,
          },
        ]);
        await wait(600);
      }

      if (stoppedRef.current || cancelledRef.current) return;

      // Stream final response character by character
      for (let i = 0; i < FINAL_RESPONSE.length; i++) {
        if (stoppedRef.current || cancelledRef.current) return;
        responseIndexRef.current = i;
        await wait(20);
        setMessages([
          USER_MESSAGE,
          {
            id: 'assistant-1',
            type: 'assistant',
            content: '',
            runId: 'run_stop',
            isLatestMessage: true,
            isStreaming: true,
            status: 'streaming',
            timelineSteps: allComplete,
            thinkingElapsedTime: elapsed,
            v2FinalResponse: FINAL_RESPONSE.slice(0, i + 1),
            v2FinalResponseStreaming: true,
          },
        ]);
      }

      if (stoppedRef.current || cancelledRef.current) return;
      setMessages([
        USER_MESSAGE,
        {
          id: 'assistant-1',
          type: 'assistant',
          content: '',
          runId: 'run_stop',
          isLatestMessage: true,
          isStreaming: false,
          status: 'completed',
          timelineSteps: allComplete,
          thinkingElapsedTime: elapsed,
          v2FinalResponse: FINAL_RESPONSE,
          v2FinalResponseStreaming: false,
        },
      ]);
    };

    run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStop = () => {
    // Simulates markStopped: immediately push full text, stop animation
    stoppedRef.current = true;
    setMessages([
      USER_MESSAGE,
      {
        id: 'assistant-1',
        type: 'assistant',
        content: '',
        runId: 'run_stop',
        isLatestMessage: true,
        isStreaming: false,
        status: 'completed',
        stoppedByUser: true,
        timelineSteps: allComplete,
        thinkingElapsedTime: elapsed,
        v2FinalResponse: FINAL_RESPONSE,
        v2FinalResponseStreaming: false,
      },
    ]);
  };

  return (
    <Chat
      title="Pipeline Analysis"
      thinkingProcessVersion="v2"
      messages={messages}
      variant="fullpage"
      onStopStreaming={handleStop}
    />
  );
};

/**
 * Stop streaming simulation: steps complete → text streams character by character →
 * user clicks "Stop" → full response appears instantly with no further animation.
 * Uses `onStopStreaming` prop which maps to `markStopped()` in the real hook.
 */
export const StopStreaming: Story = {
  args: { title: '' },
  render: () => <StopStreamingSimulation />,
};

// ---------------------------------------------------------------------------
// Timeout fallback: streaming gets stuck, then timeout error appears
// ---------------------------------------------------------------------------

const TimeoutFallbackSimulation = () => {
  const [messages, setMessages] = useState<Message[]>([USER_MESSAGE]);
  const [elapsed, setElapsed] = useState(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const run = async () => {
      // Thinking starts
      setMessages([
        USER_MESSAGE,
        {
          id: 'assistant-1',
          type: 'assistant',
          content: '',
          runId: 'run_timeout',
          isLatestMessage: true,
          isStreaming: true,
          status: 'streaming',
          thinkingElapsedTime: 0,
        },
      ]);

      // One step arrives
      await wait(1000);
      if (cancelledRef.current) return;
      setMessages([
        USER_MESSAGE,
        {
          id: 'assistant-1',
          type: 'assistant',
          content: '',
          runId: 'run_timeout',
          isLatestMessage: true,
          isStreaming: true,
          status: 'streaming',
          timelineSteps: [{ ...STEPS[0], status: 'in-progress' }],
          thinkingElapsedTime: elapsed,
        },
      ]);

      // Stuck — no more events arrive for a long time
      // In production, useStreamTimeout fires after STREAM_TIMEOUT_MS
      // Here we simulate with a shorter delay
      await wait(4000);
      if (cancelledRef.current) return;

      // Timeout fires: markMessageTimeout → status: "timeout"
      setMessages([
        USER_MESSAGE,
        {
          id: 'assistant-1',
          type: 'assistant',
          content: '',
          runId: 'run_timeout',
          isLatestMessage: true,
          isStreaming: false,
          status: 'timeout',
          timelineSteps: [{ ...STEPS[0], status: 'error' }],
          thinkingElapsedTime: elapsed,
        },
      ]);
    };

    run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Chat
      title="Pipeline Analysis"
      thinkingProcessVersion="v2"
      messages={messages}
      variant="fullpage"
    />
  );
};

/**
 * Timeout fallback simulation: thinking starts → one step arrives → no more events →
 * after a delay, `useStreamTimeout` fires and sets `status: "timeout"` with an error.
 * Demonstrates the graceful fallback for stuck streaming.
 */
export const TimeoutFallback: Story = {
  args: { title: '' },
  render: () => <TimeoutFallbackSimulation />,
};

// ---------------------------------------------------------------------------
// Page refresh: completed/failed runs rendered from persisted events
// ---------------------------------------------------------------------------

/**
 * After a page refresh, a failed run is reconstructed from persisted data.
 * The thinking process is collapsed with steps, and the error shows below.
 * This is a static story (no animation) simulating the post-refresh state.
 */
export const PageRefreshFailedRun: Story = {
  args: {
    title: 'Pipeline Analysis',
    thinkingProcessVersion: 'v2',
    variant: 'fullpage',
    messages: [
      USER_MESSAGE,
      {
        id: 'assistant-1',
        type: 'assistant',
        content: '',
        runId: 'run_persisted',
        isLatestMessage: true,
        isStreaming: false,
        status: 'failed',
        errorMessage: 'Agent failed to generate the response, please try again.',
        timelineSteps: [
          { ...STEPS[0], status: 'complete' },
          { ...STEPS[1], status: 'complete' },
          { ...STEPS[2], status: 'error' },
        ],
        thinkingElapsedTime: 12,
      },
    ],
  },
};

/**
 * After a page refresh, a successful run is reconstructed from persisted data.
 * Steps are collapsed, final response is shown below.
 */
export const PageRefreshSuccessfulRun: Story = {
  args: {
    title: 'Pipeline Analysis',
    thinkingProcessVersion: 'v2',
    variant: 'fullpage',
    messages: [
      USER_MESSAGE,
      {
        id: 'assistant-1',
        type: 'assistant',
        content: '',
        runId: 'run_persisted_ok',
        isLatestMessage: true,
        isStreaming: false,
        status: 'completed',
        timelineSteps: STEPS.map((s) => ({ ...s, status: 'complete' as const })),
        thinkingElapsedTime: 18,
        v2FinalResponse: FINAL_RESPONSE,
        v2FinalResponseStreaming: false,
      },
    ],
  },
};
