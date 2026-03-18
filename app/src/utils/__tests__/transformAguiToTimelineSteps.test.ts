import { describe, it, expect } from "vitest";
import {
  transformAguiToTimelineSteps,
  getElapsedTimeFromEvents,
  DEFAULT_EXPIRED_APPROVAL_MESSAGE,
} from "../transformAguiToTimelineSteps";
import * as fixtures from "./fixtures/aguiEventBuilders";

// ── Empty / null / undefined input ──────────────────────────────────────────

describe("transformAguiToTimelineSteps", () => {
  describe("empty / null / undefined input", () => {
    it("returns empty result for null", () => {
      const result = transformAguiToTimelineSteps(null);
      expect(result.steps).toEqual([]);
      expect(result.isThinking).toBe(false);
      expect(result.finalResponse).toBe("");
      expect(result.isFinalResponseStreaming).toBe(false);
      expect(result.isAwaitingApproval).toBe(false);
      expect(result.stoppedByUser).toBe(false);
      expect(result.hadApprovalPause).toBe(false);
      expect(result.runErrorMessage).toBe("");
      expect(result.isDeepResearchRunning).toBe(false);
    });

    it("returns empty result for undefined", () => {
      const result = transformAguiToTimelineSteps(undefined);
      expect(result.steps).toEqual([]);
      expect(result.isThinking).toBe(false);
    });

    it("returns empty result for empty array", () => {
      const result = transformAguiToTimelineSteps([]);
      expect(result.steps).toEqual([]);
      expect(result.isThinking).toBe(false);
    });
  });

  // ── Basic event flow ────────────────────────────────────────────────────

  describe("basic event flow", () => {
    it("handles RUN_STARTED without creating steps", () => {
      const events = [fixtures.runStarted(0)];
      const result = transformAguiToTimelineSteps(events);
      expect(result.steps).toEqual([]);
      expect(result.isThinking).toBe(true);
    });

    it("sorts events by sequence regardless of input order", () => {
      const events = fixtures.outOfOrderEvents();
      const result = transformAguiToTimelineSteps(events);
      // Should still produce valid output — first event processed is RUN_STARTED (seq 0)
      expect(result.isThinking).toBe(false);
      expect(result.steps.length).toBeGreaterThanOrEqual(1);
    });

    it("processes a simple text run end-to-end", () => {
      const events = fixtures.simpleTextRun();
      const result = transformAguiToTimelineSteps(events);
      expect(result.isThinking).toBe(false);
      // The last text message becomes the final response at RUN_FINISHED
      expect(result.finalResponse).toBe("Hello world");
      expect(result.isFinalResponseStreaming).toBe(false);
    });
  });

  // ── STEP_STARTED / STEP_FINISHED ──────────────────────────────────────

  describe("step lifecycle", () => {
    it("creates a step from STEP_STARTED with correct properties", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Analyzing data"),
      ];
      const result = transformAguiToTimelineSteps(events);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].text).toBe("Analyzing data");
      expect(result.steps[0].status).toBe("in-progress");
    });

    it("marks step complete on STEP_FINISHED", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Processing"),
        fixtures.stepFinished(2, 1, "Processing"),
      ];
      const result = transformAguiToTimelineSteps(events);
      expect(result.steps[0].status).toBe("complete");
    });

    it("correlates step by step_name when step_number is absent", () => {
      const events = fixtures.stepNameCorrelation();
      const result = transformAguiToTimelineSteps(events);
      // Step should be marked complete via name correlation
      const step = result.steps.find((s) => s.text === "Analyzing data");
      expect(step?.status).toBe("complete");
    });

    it("preserves e2b category from step metadata", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Running code", { category: "e2b" }),
        fixtures.stepFinished(2, 1, "Running code"),
      ];
      const result = transformAguiToTimelineSteps(events);
      expect(result.steps[0].category).toBe("e2b");
    });
  });

  // ── TEXT_MESSAGE handling (reasoning steps) ────────────────────────────

  describe("text message handling", () => {
    it("creates reasoning steps from TEXT_MESSAGE events", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.textMessageStart(1, "msg-1"),
        fixtures.textMessageContent(2, "msg-1", "Thinking about "),
        fixtures.textMessageContent(3, "msg-1", "this problem"),
        fixtures.textMessageEnd(4, "msg-1"),
      ];
      const result = transformAguiToTimelineSteps(events);
      const reasoningStep = result.steps.find((s) => s.type === "reasoning");
      expect(reasoningStep).toBeDefined();
      expect(reasoningStep!.text).toBe("Thinking about this problem");
      expect(reasoningStep!.status).toBe("complete");
    });

    it("creates a reasoning step from orphan TEXT_MESSAGE_CONTENT (no matching start)", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.textMessageContent(1, "orphan-msg", "Orphan content"),
        fixtures.textMessageEnd(2, "orphan-msg"),
      ];
      const result = transformAguiToTimelineSteps(events);
      expect(result.steps.length).toBeGreaterThanOrEqual(1);
      const step = result.steps.find((s) => s.text?.includes("Orphan content"));
      expect(step).toBeDefined();
    });

    it("completes current reasoning step when STEP_STARTED arrives", () => {
      // Mid-stream: reasoning step should be marked complete before RUN_FINISHED extracts it
      const midStreamEvents = [
        fixtures.runStarted(0),
        fixtures.textMessageStart(1, "reason-1"),
        fixtures.textMessageContent(2, "reason-1", "Reasoning..."),
        fixtures.stepStarted(3, 1, "Tool step"),
      ];
      const midResult = transformAguiToTimelineSteps(midStreamEvents);
      const reasoningStep = midResult.steps.find(
        (s) => s.text === "Reasoning...",
      );
      expect(reasoningStep?.status).toBe("complete");

      // After RUN_FINISHED: the only text message is extracted as fallback final response
      const fullEvents = [
        ...midStreamEvents,
        fixtures.stepFinished(4, 1, "Tool step"),
        fixtures.runFinished(5),
      ];
      const fullResult = transformAguiToTimelineSteps(fullEvents);
      expect(fullResult.finalResponse).toBe("Reasoning...");
      // The reasoning step is removed from steps since it became the final response
      expect(
        fullResult.steps.find((s) => s.text === "Reasoning..."),
      ).toBeUndefined();
    });

    it("handles explicit final response (is_final_response flag)", () => {
      const events = fixtures.runWithExplicitFinalResponse();
      const result = transformAguiToTimelineSteps(events);
      expect(result.finalResponse).toBe("Here is the answer.");
      expect(result.isFinalResponseStreaming).toBe(false);
      // Reasoning step should still exist
      const reasoningStep = result.steps.find((s) =>
        s.text?.includes("Let me think"),
      );
      expect(reasoningStep).toBeDefined();
      expect(reasoningStep!.status).toBe("complete");
    });

    it("sets isFinalResponseStreaming during streaming", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.textMessageStart(1, "final-1", { isFinalResponse: true }),
        fixtures.textMessageContent(2, "final-1", "Streaming...", {
          isFinalResponse: true,
        }),
      ];
      const result = transformAguiToTimelineSteps(events);
      expect(result.isFinalResponseStreaming).toBe(true);
      expect(result.finalResponse).toBe("Streaming...");
    });

    it("falls back to last text message as final response at RUN_FINISHED", () => {
      const events = fixtures.runWithFallbackFinalResponse();
      const result = transformAguiToTimelineSteps(events);
      // The last text message (msg-2) should be extracted as final response
      expect(result.finalResponse).toBe("Here is the final answer");
      // The first text message step should still be in steps
      const thinkingStep = result.steps.find((s) =>
        s.text?.includes("Thinking"),
      );
      expect(thinkingStep).toBeDefined();
    });

    it("interleaves text messages and tool calls correctly", () => {
      const events = fixtures.interleavedTextAndTools();
      const result = transformAguiToTimelineSteps(events);
      expect(result.finalResponse).toBe("Analysis complete.");
      // Should have reasoning steps and tool step
      expect(result.steps.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ── Tool call lifecycle ───────────────────────────────────────────────

  describe("tool call lifecycle", () => {
    it("transforms a complete tool call flow", () => {
      const events = fixtures.runWithToolCall();
      const result = transformAguiToTimelineSteps(events);
      expect(result.isThinking).toBe(false);
      const toolStep = result.steps.find((s) => s.source === "salesforce");
      expect(toolStep).toBeDefined();
      expect(toolStep!.status).toBe("complete");
    });

    it("parses query from tool args", () => {
      const events = fixtures.runWithToolCall();
      const result = transformAguiToTimelineSteps(events);
      const toolStep = result.steps.find((s) => s.source === "salesforce");
      expect(toolStep?.code).toBe("SELECT Id FROM Account");
    });

    it("handles tool call without STEP_STARTED (creates step on the fly)", () => {
      const events = fixtures.runWithToolCallNoStepNumber();
      const result = transformAguiToTimelineSteps(events);
      // Should still create a step for the tool call
      expect(result.steps.length).toBeGreaterThanOrEqual(1);
    });

    it("removes failed tool call step from steps array", () => {
      const events = fixtures.runWithFailedToolCall();
      const result = transformAguiToTimelineSteps(events);
      // Failed step should be removed
      const failedStep = result.steps.find((s) => s.id?.includes("tc-fail"));
      expect(failedStep).toBeUndefined();
      expect(result.finalResponse).toBe("The query failed.");
    });

    it("removes trailing colon from previous step when tool step is removed", () => {
      const events = fixtures.runWithFailedToolCall();
      const result = transformAguiToTimelineSteps(events);
      // The step "Running query:" should have trailing colon removed
      const prevStep = result.steps.find((s) =>
        s.text?.includes("Running query"),
      );
      if (prevStep) {
        expect(prevStep.text?.trimEnd().endsWith(":")).toBe(false);
      }
    });

    it("marks denied tool call as error", () => {
      const events = fixtures.runWithDeniedToolCall();
      const result = transformAguiToTimelineSteps(events);
      const deniedStep = result.steps.find((s) => s.status === "error");
      expect(deniedStep).toBeDefined();
    });

    it("handles successful artifact in tool result", () => {
      const events = fixtures.runWithArtifact();
      const result = transformAguiToTimelineSteps(events);
      const artStep = result.steps.find((s) => s.artifact);
      expect(artStep).toBeDefined();
      expect(artStep!.artifact!.artifact_id).toBe("art-123");
      expect(artStep!.status).toBe("complete");
    });

    it("removes step for failed artifact", () => {
      const events = fixtures.runWithFailedArtifact();
      const result = transformAguiToTimelineSteps(events);
      // Failed artifact step should be removed
      const artStep = result.steps.find((s) => s.id?.includes("tc-art-fail"));
      expect(artStep).toBeUndefined();
    });

    it("handles chunked (delta) tool call results", () => {
      const events = fixtures.runWithChunkedToolResult();
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.source === "salesforce");
      expect(step?.status).toBe("complete");
    });

    it("maps tool names to correct sources", () => {
      // Salesforce
      const sfEvents = [
        fixtures.runStarted(0),
        fixtures.toolCallStart(1, "tc", "execute_sql_query"),
        fixtures.toolCallEnd(2, "tc"),
        fixtures.toolCallResult(3, "tc", '{"success":true}'),
        fixtures.runFinished(4),
      ];
      const sfResult = transformAguiToTimelineSteps(sfEvents);
      expect(sfResult.steps.some((s) => s.source === "salesforce")).toBe(true);

      // Gong
      const gongEvents = [
        fixtures.runStarted(0),
        fixtures.toolCallStart(1, "tc", "search_gong_calls"),
        fixtures.toolCallEnd(2, "tc"),
        fixtures.toolCallResult(3, "tc", '{"success":true}'),
        fixtures.runFinished(4),
      ];
      const gongResult = transformAguiToTimelineSteps(gongEvents);
      expect(gongResult.steps.some((s) => s.source === "gong")).toBe(true);

      // Email
      const emailEvents = [
        fixtures.runStarted(0),
        fixtures.toolCallStart(1, "tc", "search_emails"),
        fixtures.toolCallEnd(2, "tc"),
        fixtures.toolCallResult(3, "tc", '{"success":true}'),
        fixtures.runFinished(4),
      ];
      const emailResult = transformAguiToTimelineSteps(emailEvents);
      expect(emailResult.steps.some((s) => s.source === "email")).toBe(true);

      // Calendar
      const calEvents = [
        fixtures.runStarted(0),
        fixtures.toolCallStart(1, "tc", "get_calendar_events"),
        fixtures.toolCallEnd(2, "tc"),
        fixtures.toolCallResult(3, "tc", '{"success":true}'),
        fixtures.runFinished(4),
      ];
      const calResult = transformAguiToTimelineSteps(calEvents);
      expect(calResult.steps.some((s) => s.source === "calendar")).toBe(true);

      // Unknown → generic
      const genericEvents = [
        fixtures.runStarted(0),
        fixtures.toolCallStart(1, "tc", "unknown_tool"),
        fixtures.toolCallEnd(2, "tc"),
        fixtures.toolCallResult(3, "tc", '{"success":true}'),
        fixtures.runFinished(4),
      ];
      const genericResult = transformAguiToTimelineSteps(genericEvents);
      expect(genericResult.steps.some((s) => s.source === "generic")).toBe(
        true,
      );
    });
  });

  // ── Approval flow ─────────────────────────────────────────────────────

  describe("approval flow", () => {
    describe("Salesforce approval", () => {
      it("detects pending SF approval with correct state", () => {
        const events = fixtures.salesforceApprovalPending();
        const result = transformAguiToTimelineSteps(events);
        expect(result.isAwaitingApproval).toBe(true);
        expect(result.isThinking).toBe(true);
        expect(result.hadApprovalPause).toBe(true);
        const approvalStep = result.steps.find(
          (s) => s.status === "awaiting-approval",
        );
        expect(approvalStep).toBeDefined();
        expect(approvalStep!.type).toBe("approval");
        expect(approvalStep!.approval).toBeDefined();
        expect(approvalStep!.approval!.summary).toBe(
          "Update Acme Opportunity stage",
        );
        expect(approvalStep!.approval!.approvalType).toBe("salesforce");
      });

      it("marks in-progress steps as complete during approval pause", () => {
        const events = fixtures.salesforceApprovalPending();
        const result = transformAguiToTimelineSteps(events);
        // No steps should be in-progress (only awaiting-approval)
        const inProgressSteps = result.steps.filter(
          (s) => s.status === "in-progress",
        );
        expect(inProgressSteps).toHaveLength(0);
      });

      it("completes approval on approve", () => {
        const events = fixtures.salesforceApprovalApproved();
        const result = transformAguiToTimelineSteps(events);
        expect(result.isAwaitingApproval).toBe(false);
        expect(result.isThinking).toBe(false);
        expect(result.finalResponse).toBe("Done!");
      });

      it("marks rejected approval with rejection reason", () => {
        const events = fixtures.salesforceApprovalRejected();
        const result = transformAguiToTimelineSteps(events);
        expect(result.isAwaitingApproval).toBe(false);
        // STEP_FINISHED after rejection preserves "rejected" status
        const approvalStep = result.steps.find((s) => s.rejectionReason);
        expect(approvalStep).toBeDefined();
        expect(approvalStep!.rejectionReason).toBe("User declined");
        expect(approvalStep!.status).toBe("rejected");
      });

      it("handles approval with system error", () => {
        const events = fixtures.approvalWithSystemError();
        const result = transformAguiToTimelineSteps(events);
        // STEP_FINISHED after error preserves "error" status
        const stepWithError = result.steps.find((s) => s.errorMessage);
        expect(stepWithError).toBeDefined();
        expect(stepWithError!.errorMessage).toBe("API timeout");
        expect(stepWithError!.status).toBe("error");
      });

      it("detects bulk SF approval with multiple operations", () => {
        const events = fixtures.bulkSalesforceApprovalPending();
        const result = transformAguiToTimelineSteps(events);
        expect(result.isAwaitingApproval).toBe(true);
        const approvalStep = result.steps.find(
          (s) => s.status === "awaiting-approval",
        );
        expect(approvalStep!.approval!.approvalType).toBe("bulk");
        expect(approvalStep!.approval!.operations).toHaveLength(2);
        expect(approvalStep!.approval!.bulkRecords).toHaveLength(2);
      });

      it("resumes correctly after approval (new events after intermediate RUN_FINISHED)", () => {
        const events = fixtures.approvalResumedAfterApprove();
        const result = transformAguiToTimelineSteps(events);
        expect(result.isAwaitingApproval).toBe(false);
        expect(result.isThinking).toBe(false);
        expect(result.finalResponse).toBe("Update completed successfully.");
        // Approval step should be marked complete after resume
        const approvalSteps = result.steps.filter((s) => s.type === "approval");
        expect(approvalSteps.every((s) => s.status === "complete")).toBe(true);
      });

      it("normalizes old_value/new_value to before/after", () => {
        const events = fixtures.approvalWithOldNewValues();
        const result = transformAguiToTimelineSteps(events);
        const approvalStep = result.steps.find(
          (s) => s.status === "awaiting-approval",
        );
        expect(approvalStep!.approval!.changes).toBeDefined();
        expect(approvalStep!.approval!.changes![0].before).toBe("Open");
        expect(approvalStep!.approval!.changes![0].after).toBe("Closed");
      });

      it("merges fields into changes when after is null", () => {
        const events = fixtures.approvalWithFieldsMerge();
        const result = transformAguiToTimelineSteps(events);
        const approvalStep = result.steps.find(
          (s) => s.status === "awaiting-approval",
        );
        const nameChange = approvalStep!.approval!.changes?.find(
          (c) => c.field === "Name",
        );
        expect(nameChange?.after).toBe("New Corp");
      });
    });

    describe("Google Calendar approval", () => {
      it("detects pending calendar approval with correct fields", () => {
        const events = fixtures.calendarApprovalPending();
        const result = transformAguiToTimelineSteps(events);
        expect(result.isAwaitingApproval).toBe(true);
        const approvalStep = result.steps.find(
          (s) => s.status === "awaiting-approval",
        );
        expect(approvalStep!.approval!.approvalType).toBe("calendar");
        expect(approvalStep!.approval!.recordName).toContain("Team Standup");
      });

      it("detects bulk calendar approval", () => {
        const events = fixtures.bulkCalendarApprovalPending();
        const result = transformAguiToTimelineSteps(events);
        expect(result.isAwaitingApproval).toBe(true);
        const approvalStep = result.steps.find(
          (s) => s.status === "awaiting-approval",
        );
        expect(approvalStep!.approval!.approvalType).toBe("bulk");
        expect(approvalStep!.approval!.bulkRecords).toHaveLength(2);
        expect(approvalStep!.approval!.bulkRecords![0].recordName).toBe(
          "Team Standup",
        );
      });

      it("detects direct calendar approval (no operations array)", () => {
        const events = fixtures.directCalendarApproval();
        const result = transformAguiToTimelineSteps(events);
        expect(result.isAwaitingApproval).toBe(true);
        const approvalStep = result.steps.find(
          (s) => s.status === "awaiting-approval",
        );
        expect(approvalStep!.approval!.approvalType).toBe("calendar");
        expect(approvalStep!.approval!.recordName).toBe("Project Kickoff");
        expect(approvalStep!.approval!.fields).toBeDefined();
        expect(approvalStep!.approval!.fields!["Location"]).toBe(
          "Conference Room A",
        );
      });
    });

    describe("Deep Research approval", () => {
      it("detects pending deep research approval", () => {
        const events = fixtures.deepResearchApprovalPending();
        const result = transformAguiToTimelineSteps(events);
        expect(result.isAwaitingApproval).toBe(true);
        const approvalStep = result.steps.find(
          (s) => s.status === "awaiting-approval",
        );
        expect(approvalStep!.approval!.approvalType).toBe("deep_research");
        expect(approvalStep!.approval!.researchQuery).toBe(
          "What are the pipeline trends for Q1?",
        );
        expect(approvalStep!.approval!.dataSources).toHaveLength(1);
      });
    });

    describe("Generic approval", () => {
      it("detects generic approval via approval_required flag", () => {
        const events = fixtures.genericApprovalPending();
        const result = transformAguiToTimelineSteps(events);
        expect(result.isAwaitingApproval).toBe(true);
        const approvalStep = result.steps.find(
          (s) => s.status === "awaiting-approval",
        );
        expect(approvalStep!.approval!.approvalType).toBe("generic");
        expect(approvalStep!.approval!.summary).toBe("Delete old records");
        expect(approvalStep!.approval!.operation).toBe("delete");
      });

      it("detects generic approval via action/resource pattern", () => {
        const events = fixtures.actionResourceApprovalPending();
        const result = transformAguiToTimelineSteps(events);
        expect(result.isAwaitingApproval).toBe(true);
        const approvalStep = result.steps.find(
          (s) => s.status === "awaiting-approval",
        );
        expect(approvalStep!.approval!.approvalType).toBe("generic");
        expect(approvalStep!.approval!.recordName).toBe("Inactive Users");
        expect(approvalStep!.approval!.operation).toBe("delete");
      });
    });

    describe("Salesforce Tooling API approval", () => {
      it("detects tooling API approval and normalizes fields", () => {
        const events = fixtures.toolingApiApproval();
        const result = transformAguiToTimelineSteps(events);
        expect(result.isAwaitingApproval).toBe(true);
        const approvalStep = result.steps.find(
          (s) => s.status === "awaiting-approval",
        );
        expect(approvalStep!.approval!.approvalType).toBe("salesforce");
        // Tooling fields should be normalized (FullName excluded, Metadata flattened)
        expect(approvalStep!.approval!.fields).toBeDefined();
        expect(approvalStep!.approval!.fields!["Field Type"]).toBe("Text");
        expect(approvalStep!.approval!.fields!["Label"]).toBe("Custom Field");
        // FullName should be excluded from normalized fields
        expect(approvalStep!.approval!.fields!["FullName"]).toBeUndefined();
      });
    });

    describe("Analytics approval", () => {
      it("normalizes analytics operations (create_report → create)", () => {
        const events = fixtures.analyticsApproval();
        const result = transformAguiToTimelineSteps(events);
        expect(result.isAwaitingApproval).toBe(true);
        const approvalStep = result.steps.find(
          (s) => s.status === "awaiting-approval",
        );
        // create_report should be normalized to "create" base op
        expect(approvalStep!.approval!.operation).toBe("create");
        // Record name derived from report_name
        expect(approvalStep!.approval!.recordName).toBe("Q1 Pipeline");
        // Fields should be built from analytics params
        expect(approvalStep!.approval!.fields).toBeDefined();
      });
    });

    describe("approval with failed RUN_FINISHED", () => {
      it("does NOT treat failed RUN_FINISHED as intermediate even with pending approval", () => {
        const events = fixtures.failedRunWithPendingApproval();
        const result = transformAguiToTimelineSteps(events);
        // Should be treated as final (failed), not intermediate
        expect(result.isThinking).toBe(false);
        expect(result.hadApprovalPause).toBe(false);
        expect(result.runErrorMessage).toBe("Run failed during approval");
      });
    });
  });

  // ── RUN_FINISHED / RUN_ERROR ──────────────────────────────────────────

  describe("run completion", () => {
    it("marks isThinking false on RUN_FINISHED", () => {
      const events = [fixtures.runStarted(0), fixtures.runFinished(1)];
      const result = transformAguiToTimelineSteps(events);
      expect(result.isThinking).toBe(false);
    });

    it("detects stopped_by_user from RUN_FINISHED", () => {
      const events = fixtures.stoppedRun();
      const result = transformAguiToTimelineSteps(events);
      expect(result.stoppedByUser).toBe(true);
      expect(result.isThinking).toBe(false);
    });

    it("extracts error message from failed RUN_FINISHED", () => {
      const events = fixtures.failedRun();
      const result = transformAguiToTimelineSteps(events);
      expect(result.runErrorMessage).toBe("SQL syntax error");
      expect(result.isThinking).toBe(false);
    });

    it("defaults error message when failed run has no error_message", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.runFinished(1, { status: "failed" }),
      ];
      const result = transformAguiToTimelineSteps(events);
      expect(result.runErrorMessage).toBe("Agent run failed");
    });

    it("marks in-progress steps as error on failed RUN_FINISHED", () => {
      const events = fixtures.failedRun();
      const result = transformAguiToTimelineSteps(events);
      // Steps that were in-progress should now be error
      const errorSteps = result.steps.filter((s) => s.status === "error");
      expect(errorSteps.length).toBeGreaterThanOrEqual(1);
    });

    it("handles RUN_ERROR event", () => {
      const events = fixtures.runWithError();
      const result = transformAguiToTimelineSteps(events);
      expect(result.runErrorMessage).toBe("Internal server error");
      expect(result.isThinking).toBe(false);
    });

    it("marks in-progress steps as error on RUN_ERROR", () => {
      const events = fixtures.runWithError();
      const result = transformAguiToTimelineSteps(events);
      const processingStep = result.steps.find((s) => s.text === "Processing");
      expect(processingStep?.status).toBe("error");
    });

    it("isFinalResponseStreaming is false after RUN_FINISHED", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.textMessageStart(1, "final", { isFinalResponse: true }),
        fixtures.textMessageContent(2, "final", "answer", {
          isFinalResponse: true,
        }),
        fixtures.runFinished(3),
      ];
      const result = transformAguiToTimelineSteps(events);
      expect(result.isFinalResponseStreaming).toBe(false);
    });
  });

  // ── Research results ──────────────────────────────────────────────────

  describe("research results", () => {
    it("tracks research results streaming with delta", () => {
      const events = fixtures.runWithResearchResults();
      const result = transformAguiToTimelineSteps(events);
      expect(result.researchResults.isCompleted).toBe(true);
      expect(result.researchResults.isStreaming).toBe(false);
      expect(result.researchResults.content).toBe(
        "## Overview\nPipeline is growing.",
      );
      expect(result.researchResults.messageId).toBe("research-1");
    });

    it("handles research results with snapshot (replaces content)", () => {
      const events = fixtures.runWithResearchSnapshot();
      const result = transformAguiToTimelineSteps(events);
      expect(result.researchResults.content).toBe("Full content from snapshot");
      expect(result.researchResults.isCompleted).toBe(true);
    });

    it("sets isDeepResearchRunning during streaming", () => {
      // Only up to RESEARCH_RESULTS_CONTENT (no END yet)
      const events = [
        fixtures.runStarted(0),
        fixtures.researchResultsStart(1, "r-1"),
        fixtures.researchResultsContent(2, { delta: "partial" }),
      ];
      const result = transformAguiToTimelineSteps(events);
      expect(result.isDeepResearchRunning).toBe(true);
      expect(result.researchResults.isStreaming).toBe(true);
    });

    it("clears isDeepResearchRunning after RESEARCH_RESULTS_END", () => {
      const events = fixtures.runWithResearchResults();
      const result = transformAguiToTimelineSteps(events);
      expect(result.isDeepResearchRunning).toBe(false);
    });

    it("preserves research metadata from RESEARCH_RESULTS_START", () => {
      const events = fixtures.runWithResearchResults();
      const result = transformAguiToTimelineSteps(events);
      expect(result.researchResults.metadata).toEqual({
        title: "Pipeline Analysis",
        description: "Analyzing pipeline trends",
      });
    });
  });

  // ── hadApprovalPause (intermediate RUN_FINISHED) ──────────────────────

  describe("hadApprovalPause", () => {
    it("is true when RUN_FINISHED arrives with pending approval", () => {
      const events = fixtures.salesforceApprovalPending();
      const result = transformAguiToTimelineSteps(events);
      expect(result.hadApprovalPause).toBe(true);
    });

    it("is false when RUN_FINISHED arrives without pending approval", () => {
      const events = fixtures.simpleTextRun();
      const result = transformAguiToTimelineSteps(events);
      expect(result.hadApprovalPause).toBe(false);
    });

    it("is false when approval is resolved before final RUN_FINISHED", () => {
      const events = fixtures.salesforceApprovalApproved();
      const result = transformAguiToTimelineSteps(events);
      // hadApprovalPause was set during intermediate RUN_FINISHED,
      // but then cleared when the run resumed (sawRunFinishedWithPendingApproval → false)
      expect(result.hadApprovalPause).toBe(false);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles mid-stream state (no RUN_FINISHED yet)", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Working"),
        fixtures.textMessageStart(2, "msg-1"),
        fixtures.textMessageContent(3, "msg-1", "Still working..."),
      ];
      const result = transformAguiToTimelineSteps(events);
      expect(result.isThinking).toBe(true);
      expect(result.isAwaitingApproval).toBe(false);
    });

    it("handles multiple tool calls in same step", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Multi-tool step"),
        fixtures.toolCallStart(2, "tc-1", "execute_sql_query", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(3, "tc-1", '{"query":"SELECT 1"}', {
          stepNumber: 1,
        }),
        fixtures.toolCallEnd(4, "tc-1", { stepNumber: 1 }),
        fixtures.toolCallResult(5, "tc-1", '{"success":true}', {
          stepNumber: 1,
        }),
        fixtures.stepFinished(6, 1, "Multi-tool step"),
        fixtures.runFinished(7),
      ];
      const result = transformAguiToTimelineSteps(events);
      expect(result.steps.length).toBeGreaterThanOrEqual(1);
      expect(result.isThinking).toBe(false);
    });

    it("handles only RUN_STARTED + RUN_FINISHED (empty run)", () => {
      const events = [fixtures.runStarted(0), fixtures.runFinished(1)];
      const result = transformAguiToTimelineSteps(events);
      expect(result.steps).toEqual([]);
      expect(result.isThinking).toBe(false);
      expect(result.finalResponse).toBe("");
    });

    it("does not overwrite already-resolved approval step on duplicate TOOL_CALL_START", () => {
      // Simulate: approval step rejected, then duplicate TOOL_CALL_START arrives
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Update"),
        fixtures.toolCallStart(2, "tc-dup", "request_salesforce_approval", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(
          3,
          "tc-dup",
          JSON.stringify({
            summary: "Update record",
            operations: [
              {
                operation: "update",
                sobject_type: "Opportunity",
                record_name: "Test",
                record_id: "006dup",
                changes: [{ field: "Stage", before: "A", after: "B" }],
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-dup", { stepNumber: 1 }),
        // Intermediate RUN_FINISHED (approval pause)
        fixtures.runFinished(5),
        // After rejection, run resumes and re-sends TOOL_CALL_START
        fixtures.toolCallResult(
          6,
          "tc-dup",
          JSON.stringify({ approved: false, message: "Rejected" }),
          { stepNumber: 1 },
        ),
        fixtures.stepFinished(7, 1, "Update"),
        // Duplicate TOOL_CALL_START for same tool_call_id
        fixtures.toolCallStart(8, "tc-dup", "request_salesforce_approval", {
          stepNumber: 1,
        }),
        fixtures.runFinished(9),
      ];
      const result = transformAguiToTimelineSteps(events);
      // After rejection + STEP_FINISHED, step becomes "complete" with type "approval".
      // The duplicate TOOL_CALL_START should NOT reset it to "awaiting-approval"
      // because the alreadyResolved check catches complete+approval type.
      const approvalStep = result.steps.find((s) => s.type === "approval");
      expect(approvalStep).toBeDefined();
      expect(approvalStep!.status).not.toBe("awaiting-approval");
      expect(approvalStep!.rejectionReason).toBe("Rejected");
    });

    it("TEXT_MESSAGE_CONTENT for explicit final response tracked by message_id", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.textMessageStart(1, "final-id", { isFinalResponse: true }),
        // Subsequent content without is_final_response but same message_id
        fixtures.textMessageContent(2, "final-id", "Part 1 "),
        fixtures.textMessageContent(3, "final-id", "Part 2"),
        fixtures.textMessageEnd(4, "final-id", { isFinalResponse: true }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      expect(result.finalResponse).toBe("Part 1 Part 2");
    });

    it("non-chunked approval result with unparseable JSON defaults to complete", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Action"),
        fixtures.toolCallStart(2, "tc", "request_salesforce_approval", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(
          3,
          "tc",
          '{"summary":"test","operations":[{"operation":"update","sobject_type":"X","record_name":"Y","record_id":"Z","changes":[]}]}',
          {
            stepNumber: 1,
          },
        ),
        fixtures.toolCallEnd(4, "tc", { stepNumber: 1 }),
        // Intermediate RUN_FINISHED
        fixtures.runFinished(5),
        // Non-chunked result with bad JSON
        fixtures.toolCallResult(6, "tc", "not-json", { stepNumber: 1 }),
        fixtures.runFinished(7),
      ];
      const result = transformAguiToTimelineSteps(events);
      // Should default to complete when parse fails
      const step = result.steps.find((s) => s.type === "approval");
      expect(step?.status).toBe("complete");
    });
  });
});

// ── Additional coverage tests ───────────────────────────────────────────

describe("transformAguiToTimelineSteps — additional coverage", () => {
  // ── Chunked (delta) approval results ──

  describe("chunked approval results", () => {
    function approvalPendingBase() {
      return [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Updating"),
        fixtures.toolCallStart(2, "tc-ch", "request_salesforce_approval", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(
          3,
          "tc-ch",
          JSON.stringify({
            summary: "Update record",
            operations: [
              {
                operation: "update",
                sobject_type: "Opportunity",
                record_name: "Deal",
                record_id: "006ch",
                changes: [{ field: "Stage", before: "A", after: "B" }],
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-ch", { stepNumber: 1 }),
        fixtures.runFinished(5), // intermediate
      ];
    }

    it("handles chunked approved result (delta)", () => {
      const events = [
        ...approvalPendingBase(),
        fixtures.toolCallResult(6, "tc-ch", '{"appro', {
          stepNumber: 1,
          isDelta: true,
        }),
        fixtures.toolCallResult(7, "tc-ch", 'ved":true}', {
          stepNumber: 1,
          isDelta: true,
        }),
        fixtures.stepFinished(8, 1, "Updating"),
        fixtures.runFinished(9),
      ];
      const result = transformAguiToTimelineSteps(events);
      expect(result.isAwaitingApproval).toBe(false);
    });

    it("handles chunked rejected result (delta)", () => {
      const events = [
        ...approvalPendingBase(),
        fixtures.toolCallResult(6, "tc-ch", '{"approved":false,', {
          stepNumber: 1,
          isDelta: true,
        }),
        fixtures.toolCallResult(7, "tc-ch", '"message":"No"}', {
          stepNumber: 1,
          isDelta: true,
        }),
        fixtures.stepFinished(8, 1, "Updating"),
        fixtures.runFinished(9),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.rejectionReason);
      expect(step).toBeDefined();
      expect(step!.rejectionReason).toBe("No");
    });

    it("handles chunked error result (delta)", () => {
      const events = [
        ...approvalPendingBase(),
        fixtures.toolCallResult(
          6,
          "tc-ch",
          '{"success":false,"error":"Timeout"}',
          { stepNumber: 1, isDelta: true },
        ),
        fixtures.stepFinished(8, 1, "Updating"),
        fixtures.runFinished(9),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.errorMessage);
      expect(step).toBeDefined();
      expect(step!.errorMessage).toBe("Timeout");
    });

    it("handles chunked non-approval artifact result (delta)", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Chart"),
        fixtures.toolCallStart(2, "tc-art", "create_chart", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(3, "tc-art", '{"type":"bar"}', {
          stepNumber: 1,
        }),
        fixtures.toolCallEnd(4, "tc-art", { stepNumber: 1 }),
        fixtures.toolCallResult(
          5,
          "tc-art",
          '{"_artifact":{"success":true,"artifact_id":"a1","run_id":"r1","tool_name":"create_chart","artifact_type":"chart"}}',
          { stepNumber: 1, isDelta: true },
        ),
        fixtures.stepFinished(6, 1, "Chart"),
        fixtures.runFinished(7),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.artifact);
      expect(step).toBeDefined();
      expect(step!.artifact!.artifact_id).toBe("a1");
    });

    it("handles chunked failed artifact result (delta)", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Chart:"),
        fixtures.toolCallStart(2, "tc-fart", "create_chart", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(3, "tc-fart", '{"type":"bar"}', {
          stepNumber: 1,
        }),
        fixtures.toolCallEnd(4, "tc-fart", { stepNumber: 1 }),
        fixtures.toolCallResult(
          5,
          "tc-fart",
          '{"_artifact":{"success":false}}',
          {
            stepNumber: 1,
            isDelta: true,
          },
        ),
        fixtures.stepFinished(6, 1, "Chart:"),
        fixtures.runFinished(7),
      ];
      const result = transformAguiToTimelineSteps(events);
      expect(result.steps.find((s) => s.text === "Chart:")).toBeUndefined();
    });

    it("handles chunked failed non-artifact result (delta)", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Query:"),
        fixtures.toolCallStart(2, "tc-fail", "execute_sql_query", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(3, "tc-fail", '{"query":"BAD"}', {
          stepNumber: 1,
        }),
        fixtures.toolCallEnd(4, "tc-fail", { stepNumber: 1 }),
        fixtures.toolCallResult(5, "tc-fail", '{"success":false}', {
          stepNumber: 1,
          isDelta: true,
        }),
        fixtures.stepFinished(6, 1, "Query:"),
        fixtures.runFinished(7),
      ];
      const result = transformAguiToTimelineSteps(events);
      expect(result.steps.find((s) => s.text === "Query:")).toBeUndefined();
    });
  });

  // ── Non-chunked result edge cases ──

  describe("non-chunked result edge cases", () => {
    it("handles non-chunked non-approval result with unparseable JSON", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Query"),
        fixtures.toolCallStart(2, "tc-bad", "execute_sql_query", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(3, "tc-bad", '{"query":"SELECT 1"}', {
          stepNumber: 1,
        }),
        fixtures.toolCallEnd(4, "tc-bad", { stepNumber: 1 }),
        fixtures.toolCallResult(5, "tc-bad", "not-json-at-all", {
          stepNumber: 1,
        }),
        fixtures.stepFinished(6, 1, "Query"),
        fixtures.runFinished(7),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.text === "Query");
      expect(step?.status).toBe("complete");
    });

    it("handles non-chunked approval result with default else branch", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Action"),
        fixtures.toolCallStart(2, "tc-def", "request_salesforce_approval", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(
          3,
          "tc-def",
          JSON.stringify({
            summary: "Test",
            operations: [
              {
                operation: "update",
                sobject_type: "Account",
                record_name: "A",
                record_id: "001",
                changes: [],
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-def", { stepNumber: 1 }),
        fixtures.runFinished(5), // intermediate
        fixtures.toolCallResult(
          6,
          "tc-def",
          JSON.stringify({ status: "unknown" }),
          { stepNumber: 1 },
        ),
        fixtures.runFinished(7),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.type === "approval");
      expect(step?.status).toBe("complete");
    });
  });

  // ── Tool call step lookup fallbacks ──

  describe("tool call step lookup fallbacks", () => {
    it("looks up step via toolCallToStepMap when result has no step_number", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Query"),
        fixtures.toolCallStart(2, "tc-lookup", "execute_sql_query", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(3, "tc-lookup", '{"query":"SELECT 1"}', {
          stepNumber: 1,
        }),
        fixtures.toolCallEnd(4, "tc-lookup", { stepNumber: 1 }),
        fixtures.toolCallResult(5, "tc-lookup", '{"success":true}'),
        fixtures.stepFinished(6, 1, "Query"),
        fixtures.runFinished(7),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.text === "Query");
      expect(step?.status).toBe("complete");
    });
  });

  // ── Calendar approval with more fields ──

  describe("calendar approval field extraction", () => {
    it("extracts duration, location, description from direct calendar approval", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Calendar"),
        fixtures.toolCallStart(
          2,
          "tc-cal-full",
          "request_google_calendar_approval",
          { stepNumber: 1 },
        ),
        fixtures.toolCallArgs(
          3,
          "tc-cal-full",
          JSON.stringify({
            summary: "Meeting",
            event_summary: "All hands",
            start_datetime: "2024-01-15T10:00:00Z",
            end_datetime: "2024-01-15T11:00:00Z",
            duration_minutes: 60,
            attendees: ["alice@test.com"],
            location: "Room 1",
            description: "Monthly all-hands meeting",
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-cal-full", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      expect(step?.approval?.fields?.["Duration"]).toBe("60 minutes");
      expect(step!.approval!.fields!["Location"]).toBe("Room 1");
      expect(step!.approval!.fields!["Description"]).toBe(
        "Monthly all-hands meeting",
      );
      expect(step!.approval!.fields!["Attendees"]).toBe("alice@test.com");
    });

    it("extracts fields from bulk calendar operations", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Bulk Cal"),
        fixtures.toolCallStart(
          2,
          "tc-bcal",
          "request_google_calendar_approval",
          { stepNumber: 1 },
        ),
        fixtures.toolCallArgs(
          3,
          "tc-bcal",
          JSON.stringify({
            summary: "Multiple events",
            operations: [
              {
                operation: "create",
                summary: "Meeting 1",
                start_datetime: "2024-01-15T10:00:00Z",
                end_datetime: "2024-01-15T10:30:00Z",
                duration_minutes: 30,
                attendees_emails: ["a@t.com"],
                location: "Room A",
                description: "First meeting",
              },
              {
                operation: "create",
                summary: "Meeting 2",
                start_datetime: "2024-01-15T14:00:00Z",
                end_datetime: "2024-01-15T14:30:00Z",
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-bcal", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      expect(step?.approval?.bulkRecords).toBeDefined();
      expect(step!.approval!.bulkRecords!.length).toBe(2);
      expect(step!.approval!.bulkRecords![0].changes.length).toBeGreaterThan(0);
    });
  });

  // ── Analytics operations ──

  describe("analytics operations", () => {
    it("normalizes update_report with explicit changes", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Updating report"),
        fixtures.toolCallStart(2, "tc-upd", "request_salesforce_approval", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(
          3,
          "tc-upd",
          JSON.stringify({
            summary: "Update report",
            operations: [
              {
                operation: "update_report",
                report_id: "00Oxxx",
                report_name: "Q1 Pipeline",
                changes: [
                  { field: "Report Name", before: "Old", after: "Q1 Pipeline" },
                ],
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-upd", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      // Single operation: normalized operation is on approval.operation directly
      expect(step?.approval?.operation).toBe("update");
    });

    it("normalizes update_report without changes (builds from params)", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Report"),
        fixtures.toolCallStart(2, "tc-upd2", "request_salesforce_approval", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(
          3,
          "tc-upd2",
          JSON.stringify({
            summary: "Update report",
            operations: [
              {
                operation: "update_report",
                report_id: "00Oxxx",
                report_name: "My Report",
                description: "Updated desc",
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-upd2", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      expect(step?.approval?.changes).toBeDefined();
    });

    it("normalizes clone_dashboard operation", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Clone"),
        fixtures.toolCallStart(2, "tc-clone", "request_salesforce_approval", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(
          3,
          "tc-clone",
          JSON.stringify({
            summary: "Clone dashboard",
            operations: [
              {
                operation: "clone_dashboard",
                source_dashboard_id: "01Zxxx",
                description: "Cloned",
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-clone", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      // Single operation: check approval.operation and recordName
      expect(step?.approval?.operation).toBe("create");
      expect(step?.approval?.recordName).toContain("01Zxxx");
    });
  });

  // ── Tooling API with picklist valueSet ──

  describe("tooling API normalization", () => {
    it("normalizes picklist Metadata with valueSet", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Picklist"),
        fixtures.toolCallStart(2, "tc-pick", "salesforce_tooling_mutate", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(
          3,
          "tc-pick",
          JSON.stringify({
            summary: "Create picklist",
            operations: [
              {
                operation: "create",
                sobject_type: "CustomField",
                record_name: "Account.Status__c",
                fields: {
                  FullName: "Account.Status__c",
                  Metadata: {
                    type: "Picklist",
                    label: "Status",
                    valueSet: {
                      valueSetDefinition: {
                        value: [
                          {
                            label: "Active",
                            fullName: "Active",
                            default: true,
                          },
                          { label: "Inactive", fullName: "Inactive" },
                        ],
                      },
                    },
                  },
                  ExtraField: "extra",
                },
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-pick", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      expect(step?.approval?.fields?.["Field Type"]).toBe("Picklist");
      expect(step?.approval?.fields?.["Label"]).toBe("Status");
      expect(step?.approval?.fields?.["Picklist Values"]).toContain("Active");
      expect(step?.approval?.fields?.["Picklist Values"]).toContain(
        "(default)",
      );
      expect(step?.approval?.fields?.["ExtraField"]).toBe("extra");
    });

    it("stringifies nested object values in non-Metadata fields", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Tooling"),
        fixtures.toolCallStart(2, "tc-nest", "salesforce_tooling_mutate", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(
          3,
          "tc-nest",
          JSON.stringify({
            summary: "Create field",
            operations: [
              {
                operation: "create",
                sobject_type: "CustomField",
                record_name: "Account.X__c",
                fields: {
                  FullName: "Account.X__c",
                  Metadata: { type: "Text", label: "X" },
                  SomeComplex: { nested: true },
                },
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-nest", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      expect(step?.approval?.fields?.["SomeComplex"]).toBe('{"nested":true}');
    });
  });

  // ── stringifyAnalyticsValue branches ──

  describe("analytics value stringification", () => {
    it("stringifies array of objects as count and object with chartType", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Report"),
        fixtures.toolCallStart(2, "tc-av", "request_salesforce_approval", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(
          3,
          "tc-av",
          JSON.stringify({
            summary: "Create report",
            operations: [
              {
                operation: "create_report",
                report_name: "Test",
                report_filters: [
                  { field: "Stage", operator: "equals", value: "Open" },
                ],
                chart: { chartType: "bar", title: "Pipeline" },
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-av", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      expect(step?.approval?.fields?.["Filters"]).toBe("1 item(s)");
      expect(step?.approval?.fields?.["Chart"]).toBe("bar — Pipeline");
    });
  });

  // ── Generic approval: action normalization ──

  describe("generic approval action normalization", () => {
    it("normalizes add action to create", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Add"),
        fixtures.toolCallStart(2, "tc-add", "some_tool", { stepNumber: 1 }),
        fixtures.toolCallArgs(
          3,
          "tc-add",
          JSON.stringify({
            summary: "Add user",
            action: "add",
            resource: "New User",
            resource_type: "User",
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-add", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      expect(step?.approval?.operation).toBe("create");
    });

    it("normalizes remove action to delete", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Remove"),
        fixtures.toolCallStart(2, "tc-rm", "some_tool", { stepNumber: 1 }),
        fixtures.toolCallArgs(
          3,
          "tc-rm",
          JSON.stringify({
            summary: "Remove user",
            action: "remove",
            resource: "Old User",
            resource_type: "User",
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-rm", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      expect(step?.approval?.operation).toBe("delete");
    });
  });

  // ── Changes with display_name ──

  describe("normalizeChanges edge cases", () => {
    it("preserves display_name in normalized changes", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Update"),
        fixtures.toolCallStart(2, "tc-dn", "request_salesforce_approval", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(
          3,
          "tc-dn",
          JSON.stringify({
            summary: "Update",
            operations: [
              {
                operation: "update",
                sobject_type: "Account",
                record_name: "Acme",
                record_id: "001dn",
                changes: [
                  {
                    field: "Custom__c",
                    before: "Old",
                    after: "New",
                    display_name: "Custom Label",
                  },
                ],
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-dn", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((step?.approval?.changes?.[0] as any)?.display_name).toBe(
        "Custom Label",
      );
    });
  });

  // ── Bulk SF records with fields but no changes ──

  describe("bulk SF records fields-to-changes conversion", () => {
    it("converts fields to changes for records without explicit changes", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Bulk create"),
        fixtures.toolCallStart(2, "tc-bsf", "request_salesforce_approval", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(
          3,
          "tc-bsf",
          JSON.stringify({
            summary: "Create accounts",
            operations: [
              {
                operation: "create",
                sobject_type: "Account",
                record_name: "NewCo",
                record_id: "001new",
                fields: { Name: "NewCo", Industry: "Tech" },
              },
              {
                operation: "create",
                sobject_type: "Account",
                record_name: "OldCo",
                record_id: "001old",
                changes: [{ field: "Name", after: "OldCo" }],
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-bsf", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      expect(step?.approval?.bulkRecords?.length).toBe(2);
    });
  });

  // ── Deep research approval label ──

  describe("deep research approval labels", () => {
    it("sets deep research label and research query", () => {
      const events = fixtures.deepResearchApprovalPending();
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      expect(step?.approval?.approvalType).toBe("deep_research");
      expect(step?.approval?.label).toBe("Deep Research");
      expect(step?.approval?.researchQuery).toBe(
        "What are the pipeline trends for Q1?",
      );
    });
  });

  // ── Single calendar operation with all fields ──

  describe("single calendar operation with all field types", () => {
    it("extracts duration, attendees, location, description from single calendar op", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Calendar event"),
        fixtures.toolCallStart(
          2,
          "tc-cal-single",
          "request_google_calendar_approval",
          { stepNumber: 1 },
        ),
        fixtures.toolCallArgs(
          3,
          "tc-cal-single",
          JSON.stringify({
            summary: "Create meeting",
            operations: [
              {
                operation: "create",
                summary: "Team meeting",
                start_datetime: "2024-01-15T10:00:00Z",
                end_datetime: "2024-01-15T11:00:00Z",
                duration_minutes: 60,
                attendees_emails: ["alice@test.com"],
                location: "Room 1",
                description: "Weekly standup",
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-cal-single", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      expect(step?.approval?.fields?.["Duration"]).toBe("60 minutes");
      expect(step?.approval?.fields?.["Attendees"]).toBe("alice@test.com");
      expect(step?.approval?.fields?.["Location"]).toBe("Room 1");
      expect(step?.approval?.fields?.["Description"]).toBe("Weekly standup");
    });
  });

  // ── Calendar bulk records: changes from calendar-specific fields ──

  describe("calendar bulk records changes from fields", () => {
    it("builds changes from calendar fields when no explicit changes or fields exist", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Scheduling"),
        fixtures.toolCallStart(
          2,
          "tc-cal-br",
          "request_google_calendar_approval",
          { stepNumber: 1 },
        ),
        fixtures.toolCallArgs(
          3,
          "tc-cal-br",
          JSON.stringify({
            summary: "Schedule events",
            operations: [
              {
                operation: "create",
                summary: "Event 1",
                start_datetime: "2024-01-15T10:00:00Z",
                end_datetime: "2024-01-15T10:30:00Z",
                duration_minutes: 30,
                attendees_emails: ["a@t.com"],
              },
              {
                operation: "create",
                summary: "Event 2",
                start_datetime: "2024-01-15T14:00:00Z",
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-cal-br", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      // Bulk records should have changes built from calendar-specific fields
      const records = step?.approval?.bulkRecords;
      expect(records).toBeDefined();
      expect(records!.length).toBe(2);
      // First record has start, end, duration, attendees
      expect(records![0].changes.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ── removeTrailingColonFromPreviousStep ──

  describe("removeTrailingColonFromPreviousStep", () => {
    it("removes trailing colon from previous reasoning step when tool step is removed", () => {
      const events = [
        fixtures.runStarted(0),
        // Reasoning step that ends with a colon
        fixtures.textMessageStart(1, "reason-colon"),
        fixtures.textMessageContent(2, "reason-colon", "Here are the results:"),
        fixtures.textMessageEnd(3, "reason-colon"),
        // Tool step that will fail and be removed
        fixtures.stepStarted(4, 1, "Running query"),
        fixtures.toolCallStart(5, "tc-rm-colon", "execute_sql_query", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(6, "tc-rm-colon", '{"query":"SELECT"}', {
          stepNumber: 1,
        }),
        fixtures.toolCallEnd(7, "tc-rm-colon", { stepNumber: 1 }),
        fixtures.toolCallResult(
          8,
          "tc-rm-colon",
          JSON.stringify({ success: false, error: "Failed" }),
          { stepNumber: 1 },
        ),
        fixtures.stepFinished(9, 1, "Running query"),
        fixtures.textMessageStart(10, "final-1", { isFinalResponse: true }),
        fixtures.textMessageContent(11, "final-1", "Query failed.", {
          isFinalResponse: true,
        }),
        fixtures.textMessageEnd(12, "final-1", { isFinalResponse: true }),
        fixtures.runFinished(13),
      ];
      const result = transformAguiToTimelineSteps(events);
      // The reasoning step's trailing colon should be removed
      const reasoningStep = result.steps.find((s) =>
        s.text?.includes("Here are the results"),
      );
      expect(reasoningStep).toBeDefined();
      expect(reasoningStep!.text).toBe("Here are the results");
      // Not "Here are the results:"
    });
  });

  // ── Intermediate RUN_FINISHED marks in-progress steps complete ──

  describe("intermediate RUN_FINISHED with in-progress steps", () => {
    it("marks non-approval in-progress steps as complete on intermediate RUN_FINISHED", () => {
      const events = [
        fixtures.runStarted(0),
        // First step: in-progress (no tool call, just a reasoning step)
        fixtures.stepStarted(1, 1, "Fetching data"),
        // Second step: approval tool call
        fixtures.stepStarted(2, 2, "Requesting approval"),
        fixtures.toolCallStart(3, "tc-int", "request_salesforce_approval", {
          stepNumber: 2,
        }),
        fixtures.toolCallArgs(
          4,
          "tc-int",
          JSON.stringify({
            summary: "Update",
            operations: [
              {
                operation: "update",
                sobject_type: "Opportunity",
                record_name: "Deal",
                record_id: "006",
                changes: [{ field: "Stage", before: "A", after: "B" }],
              },
            ],
          }),
          { stepNumber: 2 },
        ),
        fixtures.toolCallEnd(5, "tc-int", { stepNumber: 2 }),
        // Intermediate RUN_FINISHED
        fixtures.runFinished(6),
      ];
      const result = transformAguiToTimelineSteps(events);
      // Step 1 should be marked complete (was in-progress)
      const fetchStep = result.steps.find((s) => s.text === "Fetching data");
      expect(fetchStep?.status).toBe("complete");
      // Step 2 should remain awaiting-approval
      const approvalStep = result.steps.find(
        (s) => s.status === "awaiting-approval",
      );
      expect(approvalStep).toBeDefined();
    });
  });

  // ── SF bulk records with tooling fields (no changes) → converts fields to changes ──

  describe("SF bulk records tooling fields conversion", () => {
    it("converts tooling fields to changes for bulk records without changes", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Bulk tooling"),
        fixtures.toolCallStart(2, "tc-bt", "salesforce_tooling_mutate", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(
          3,
          "tc-bt",
          JSON.stringify({
            summary: "Create fields",
            operations: [
              {
                operation: "create",
                sobject_type: "CustomField",
                record_name: "Account.Field1__c",
                record_id: "field1",
                fields: {
                  FullName: "Account.Field1__c",
                  Metadata: { type: "Text", label: "Field 1" },
                },
              },
              {
                operation: "create",
                sobject_type: "CustomField",
                record_name: "Account.Field2__c",
                record_id: "field2",
                fields: {
                  FullName: "Account.Field2__c",
                  Metadata: { type: "Number", label: "Field 2" },
                },
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-bt", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      expect(step?.approval?.bulkRecords).toBeDefined();
      expect(step!.approval!.bulkRecords!.length).toBe(2);
      // Each record should have changes derived from tooling fields
      expect(step!.approval!.bulkRecords![0].changes.length).toBeGreaterThan(0);
    });
  });

  // ── Pattern 2: Direct calendar with duration_minutes and attendees ──

  describe("direct calendar approval edge cases", () => {
    it("extracts duration_minutes and string attendees from Pattern 2 calendar", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Calendar"),
        fixtures.toolCallStart(
          2,
          "tc-cal-p2",
          "request_google_calendar_approval",
          { stepNumber: 1 },
        ),
        fixtures.toolCallArgs(
          3,
          "tc-cal-p2",
          JSON.stringify({
            summary: "Create event",
            event_summary: "Quick sync",
            start_datetime: "2024-01-15T10:00:00Z",
            duration_minutes: 15,
            attendees: ["bob@test.com", "carol@test.com"],
            location: "Zoom",
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-cal-p2", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      expect(step?.approval?.fields?.["Duration"]).toBe("15 minutes");
      expect(step?.approval?.fields?.["Attendees"]).toBe(
        "bob@test.com, carol@test.com",
      );
      expect(step?.approval?.fields?.["Location"]).toBe("Zoom");
    });
  });

  // ── Calendar ops with `attendees` (not `attendees_emails`) ──

  describe("calendar attendees field variants", () => {
    it("uses attendees (not attendees_emails) in single calendar op", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Calendar"),
        fixtures.toolCallStart(
          2,
          "tc-att",
          "request_google_calendar_approval",
          { stepNumber: 1 },
        ),
        fixtures.toolCallArgs(
          3,
          "tc-att",
          JSON.stringify({
            summary: "Meeting",
            operations: [
              {
                operation: "create",
                summary: "Sync",
                start_datetime: "2024-01-15T10:00:00Z",
                end_datetime: "2024-01-15T10:30:00Z",
                attendees: ["x@t.com"],
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-att", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      expect(step?.approval?.fields?.["Attendees"]).toBe("x@t.com");
    });
  });

  // ── Calendar bulk: op with `fields` object ──

  describe("calendar bulk op with fields object", () => {
    it("uses op.fields when available in calendar bulk record", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Bulk Cal"),
        fixtures.toolCallStart(
          2,
          "tc-cbf",
          "request_google_calendar_approval",
          { stepNumber: 1 },
        ),
        fixtures.toolCallArgs(
          3,
          "tc-cbf",
          JSON.stringify({
            summary: "Events",
            operations: [
              {
                operation: "create",
                summary: "Event A",
                start_datetime: "2024-01-15T10:00:00Z",
                fields: { Location: "Room A", Note: "Important" },
              },
              {
                operation: "create",
                summary: "Event B",
                start_datetime: "2024-01-15T14:00:00Z",
                end_datetime: "2024-01-15T14:30:00Z",
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-cbf", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      // First record has fields → changes built from fields
      const records = step?.approval?.bulkRecords;
      expect(records).toBeDefined();
      expect(records![0].changes.length).toBeGreaterThan(0);
    });
  });

  // ── Analytics: stringifyAnalyticsValue edge cases ──

  describe("analytics stringifyAnalyticsValue edge cases", () => {
    it("stringifies generic object (no chartType) and number value", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Report"),
        fixtures.toolCallStart(2, "tc-sv", "request_salesforce_approval", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(
          3,
          "tc-sv",
          JSON.stringify({
            summary: "Create report",
            operations: [
              {
                operation: "create_report",
                report_name: "Test",
                aggregates: { sum: "Amount" },
                filter_logic: 123,
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-sv", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      // aggregates is a non-chart object → JSON.stringify
      expect(step?.approval?.fields?.["Aggregates"]).toBe('{"sum":"Amount"}');
      // filter_logic is a number → String(123)
      expect(step?.approval?.fields?.["Filter Logic"]).toBe("123");
    });
  });

  // ── Generic approval: unknown action defaults to "update" ──

  describe("generic approval unknown action", () => {
    it("defaults to update for unknown action in action/resource pattern", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Modify"),
        fixtures.toolCallStart(2, "tc-mod", "some_tool", { stepNumber: 1 }),
        fixtures.toolCallArgs(
          3,
          "tc-mod",
          JSON.stringify({
            summary: "Modify settings",
            action: "modify",
            resource: "Config",
            resource_type: "Settings",
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-mod", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      expect(step?.approval?.operation).toBe("update");
    });
  });

  // ── Analytics: record_name fallbacks ──

  describe("analytics record_name fallbacks", () => {
    it("falls back to report_id for record_name", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Delete"),
        fixtures.toolCallStart(2, "tc-del", "request_salesforce_approval", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(
          3,
          "tc-del",
          JSON.stringify({
            summary: "Delete report",
            operations: [
              {
                operation: "delete_report",
                report_id: "00O-del-001",
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-del", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      expect(step?.approval?.recordName).toContain("00O-del-001");
      expect(step?.approval?.operation).toBe("delete");
    });

    it("falls back to dashboard_id for record_name", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Update"),
        fixtures.toolCallStart(2, "tc-ud", "request_salesforce_approval", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(
          3,
          "tc-ud",
          JSON.stringify({
            summary: "Update dashboard",
            operations: [
              {
                operation: "update_dashboard",
                dashboard_id: "01Z-upd-001",
                description: "Updated",
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-ud", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      expect(step?.approval?.recordName).toContain("01Z-upd-001");
    });
  });

  // ── mergeFieldsIntoChanges: change with non-null after (no-op) ──

  describe("mergeFieldsIntoChanges no-op path", () => {
    it("does not overwrite change.after when it is not null", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Update"),
        fixtures.toolCallStart(2, "tc-noop", "request_salesforce_approval", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(
          3,
          "tc-noop",
          JSON.stringify({
            summary: "Update",
            operations: [
              {
                operation: "update",
                sobject_type: "Account",
                record_name: "Test",
                record_id: "001",
                changes: [{ field: "Name", after: "Existing" }],
                fields: { Name: "FieldValue" },
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-noop", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      // after is not null, so mergeFieldsIntoChanges should not overwrite
      expect(step?.approval?.changes?.[0]?.after).toBe("Existing");
    });
  });

  // ── Bulk calendar ops with `attendees` and explicit changes ──

  describe("bulk calendar with attendees and explicit changes", () => {
    it("handles attendees field and explicit changes in bulk calendar ops", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Bulk Cal"),
        fixtures.toolCallStart(
          2,
          "tc-bca",
          "request_google_calendar_approval",
          { stepNumber: 1 },
        ),
        fixtures.toolCallArgs(
          3,
          "tc-bca",
          JSON.stringify({
            summary: "Schedule",
            operations: [
              {
                operation: "update",
                summary: "Event 1",
                start_datetime: "2024-01-15T10:00:00Z",
                attendees: ["x@t.com"],
                changes: [
                  { field: "Summary", before: "Old", after: "Event 1" },
                ],
              },
              {
                operation: "create",
                summary: "Event 2",
                start_datetime: "2024-01-15T14:00:00Z",
                attendees_emails: ["y@t.com"],
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-bca", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      expect(step?.approval?.approvalType).toBe("bulk");
      const records = step?.approval?.bulkRecords;
      expect(records!.length).toBe(2);
      // First record has explicit changes
      expect(records![0].changes.length).toBeGreaterThan(0);
    });
  });

  // ── SF bulk: record with no changes AND no tooling fields (empty changes) ──

  describe("SF bulk record with no changes or fields", () => {
    it("produces empty changes for record without changes or fields", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Bulk"),
        fixtures.toolCallStart(2, "tc-empty", "request_salesforce_approval", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(
          3,
          "tc-empty",
          JSON.stringify({
            summary: "Bulk update",
            operations: [
              {
                operation: "update",
                sobject_type: "Account",
                record_name: "Acme",
                record_id: "001a",
              },
              {
                operation: "update",
                sobject_type: "Account",
                record_name: "Beta",
                record_id: "001b",
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-empty", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      const records = step?.approval?.bulkRecords;
      expect(records).toBeDefined();
      // Records without changes or fields should have empty changes array
      expect(records![0].changes).toEqual([]);
    });
  });

  // ── Analytics: all record_name fallbacks fail → "Unknown" ──

  describe("analytics Unknown record_name fallback", () => {
    it("falls back to Unknown when no name fields present", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Report"),
        fixtures.toolCallStart(2, "tc-unk", "request_salesforce_approval", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(
          3,
          "tc-unk",
          JSON.stringify({
            summary: "Create report",
            operations: [{ operation: "create_report" }],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-unk", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      expect(step?.approval?.recordName).toBe("Unknown");
    });
  });

  // ── TEXT_MESSAGE_END without is_final_response flag but matching message_id ──

  describe("TEXT_MESSAGE_END matching final response by message_id", () => {
    it("completes final response when END matches by message_id only", () => {
      const events = [
        fixtures.runStarted(0),
        // START has is_final_response, subsequent events don't
        fixtures.textMessageStart(1, "fr-id", { isFinalResponse: true }),
        fixtures.textMessageContent(2, "fr-id", "Answer"),
        // END without is_final_response but same message_id
        fixtures.textMessageEnd(3, "fr-id"),
        fixtures.runFinished(4),
      ];
      const result = transformAguiToTimelineSteps(events);
      expect(result.finalResponse).toBe("Answer");
      expect(result.isFinalResponseStreaming).toBe(false);
    });
  });

  // ── Chunked approval result: default to complete (no approved/error fields) ──

  describe("chunked approval default complete", () => {
    it("defaults to complete for chunked approval result without approved/error", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Action"),
        fixtures.toolCallStart(2, "tc-def-ch", "request_salesforce_approval", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(
          3,
          "tc-def-ch",
          JSON.stringify({
            summary: "Update",
            operations: [
              {
                operation: "update",
                sobject_type: "Account",
                record_name: "X",
                record_id: "001",
                changes: [],
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-def-ch", { stepNumber: 1 }),
        fixtures.runFinished(5), // intermediate
        // Chunked result with unknown shape (no approved, no error)
        fixtures.toolCallResult(6, "tc-def-ch", '{"status":"done"}', {
          stepNumber: 1,
          isDelta: true,
        }),
        fixtures.stepFinished(7, 1, "Action"),
        fixtures.runFinished(8),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.type === "approval");
      expect(step?.status).toBe("complete");
    });
  });

  // ── Pattern 2 calendar: string attendees (not array) ──

  describe("Pattern 2 calendar string attendees", () => {
    it("handles string attendees in direct calendar approval", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Cal"),
        fixtures.toolCallStart(
          2,
          "tc-str-att",
          "request_google_calendar_approval",
          { stepNumber: 1 },
        ),
        fixtures.toolCallArgs(
          3,
          "tc-str-att",
          JSON.stringify({
            summary: "Event",
            event_summary: "Quick chat",
            start_datetime: "2024-01-15T10:00:00Z",
            attendees: "bob@test.com",
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-str-att", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      // String attendees should be used directly
      expect(step?.approval?.fields?.["Attendees"]).toBe("bob@test.com");
    });
  });

  // ── getApprovalType generic fallback ──

  describe("getApprovalType generic fallback", () => {
    it("returns generic approval type for non-SF non-calendar tool", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Custom"),
        fixtures.toolCallStart(2, "tc-gen", "custom_approval_tool", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(
          3,
          "tc-gen",
          JSON.stringify({
            approval_required: true,
            summary: "Custom action",
            record_name: "Test",
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-gen", { stepNumber: 1 }),
        fixtures.runFinished(5),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "awaiting-approval");
      // Tool name "custom_approval_tool" is not SF or calendar
      // So early detection doesn't set it as approval; only detectApprovalFromArgs does
      expect(step?.approval?.approvalType).toBe("generic");
    });
  });
});

// ── Scenarios added for recent fixes ─────────────────────────────────────

describe("transformAguiToTimelineSteps — recent fix coverage", () => {
  // Helper: builds a pending SF approval base that ends with intermediate RUN_FINISHED
  function approvalPendingBase(
    toolCallId = "tc-fix",
    toolName = "request_salesforce_approval",
  ) {
    return [
      fixtures.runStarted(0),
      fixtures.stepStarted(1, 1, "Updating"),
      fixtures.toolCallStart(2, toolCallId, toolName, { stepNumber: 1 }),
      fixtures.toolCallArgs(
        3,
        toolCallId,
        JSON.stringify({
          summary: "Update record",
          operations: [
            {
              operation: "update",
              sobject_type: "Opportunity",
              record_name: "Deal",
              record_id: "006fix",
              changes: [{ field: "Stage", before: "A", after: "B" }],
            },
          ],
        }),
        { stepNumber: 1 },
      ),
      fixtures.toolCallEnd(4, toolCallId, { stepNumber: 1 }),
      fixtures.runFinished(5), // intermediate — sets sawRunFinishedWithPendingApproval
    ];
  }

  // ── Expired before approved (priority ordering) ────────────────────────

  describe("expired status takes priority over approved", () => {
    it("treats a malformed response with both approved:true and status:expired as expired (chunked)", () => {
      const events = [
        ...approvalPendingBase(),
        // Chunked result with both fields
        fixtures.toolCallResult(
          6,
          "tc-fix",
          JSON.stringify({
            approved: true,
            status: "expired",
            message: "Session expired",
          }),
          { stepNumber: 1 },
        ),
        fixtures.stepFinished(7, 1, "Updating"),
        fixtures.runFinished(8),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.approval);
      expect(step?.status).toBe("expired");
      expect(step?.errorMessage).toBe("Session expired");
    });

    it("treats a malformed response with both approved:true and status:expired as expired (non-chunked)", () => {
      const events = [
        ...approvalPendingBase(),
        // Non-chunked result arrives as full content (no isDelta)
        fixtures.toolCallResult(
          6,
          "tc-fix",
          JSON.stringify({ approved: true, status: "expired" }),
          { stepNumber: 1 },
        ),
        fixtures.stepFinished(7, 1, "Updating"),
        fixtures.runFinished(8),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.approval);
      expect(step?.status).toBe("expired");
      expect(step?.errorMessage).toBe(DEFAULT_EXPIRED_APPROVAL_MESSAGE);
    });
  });

  // ── hadApprovalPause cleared after backend-initiated expiry ────────────

  describe("hadApprovalPause cleared after expiry", () => {
    it("clears hadApprovalPause when TOOL_CALL_RESULT expires the approval before final RUN_FINISHED", () => {
      const events = [
        ...approvalPendingBase(),
        // Backend sends expired result — resolves the pending approval
        fixtures.toolCallResult(
          6,
          "tc-fix",
          JSON.stringify({ status: "expired", message: "Timed out" }),
          { stepNumber: 1 },
        ),
        fixtures.stepFinished(7, 1, "Updating"),
        // Final RUN_FINISHED — should NOT be treated as transitional
        fixtures.runFinished(8),
      ];
      const result = transformAguiToTimelineSteps(events);
      expect(result.hadApprovalPause).toBe(false);
      expect(result.isThinking).toBe(false);
      expect(result.isExpiredApproval).toBe(true);
    });

    it("keeps hadApprovalPause true when approval is still pending at final RUN_FINISHED", () => {
      // Only the intermediate RUN_FINISHED, no resolution
      const events = approvalPendingBase();
      const result = transformAguiToTimelineSteps(events);
      expect(result.hadApprovalPause).toBe(true);
      expect(result.isAwaitingApproval).toBe(true);
    });
  });

  // ── isExpiredApproval flag ─────────────────────────────────────────────

  describe("isExpiredApproval flag", () => {
    it("is true when a step has expired status", () => {
      const events = [
        ...approvalPendingBase(),
        fixtures.toolCallResult(
          6,
          "tc-fix",
          JSON.stringify({ status: "expired" }),
          { stepNumber: 1 },
        ),
        fixtures.stepFinished(7, 1, "Updating"),
        fixtures.runFinished(8),
      ];
      const result = transformAguiToTimelineSteps(events);
      expect(result.isExpiredApproval).toBe(true);
    });

    it("is false when approval is approved normally", () => {
      const events = fixtures.salesforceApprovalApproved();
      const result = transformAguiToTimelineSteps(events);
      expect(result.isExpiredApproval).toBe(false);
    });

    it("is false when approval is rejected", () => {
      const events = fixtures.salesforceApprovalRejected();
      const result = transformAguiToTimelineSteps(events);
      expect(result.isExpiredApproval).toBe(false);
    });
  });

  // ── getExpiredApprovalFields helper (via integration) ──────────────────

  describe("expired approval fields", () => {
    it("sets default errorMessage when result has no message", () => {
      const events = [
        ...approvalPendingBase(),
        fixtures.toolCallResult(
          6,
          "tc-fix",
          JSON.stringify({ status: "expired" }),
          { stepNumber: 1 },
        ),
        fixtures.stepFinished(7, 1, "Updating"),
        fixtures.runFinished(8),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "expired");
      expect(step?.errorMessage).toBe(DEFAULT_EXPIRED_APPROVAL_MESSAGE);
    });

    it("uses custom message from result when provided", () => {
      const events = [
        ...approvalPendingBase(),
        fixtures.toolCallResult(
          6,
          "tc-fix",
          JSON.stringify({
            status: "expired",
            message: "Custom expiry reason",
          }),
          { stepNumber: 1 },
        ),
        fixtures.stepFinished(7, 1, "Updating"),
        fixtures.runFinished(8),
      ];
      const result = transformAguiToTimelineSteps(events);
      const step = result.steps.find((s) => s.status === "expired");
      expect(step?.errorMessage).toBe("Custom expiry reason");
    });
  });

  // ── Retry step removal cleans up map entries ───────────────────────────

  describe("retry step removal", () => {
    it("removes step and cleans up when finalization encounters retry:true", () => {
      // Build events where the approval tool result has retry:true
      // (validation error — agent sent bad args). The result is only
      // accumulated; it's resolved in the finalization loop.
      const events = [
        ...approvalPendingBase(),
        // Chunked retry result — accumulated during streaming, resolved in finalization
        fixtures.toolCallResult(
          6,
          "tc-fix",
          JSON.stringify({ success: false, retry: true }),
          { stepNumber: 1, isDelta: true },
        ),
        fixtures.runFinished(7),
      ];
      const result = transformAguiToTimelineSteps(events);
      // The approval step should be removed entirely
      const approvalStep = result.steps.find((s) => s.approval);
      expect(approvalStep).toBeUndefined();
    });

    it("does not leave orphaned steps after retry removal", () => {
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Preparing:"),
        fixtures.toolCallStart(2, "tc-retry", "request_salesforce_approval", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(
          3,
          "tc-retry",
          JSON.stringify({
            summary: "Bad args",
            operations: [
              {
                operation: "update",
                sobject_type: "Account",
                record_name: "Test",
                record_id: "001retry",
                changes: [{ field: "Name", before: "Old", after: "New" }],
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-retry", { stepNumber: 1 }),
        fixtures.runFinished(5), // intermediate
        fixtures.toolCallResult(
          6,
          "tc-retry",
          JSON.stringify({ success: false, retry: true }),
          { stepNumber: 1, isDelta: true },
        ),
        // Agent retries with a new tool call
        fixtures.stepStarted(7, 2, "Retrying"),
        fixtures.toolCallStart(8, "tc-retry-2", "request_salesforce_approval", {
          stepNumber: 2,
        }),
        fixtures.toolCallArgs(
          9,
          "tc-retry-2",
          JSON.stringify({
            summary: "Correct args",
            operations: [
              {
                operation: "update",
                sobject_type: "Account",
                record_name: "Test",
                record_id: "001retry",
                changes: [{ field: "Name", before: "Old", after: "New" }],
              },
            ],
          }),
          { stepNumber: 2 },
        ),
        fixtures.toolCallEnd(10, "tc-retry-2", { stepNumber: 2 }),
        fixtures.runFinished(11), // intermediate for new approval
        fixtures.toolCallResult(
          12,
          "tc-retry-2",
          JSON.stringify({ approved: true }),
          { stepNumber: 2 },
        ),
        fixtures.stepFinished(13, 2, "Retrying"),
        fixtures.runFinished(14),
      ];
      const result = transformAguiToTimelineSteps(events);
      // Original retry step should be gone, only the successful retry remains
      const approvalSteps = result.steps.filter((s) => s.approval);
      expect(approvalSteps).toHaveLength(1);
      expect(approvalSteps[0].status).toBe("complete");
    });
  });

  // ── sawRunFinishedWithPendingApproval only clears on approval-resolving events ─

  describe("sawRunFinishedWithPendingApproval scoping", () => {
    it("does not clear hadApprovalPause when a non-approval TOOL_CALL_RESULT arrives", () => {
      // Intermediate RUN_FINISHED with pending approval, then a non-approval
      // tool result arrives (for a different tool) — the flag should NOT clear
      // because the approval step is still awaiting-approval.
      const events = [
        fixtures.runStarted(0),
        fixtures.stepStarted(1, 1, "Step with approval"),
        fixtures.toolCallStart(2, "tc-appr", "request_salesforce_approval", {
          stepNumber: 1,
        }),
        fixtures.toolCallArgs(
          3,
          "tc-appr",
          JSON.stringify({
            summary: "Update",
            operations: [
              {
                operation: "update",
                sobject_type: "Account",
                record_name: "Test",
                record_id: "001x",
                changes: [{ field: "Name", before: "A", after: "B" }],
              },
            ],
          }),
          { stepNumber: 1 },
        ),
        fixtures.toolCallEnd(4, "tc-appr", { stepNumber: 1 }),
        fixtures.runFinished(5), // intermediate
        // A non-approval tool result arrives (e.g., leftover from previous step)
        fixtures.toolCallResult(6, "tc-other", '{"success":true}'),
        // No final RUN_FINISHED yet
      ];
      const result = transformAguiToTimelineSteps(events);
      // Approval is still pending, flag should still be true
      expect(result.hadApprovalPause).toBe(true);
      expect(result.isAwaitingApproval).toBe(true);
    });
  });
});

// ── getElapsedTimeFromEvents ────────────────────────────────────────────

describe("getElapsedTimeFromEvents", () => {
  it("returns 0 for null", () => {
    expect(getElapsedTimeFromEvents(null)).toBe(0);
  });

  it("returns 0 for undefined", () => {
    expect(getElapsedTimeFromEvents(undefined)).toBe(0);
  });

  it("returns 0 for empty array", () => {
    expect(getElapsedTimeFromEvents([])).toBe(0);
  });

  it("calculates elapsed time from first to last event", () => {
    const events = fixtures.simpleTextRun();
    const elapsed = getElapsedTimeFromEvents(events);
    // Events are 100ms apart, 8 events (seq 0-7) → 700ms → 0 seconds (floor)
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });

  it("handles events with invalid timestamps gracefully", () => {
    const events = [
      { ...fixtures.runStarted(0), timestamp: "invalid" },
      { ...fixtures.runFinished(1), timestamp: "also-invalid" },
    ];
    const elapsed = getElapsedTimeFromEvents(events);
    // new Date("invalid").getTime() returns NaN; Math.floor((NaN-NaN)/1000) = NaN
    expect(elapsed).toBeNaN();
  });

  it("sorts events by sequence before calculating", () => {
    const base = "2024-01-01T00:00:00.000Z";
    const events = [
      {
        ...fixtures.runFinished(5),
        timestamp: new Date(new Date(base).getTime() + 5000).toISOString(),
      },
      { ...fixtures.runStarted(0), timestamp: base },
    ];
    const elapsed = getElapsedTimeFromEvents(events);
    expect(elapsed).toBe(5);
  });
});
