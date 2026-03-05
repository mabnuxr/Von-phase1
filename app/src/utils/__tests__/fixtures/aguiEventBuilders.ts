/**
 * AGUI event fixture builders for testing transformAguiToTimelineSteps.
 *
 * Each builder produces a minimal valid AguiEventWrapper.
 * Use `seq()` to auto-increment sequence numbers and `buildEvents()`
 * to assemble a complete event stream from ordered builder calls.
 */

import type { AguiEventWrapper } from "@vonlabs/design-components";

const DEFAULT_RUN_ID = "run-test-001";
const DEFAULT_THREAD_ID = "thread-test-001";
const DEFAULT_TIMESTAMP_BASE = "2024-01-01T00:00:00.000Z";

function ts(offsetMs: number): string {
  return new Date(
    new Date(DEFAULT_TIMESTAMP_BASE).getTime() + offsetMs,
  ).toISOString();
}

const defaultMeta = {
  backend: "test",
  version: "1.0",
  sequence_info: { total_events: 0, run_start_time: DEFAULT_TIMESTAMP_BASE },
};

/** Create a single AguiEventWrapper */
function wrap(
  sequence: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: Record<string, any>,
  overrides?: Partial<AguiEventWrapper>,
): AguiEventWrapper {
  return {
    sequence,
    timestamp: ts(sequence * 100),
    run_id: DEFAULT_RUN_ID,
    thread_id: DEFAULT_THREAD_ID,
    event: event as AguiEventWrapper["event"],
    meta: defaultMeta as AguiEventWrapper["meta"],
    ...overrides,
  };
}

// ── Event Builders ──

export function runStarted(seq: number, runId?: string): AguiEventWrapper {
  return wrap(seq, { type: "RUN_STARTED" }, runId ? { run_id: runId } : {});
}

export function stepStarted(
  seq: number,
  stepNumber: number,
  stepName: string,
  opts?: { category?: string },
): AguiEventWrapper {
  return wrap(seq, {
    type: "STEP_STARTED",
    step_number: stepNumber,
    step_name: stepName,
    ...(opts?.category ? { metadata: { category: opts.category } } : {}),
  });
}

export function stepFinished(
  seq: number,
  stepNumber: number,
  stepName: string,
): AguiEventWrapper {
  return wrap(seq, {
    type: "STEP_FINISHED",
    step_number: stepNumber,
    step_name: stepName,
  });
}

export function textMessageStart(
  seq: number,
  messageId: string,
  opts?: { isFinalResponse?: boolean },
): AguiEventWrapper {
  return wrap(seq, {
    type: "TEXT_MESSAGE_START",
    message_id: messageId,
    ...(opts?.isFinalResponse ? { is_final_response: true } : {}),
  });
}

export function textMessageContent(
  seq: number,
  messageId: string,
  delta: string,
  opts?: { isFinalResponse?: boolean },
): AguiEventWrapper {
  return wrap(seq, {
    type: "TEXT_MESSAGE_CONTENT",
    message_id: messageId,
    delta,
    ...(opts?.isFinalResponse ? { is_final_response: true } : {}),
  });
}

export function textMessageEnd(
  seq: number,
  messageId: string,
  opts?: { isFinalResponse?: boolean },
): AguiEventWrapper {
  return wrap(seq, {
    type: "TEXT_MESSAGE_END",
    message_id: messageId,
    ...(opts?.isFinalResponse ? { is_final_response: true } : {}),
  });
}

export function toolCallStart(
  seq: number,
  toolCallId: string,
  toolName: string,
  opts?: { stepNumber?: number },
): AguiEventWrapper {
  return wrap(seq, {
    type: "TOOL_CALL_START",
    tool_call_id: toolCallId,
    tool_call_name: toolName,
    ...(opts?.stepNumber !== undefined
      ? { step_number: opts.stepNumber }
      : {}),
  });
}

export function toolCallArgs(
  seq: number,
  toolCallId: string,
  delta: string,
  opts?: { stepNumber?: number },
): AguiEventWrapper {
  return wrap(seq, {
    type: "TOOL_CALL_ARGS",
    tool_call_id: toolCallId,
    delta,
    ...(opts?.stepNumber !== undefined
      ? { step_number: opts.stepNumber }
      : {}),
  });
}

export function toolCallEnd(
  seq: number,
  toolCallId: string,
  opts?: { stepNumber?: number },
): AguiEventWrapper {
  return wrap(seq, {
    type: "TOOL_CALL_END",
    tool_call_id: toolCallId,
    ...(opts?.stepNumber !== undefined
      ? { step_number: opts.stepNumber }
      : {}),
  });
}

export function toolCallResult(
  seq: number,
  toolCallId: string,
  content: string,
  opts?: { stepNumber?: number; isDelta?: boolean },
): AguiEventWrapper {
  return wrap(seq, {
    type: "TOOL_CALL_RESULT",
    tool_call_id: toolCallId,
    ...(opts?.isDelta ? { delta: content } : { content }),
    ...(opts?.stepNumber !== undefined
      ? { step_number: opts.stepNumber }
      : {}),
  });
}

export function runFinished(
  seq: number,
  opts?: {
    stoppedByUser?: boolean;
    status?: string;
    errorMessage?: string;
  },
): AguiEventWrapper {
  return wrap(seq, {
    type: "RUN_FINISHED",
    result: {
      status: opts?.status || "completed",
      ...(opts?.stoppedByUser ? { stopped_by_user: true } : {}),
      ...(opts?.errorMessage ? { error_message: opts.errorMessage } : {}),
    },
  });
}

export function runError(
  seq: number,
  error: string,
  message?: string,
): AguiEventWrapper {
  return wrap(seq, {
    type: "RUN_ERROR",
    error,
    message: message || error,
  });
}

export function researchResultsStart(
  seq: number,
  messageId: string,
  metadata?: Record<string, unknown>,
): AguiEventWrapper {
  return wrap(seq, {
    type: "RESEARCH_RESULTS_START",
    message_id: messageId,
    metadata: metadata || null,
  });
}

export function researchResultsContent(
  seq: number,
  opts: { delta?: string; snapshot?: string },
): AguiEventWrapper {
  return wrap(seq, {
    type: "RESEARCH_RESULTS_CONTENT",
    ...(opts.delta ? { delta: opts.delta } : {}),
    ...(opts.snapshot ? { snapshot: opts.snapshot } : {}),
  });
}

export function researchResultsEnd(seq: number): AguiEventWrapper {
  return wrap(seq, { type: "RESEARCH_RESULTS_END" });
}

// ── Preset event sequences (common scenarios) ──

/** Minimal complete run: RUN_STARTED → STEP_STARTED → TEXT_MESSAGE → RUN_FINISHED */
export function simpleTextRun(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Analyzing request"),
    textMessageStart(2, "msg-1"),
    textMessageContent(3, "msg-1", "Hello "),
    textMessageContent(4, "msg-1", "world"),
    textMessageEnd(5, "msg-1"),
    stepFinished(6, 1, "Analyzing request"),
    runFinished(7),
  ];
}

/** Run with explicit final response */
export function runWithExplicitFinalResponse(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Thinking"),
    textMessageStart(2, "reason-1"),
    textMessageContent(3, "reason-1", "Let me think..."),
    textMessageEnd(4, "reason-1"),
    stepFinished(5, 1, "Thinking"),
    textMessageStart(6, "final-1", { isFinalResponse: true }),
    textMessageContent(7, "final-1", "Here is the ", { isFinalResponse: true }),
    textMessageContent(8, "final-1", "answer.", { isFinalResponse: true }),
    textMessageEnd(9, "final-1", { isFinalResponse: true }),
    runFinished(10),
  ];
}

/** Run with a tool call (e.g., SQL query) */
export function runWithToolCall(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Querying Salesforce"),
    toolCallStart(2, "tc-1", "execute_sql_query", { stepNumber: 1 }),
    toolCallArgs(3, "tc-1", '{"query":"SELECT Id FROM Account"}', {
      stepNumber: 1,
    }),
    toolCallEnd(4, "tc-1", { stepNumber: 1 }),
    toolCallResult(5, "tc-1", '{"success":true,"rows":[]}', {
      stepNumber: 1,
    }),
    stepFinished(6, 1, "Querying Salesforce"),
    textMessageStart(7, "final-1", { isFinalResponse: true }),
    textMessageContent(8, "final-1", "Found 0 accounts.", {
      isFinalResponse: true,
    }),
    textMessageEnd(9, "final-1", { isFinalResponse: true }),
    runFinished(10),
  ];
}

/** Salesforce approval flow: tool call → awaiting approval → RUN_FINISHED (intermediate) */
export function salesforceApprovalPending(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Updating Opportunity"),
    toolCallStart(2, "tc-approval", "request_salesforce_approval", {
      stepNumber: 1,
    }),
    toolCallArgs(
      3,
      "tc-approval",
      JSON.stringify({
        summary: "Update Acme Opportunity stage",
        operations: [
          {
            operation: "update",
            sobject_type: "Opportunity",
            record_name: "Acme Deal",
            record_id: "006xxx",
            changes: [
              { field: "Stage", before: "Prospecting", after: "Qualification" },
            ],
          },
        ],
      }),
      { stepNumber: 1 },
    ),
    toolCallEnd(4, "tc-approval", { stepNumber: 1 }),
    runFinished(5),
  ];
}

/** Salesforce approval flow completed (approved) */
export function salesforceApprovalApproved(): AguiEventWrapper[] {
  return [
    ...salesforceApprovalPending(),
    // After user approves, new events arrive
    toolCallResult(
      6,
      "tc-approval",
      JSON.stringify({ approved: true }),
      { stepNumber: 1 },
    ),
    stepFinished(7, 1, "Updating Opportunity"),
    textMessageStart(8, "final-1", { isFinalResponse: true }),
    textMessageContent(9, "final-1", "Done!", { isFinalResponse: true }),
    textMessageEnd(10, "final-1", { isFinalResponse: true }),
    runFinished(11),
  ];
}

/** Salesforce approval flow completed (rejected) */
export function salesforceApprovalRejected(): AguiEventWrapper[] {
  return [
    ...salesforceApprovalPending(),
    toolCallResult(
      6,
      "tc-approval",
      JSON.stringify({ approved: false, message: "User declined" }),
      { stepNumber: 1 },
    ),
    stepFinished(7, 1, "Updating Opportunity"),
    textMessageStart(8, "final-1", { isFinalResponse: true }),
    textMessageContent(9, "final-1", "Operation rejected.", {
      isFinalResponse: true,
    }),
    textMessageEnd(10, "final-1", { isFinalResponse: true }),
    runFinished(11),
  ];
}

/** Google Calendar approval pending */
export function calendarApprovalPending(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Creating calendar event"),
    toolCallStart(2, "tc-cal", "request_google_calendar_approval", {
      stepNumber: 1,
    }),
    toolCallArgs(
      3,
      "tc-cal",
      JSON.stringify({
        summary: "Schedule team meeting",
        operations: [
          {
            operation: "create",
            summary: "Team Standup",
            start_datetime: "2024-01-15T10:00:00Z",
            end_datetime: "2024-01-15T10:30:00Z",
            attendees_emails: ["alice@test.com", "bob@test.com"],
          },
        ],
      }),
      { stepNumber: 1 },
    ),
    toolCallEnd(4, "tc-cal", { stepNumber: 1 }),
    runFinished(5),
  ];
}

/** Deep research approval pending */
export function deepResearchApprovalPending(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Preparing research"),
    toolCallStart(2, "tc-dr", "request_salesforce_approval", {
      stepNumber: 1,
    }),
    toolCallArgs(
      3,
      "tc-dr",
      JSON.stringify({
        summary: "Deep research on pipeline trends",
        research_query: "What are the pipeline trends for Q1?",
        estimated_time: "5 minutes",
        data_sources: [
          { name: "Opportunities", record_count: 150, description: "Open opps" },
        ],
      }),
      { stepNumber: 1 },
    ),
    toolCallEnd(4, "tc-dr", { stepNumber: 1 }),
    runFinished(5),
  ];
}

/** Run with failed status */
export function failedRun(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Processing"),
    toolCallStart(2, "tc-1", "execute_sql_query", { stepNumber: 1 }),
    toolCallArgs(3, "tc-1", '{"query":"SELECT"}', { stepNumber: 1 }),
    toolCallEnd(4, "tc-1", { stepNumber: 1 }),
    runFinished(5, { status: "failed", errorMessage: "SQL syntax error" }),
  ];
}

/** Run with RUN_ERROR event */
export function runWithError(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Processing"),
    runError(2, "Internal server error", "Something went wrong"),
  ];
}

/** Run stopped by user */
export function stoppedRun(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Analyzing"),
    textMessageStart(2, "msg-1"),
    textMessageContent(3, "msg-1", "Working on it..."),
    runFinished(4, { stoppedByUser: true }),
  ];
}

/** Run with research results */
export function runWithResearchResults(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Running deep research"),
    researchResultsStart(2, "research-1", {
      title: "Pipeline Analysis",
      description: "Analyzing pipeline trends",
    }),
    researchResultsContent(3, { delta: "## Overview\n" }),
    researchResultsContent(4, { delta: "Pipeline is growing." }),
    researchResultsEnd(5),
    stepFinished(6, 1, "Running deep research"),
    textMessageStart(7, "final-1", { isFinalResponse: true }),
    textMessageContent(8, "final-1", "Research complete.", {
      isFinalResponse: true,
    }),
    textMessageEnd(9, "final-1", { isFinalResponse: true }),
    runFinished(10),
  ];
}

/** Run with a tool call that produces an artifact */
export function runWithArtifact(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Generating chart"),
    toolCallStart(2, "tc-art", "create_chart", { stepNumber: 1 }),
    toolCallArgs(3, "tc-art", '{"chart_type":"bar"}', { stepNumber: 1 }),
    toolCallEnd(4, "tc-art", { stepNumber: 1 }),
    toolCallResult(
      5,
      "tc-art",
      JSON.stringify({
        _artifact: {
          success: true,
          artifact_id: "art-123",
          run_id: DEFAULT_RUN_ID,
          tool_name: "create_chart",
          artifact_type: "chart",
        },
      }),
      { stepNumber: 1 },
    ),
    stepFinished(6, 1, "Generating chart"),
    runFinished(7),
  ];
}

/** Run with a tool call that fails (success: false) */
export function runWithFailedToolCall(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Running query:"),
    toolCallStart(2, "tc-fail", "execute_sql_query", { stepNumber: 1 }),
    toolCallArgs(3, "tc-fail", '{"query":"BAD SQL"}', { stepNumber: 1 }),
    toolCallEnd(4, "tc-fail", { stepNumber: 1 }),
    toolCallResult(
      5,
      "tc-fail",
      JSON.stringify({ success: false, error: "Query failed" }),
      { stepNumber: 1 },
    ),
    stepFinished(6, 1, "Running query:"),
    textMessageStart(7, "final-1", { isFinalResponse: true }),
    textMessageContent(8, "final-1", "The query failed.", {
      isFinalResponse: true,
    }),
    textMessageEnd(9, "final-1", { isFinalResponse: true }),
    runFinished(10),
  ];
}

/** Run with a denied tool call */
export function runWithDeniedToolCall(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Updating record"),
    toolCallStart(2, "tc-denied", "execute_sql_query", { stepNumber: 1 }),
    toolCallArgs(3, "tc-denied", '{"query":"UPDATE"}', { stepNumber: 1 }),
    toolCallEnd(4, "tc-denied", { stepNumber: 1 }),
    toolCallResult(5, "tc-denied", "tool call was denied", { stepNumber: 1 }),
    stepFinished(6, 1, "Updating record"),
    runFinished(7),
  ];
}

/** Generic approval via approval_required flag */
export function genericApprovalPending(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Preparing action"),
    toolCallStart(2, "tc-gen", "custom_tool", { stepNumber: 1 }),
    toolCallArgs(
      3,
      "tc-gen",
      JSON.stringify({
        approval_required: true,
        summary: "Delete old records",
        record_name: "Batch cleanup",
        operation: "delete",
        object_type: "Record",
      }),
      { stepNumber: 1 },
    ),
    toolCallEnd(4, "tc-gen", { stepNumber: 1 }),
    runFinished(5),
  ];
}

/** Generic approval via action/resource pattern */
export function actionResourceApprovalPending(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Taking action"),
    toolCallStart(2, "tc-ar", "some_tool", { stepNumber: 1 }),
    toolCallArgs(
      3,
      "tc-ar",
      JSON.stringify({
        summary: "Remove inactive users",
        action: "delete",
        resource: "Inactive Users",
        resource_type: "User Group",
      }),
      { stepNumber: 1 },
    ),
    toolCallEnd(4, "tc-ar", { stepNumber: 1 }),
    runFinished(5),
  ];
}

/** Bulk Salesforce approval (multiple operations) */
export function bulkSalesforceApprovalPending(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Bulk update"),
    toolCallStart(2, "tc-bulk", "request_salesforce_approval", {
      stepNumber: 1,
    }),
    toolCallArgs(
      3,
      "tc-bulk",
      JSON.stringify({
        summary: "Update multiple opportunities",
        operations: [
          {
            operation: "update",
            sobject_type: "Opportunity",
            record_name: "Deal A",
            record_id: "006a",
            changes: [{ field: "Stage", before: "Open", after: "Closed Won" }],
          },
          {
            operation: "update",
            sobject_type: "Opportunity",
            record_name: "Deal B",
            record_id: "006b",
            changes: [{ field: "Stage", before: "Open", after: "Closed Lost" }],
          },
        ],
      }),
      { stepNumber: 1 },
    ),
    toolCallEnd(4, "tc-bulk", { stepNumber: 1 }),
    runFinished(5),
  ];
}

/** Run with chunked (delta) tool call result */
export function runWithChunkedToolResult(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Querying"),
    toolCallStart(2, "tc-chunk", "execute_sql_query", { stepNumber: 1 }),
    toolCallArgs(3, "tc-chunk", '{"query":"SELECT Id FROM Account"}', {
      stepNumber: 1,
    }),
    toolCallEnd(4, "tc-chunk", { stepNumber: 1 }),
    toolCallResult(5, "tc-chunk", '{"success"', {
      stepNumber: 1,
      isDelta: true,
    }),
    toolCallResult(6, "tc-chunk", ':true}', {
      stepNumber: 1,
      isDelta: true,
    }),
    stepFinished(7, 1, "Querying"),
    runFinished(8),
  ];
}

/** Run with research results using snapshot */
export function runWithResearchSnapshot(): AguiEventWrapper[] {
  return [
    runStarted(0),
    researchResultsStart(1, "research-snap", { title: "Analysis" }),
    researchResultsContent(2, { snapshot: "Full content from snapshot" }),
    researchResultsEnd(3),
    runFinished(4),
  ];
}

/** Multiple text messages → last becomes final response at RUN_FINISHED (fallback) */
export function runWithFallbackFinalResponse(): AguiEventWrapper[] {
  return [
    runStarted(0),
    textMessageStart(1, "msg-1"),
    textMessageContent(2, "msg-1", "Thinking..."),
    textMessageEnd(3, "msg-1"),
    textMessageStart(4, "msg-2"),
    textMessageContent(5, "msg-2", "Here is the final answer"),
    textMessageEnd(6, "msg-2"),
    runFinished(7),
  ];
}

/** Salesforce Tooling API approval with nested Metadata fields */
export function toolingApiApproval(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Creating custom field"),
    toolCallStart(2, "tc-tooling", "salesforce_tooling_mutate", {
      stepNumber: 1,
    }),
    toolCallArgs(
      3,
      "tc-tooling",
      JSON.stringify({
        summary: "Create custom field on Account",
        operations: [
          {
            operation: "create",
            sobject_type: "CustomField",
            record_name: "Account.Custom_Field__c",
            fields: {
              FullName: "Account.Custom_Field__c",
              Metadata: {
                type: "Text",
                label: "Custom Field",
                length: 255,
                required: true,
              },
            },
          },
        ],
      }),
      { stepNumber: 1 },
    ),
    toolCallEnd(4, "tc-tooling", { stepNumber: 1 }),
    runFinished(5),
  ];
}

/** Analytics operation approval (create_report) */
export function analyticsApproval(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Creating report"),
    toolCallStart(2, "tc-analytics", "request_salesforce_approval", {
      stepNumber: 1,
    }),
    toolCallArgs(
      3,
      "tc-analytics",
      JSON.stringify({
        summary: "Create pipeline report",
        operations: [
          {
            operation: "create_report",
            report_name: "Q1 Pipeline",
            report_type: "Opportunity",
            description: "Pipeline analysis for Q1",
            detail_columns: ["Name", "Amount", "Stage"],
          },
        ],
      }),
      { stepNumber: 1 },
    ),
    toolCallEnd(4, "tc-analytics", { stepNumber: 1 }),
    runFinished(5),
  ];
}

/** Run with tool call without step_number (uses direct map) */
export function runWithToolCallNoStepNumber(): AguiEventWrapper[] {
  return [
    runStarted(0),
    toolCallStart(1, "tc-no-step", "execute_sql_query"),
    toolCallArgs(2, "tc-no-step", '{"query":"SELECT 1"}'),
    toolCallEnd(3, "tc-no-step"),
    toolCallResult(4, "tc-no-step", '{"success":true}'),
    runFinished(5),
  ];
}

/** Interleaved text messages and tool calls */
export function interleavedTextAndTools(): AguiEventWrapper[] {
  return [
    runStarted(0),
    textMessageStart(1, "reason-1"),
    textMessageContent(2, "reason-1", "Let me query the data"),
    textMessageEnd(3, "reason-1"),
    stepStarted(4, 1, "Querying database"),
    toolCallStart(5, "tc-1", "execute_sql_query", { stepNumber: 1 }),
    toolCallArgs(6, "tc-1", '{"query":"SELECT Id FROM Account"}', {
      stepNumber: 1,
    }),
    toolCallEnd(7, "tc-1", { stepNumber: 1 }),
    toolCallResult(8, "tc-1", '{"success":true}', { stepNumber: 1 }),
    stepFinished(9, 1, "Querying database"),
    textMessageStart(10, "reason-2"),
    textMessageContent(11, "reason-2", "Now analyzing results"),
    textMessageEnd(12, "reason-2"),
    textMessageStart(13, "final-1", { isFinalResponse: true }),
    textMessageContent(14, "final-1", "Analysis complete.", {
      isFinalResponse: true,
    }),
    textMessageEnd(15, "final-1", { isFinalResponse: true }),
    runFinished(16),
  ];
}

/** Approval resumed after approve → continues with more events */
export function approvalResumedAfterApprove(): AguiEventWrapper[] {
  return [
    ...salesforceApprovalPending(),
    // Run resumes with new processing events after approval
    stepStarted(6, 2, "Executing update"),
    toolCallResult(
      7,
      "tc-approval",
      JSON.stringify({ approved: true }),
      { stepNumber: 1 },
    ),
    stepFinished(8, 2, "Executing update"),
    textMessageStart(9, "final-1", { isFinalResponse: true }),
    textMessageContent(10, "final-1", "Update completed successfully.", {
      isFinalResponse: true,
    }),
    textMessageEnd(11, "final-1", { isFinalResponse: true }),
    runFinished(12),
  ];
}

/** Failed artifact tool result */
export function runWithFailedArtifact(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Generating chart:"),
    toolCallStart(2, "tc-art-fail", "create_chart", { stepNumber: 1 }),
    toolCallArgs(3, "tc-art-fail", '{"chart_type":"bar"}', { stepNumber: 1 }),
    toolCallEnd(4, "tc-art-fail", { stepNumber: 1 }),
    toolCallResult(
      5,
      "tc-art-fail",
      JSON.stringify({
        _artifact: { success: false },
      }),
      { stepNumber: 1 },
    ),
    stepFinished(6, 1, "Generating chart:"),
    runFinished(7),
  ];
}

/** Approval with error result (success: false) */
export function approvalWithSystemError(): AguiEventWrapper[] {
  return [
    ...salesforceApprovalPending(),
    toolCallResult(
      6,
      "tc-approval",
      JSON.stringify({ success: false, error: "API timeout" }),
      { stepNumber: 1 },
    ),
    stepFinished(7, 1, "Updating Opportunity"),
    runFinished(8),
  ];
}

/** Bulk calendar approval */
export function bulkCalendarApprovalPending(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Scheduling events"),
    toolCallStart(2, "tc-bulk-cal", "request_google_calendar_approval", {
      stepNumber: 1,
    }),
    toolCallArgs(
      3,
      "tc-bulk-cal",
      JSON.stringify({
        summary: "Schedule multiple meetings",
        operations: [
          {
            operation: "create",
            summary: "Team Standup",
            start_datetime: "2024-01-15T10:00:00Z",
            end_datetime: "2024-01-15T10:30:00Z",
            attendees_emails: ["alice@test.com"],
          },
          {
            operation: "create",
            summary: "1:1 Meeting",
            start_datetime: "2024-01-15T14:00:00Z",
            end_datetime: "2024-01-15T14:30:00Z",
            attendees_emails: ["bob@test.com"],
          },
        ],
      }),
      { stepNumber: 1 },
    ),
    toolCallEnd(4, "tc-bulk-cal", { stepNumber: 1 }),
    runFinished(5),
  ];
}

/** Run where events arrive out of order (should be sorted by sequence) */
export function outOfOrderEvents(): AguiEventWrapper[] {
  return [
    stepStarted(1, 1, "Processing"),
    runStarted(0),
    textMessageStart(3, "msg-1"),
    textMessageContent(2, "msg-1", "Hello"),
    textMessageEnd(4, "msg-1"),
    runFinished(5),
  ];
}

/** Direct calendar approval (no operations array) */
export function directCalendarApproval(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Scheduling event"),
    toolCallStart(2, "tc-direct-cal", "request_google_calendar_approval", {
      stepNumber: 1,
    }),
    toolCallArgs(
      3,
      "tc-direct-cal",
      JSON.stringify({
        summary: "Create meeting",
        event_summary: "Project Kickoff",
        start_datetime: "2024-01-20T09:00:00Z",
        end_datetime: "2024-01-20T10:00:00Z",
        attendees: ["alice@test.com"],
        location: "Conference Room A",
        description: "Kick off the new project",
      }),
      { stepNumber: 1 },
    ),
    toolCallEnd(4, "tc-direct-cal", { stepNumber: 1 }),
    runFinished(5),
  ];
}

/** Run with step that uses step_name correlation (no step_number) */
export function stepNameCorrelation(): AguiEventWrapper[] {
  return [
    runStarted(0),
    wrap(1, {
      type: "STEP_STARTED",
      step_name: "Analyzing data",
    }),
    textMessageStart(2, "msg-1"),
    textMessageContent(3, "msg-1", "Analysis complete"),
    textMessageEnd(4, "msg-1"),
    wrap(5, {
      type: "STEP_FINISHED",
      step_name: "Analyzing data",
    }),
    runFinished(6),
  ];
}

/** Run with failed RUN_FINISHED that has pending approval (should NOT be intermediate) */
export function failedRunWithPendingApproval(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Updating record"),
    toolCallStart(2, "tc-fail-appr", "request_salesforce_approval", {
      stepNumber: 1,
    }),
    toolCallArgs(
      3,
      "tc-fail-appr",
      JSON.stringify({
        summary: "Update record",
        operations: [
          {
            operation: "update",
            sobject_type: "Account",
            record_name: "Test",
            record_id: "001xxx",
            changes: [{ field: "Name", before: "Old", after: "New" }],
          },
        ],
      }),
      { stepNumber: 1 },
    ),
    toolCallEnd(4, "tc-fail-appr", { stepNumber: 1 }),
    runFinished(5, { status: "failed", errorMessage: "Run failed during approval" }),
  ];
}

/** Old/new value normalization in changes */
export function approvalWithOldNewValues(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Updating record"),
    toolCallStart(2, "tc-norm", "request_salesforce_approval", {
      stepNumber: 1,
    }),
    toolCallArgs(
      3,
      "tc-norm",
      JSON.stringify({
        summary: "Update opportunity",
        operations: [
          {
            operation: "update",
            sobject_type: "Opportunity",
            record_name: "Test Deal",
            record_id: "006norm",
            changes: [
              { field: "Stage", old_value: "Open", new_value: "Closed" },
            ],
          },
        ],
      }),
      { stepNumber: 1 },
    ),
    toolCallEnd(4, "tc-norm", { stepNumber: 1 }),
    runFinished(5),
  ];
}

/** Changes with null `after` values filled from fields */
export function approvalWithFieldsMerge(): AguiEventWrapper[] {
  return [
    runStarted(0),
    stepStarted(1, 1, "Creating record"),
    toolCallStart(2, "tc-merge", "request_salesforce_approval", {
      stepNumber: 1,
    }),
    toolCallArgs(
      3,
      "tc-merge",
      JSON.stringify({
        summary: "Create account",
        operations: [
          {
            operation: "create",
            sobject_type: "Account",
            record_name: "New Corp",
            record_id: "001merge",
            changes: [{ field: "Name", after: null }],
            fields: { Name: "New Corp" },
          },
        ],
      }),
      { stepNumber: 1 },
    ),
    toolCallEnd(4, "tc-merge", { stepNumber: 1 }),
    runFinished(5),
  ];
}
