/**
 * useAiFieldEvents - Binds to AI Field Pusher channel events and dispatches
 * updates to the store and React Query cache.
 *
 * Handles 5 event types:
 * - ACTIVATE_COMPLETED: clears activating state, invalidates queries, toasts success
 * - ACTIVATE_FAILED: clears activating state, toasts error
 * - PLAYGROUND_RESULT: updates individual opportunity status in the store
 * - PLAYGROUND_COMPLETE: clears execution ID
 * - PLAYGROUND_ERROR: clears execution ID, toasts error
 */

import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Channel } from "pusher-js";

import { AiFieldChannelEvents } from "../types/aiFieldChannelEvents";
import { aiFieldKeys } from "./useVonAiFields";
import useAiFieldsStore from "../store/vonAiFieldsStore";
import { useToast } from "./useToast";
import type { PlaygroundResultEvent } from "../types/vonAiFields";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeParse(data: string | any): any | null {
  try {
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch {
    return null;
  }
}

export function useAiFieldEvents(channel: Channel | null): void {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const {
    setPlaygroundOppStatus,
    setActivatingFieldId,
    setPlaygroundExecutionId,
  } = useAiFieldsStore();

  // ─── ACTIVATE_COMPLETED ───────────────────────────────────────
  const handleActivateCompleted = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data: string | any) => {
      const parsed = safeParse(data);
      if (!parsed) return;

      // Only handle if we're currently activating a field
      const { activatingFieldId } = useAiFieldsStore.getState();
      if (!activatingFieldId) return;

      setActivatingFieldId(null);
      queryClient.invalidateQueries({ queryKey: aiFieldKeys.all });

      const nodesExecuted = parsed.nodesExecuted ?? parsed.nodes_executed ?? 0;
      const nodesFailed = parsed.nodesFailed ?? parsed.nodes_failed ?? 0;
      const failedMsg = nodesFailed > 0 ? ` (${nodesFailed} failed)` : "";
      showToast({
        message: `Field activated successfully. ${nodesExecuted} nodes executed${failedMsg}.`,
        variant: "success",
      });
    },
    [queryClient, showToast, setActivatingFieldId],
  );

  // ─── ACTIVATE_FAILED ─────────────────────────────────────────
  const handleActivateFailed = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data: string | any) => {
      const parsed = safeParse(data);
      if (!parsed) return;

      const { activatingFieldId } = useAiFieldsStore.getState();
      if (!activatingFieldId) return;

      setActivatingFieldId(null);
      showToast({
        message: `Activation failed: ${parsed.error ?? "Unknown error"}`,
        variant: "error",
      });
    },
    [showToast, setActivatingFieldId],
  );

  // ─── PLAYGROUND_RESULT ────────────────────────────────────────
  const handlePlaygroundResult = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data: string | any) => {
      const raw = safeParse(data);
      if (!raw) return;

      // Only handle if execution ID matches our active run
      const execId = raw.execution_id ?? raw.executionId;
      const { playgroundExecutionId } = useAiFieldsStore.getState();
      if (!playgroundExecutionId || execId !== playgroundExecutionId) return;

      // Normalize: backend sends snake_case with nested `result` object
      const result = raw.result ?? raw;
      const normalized: PlaygroundResultEvent = {
        opportunityId:
          result.opportunity_id ??
          result.opportunityId ??
          raw.opportunity_id ??
          "",
        opportunityName:
          result.opportunity_name ?? result.opportunityName ?? "",
        success: result.success ?? false,
        insights: result.insights,
        callsCount: result.calls_count ?? result.callsCount,
        emailsCount: result.emails_count ?? result.emailsCount,
        error: result.error,
      };

      if (import.meta.env.DEV) {
        console.log(
          "[useAiFieldEvents] PLAYGROUND_RESULT:",
          normalized.opportunityId,
          normalized.success,
        );
      }

      const status = normalized.success ? "done" : "error";
      setPlaygroundOppStatus(normalized.opportunityId, status, normalized);
    },
    [setPlaygroundOppStatus],
  );

  // ─── PLAYGROUND_COMPLETE ──────────────────────────────────────
  const handlePlaygroundComplete = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data: string | any) => {
      const parsed = safeParse(data);
      if (!parsed) return;

      const execId = parsed.execution_id ?? parsed.executionId;
      const { playgroundExecutionId } = useAiFieldsStore.getState();
      if (!playgroundExecutionId || execId !== playgroundExecutionId) return;

      setPlaygroundExecutionId(null);
    },
    [setPlaygroundExecutionId],
  );

  // ─── PLAYGROUND_ERROR ─────────────────────────────────────────
  const handlePlaygroundError = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data: string | any) => {
      const parsed = safeParse(data);
      if (!parsed) return;

      const execId = parsed.execution_id ?? parsed.executionId;
      const errorMsg = parsed.error ?? "Playground run failed";

      const { playgroundExecutionId } = useAiFieldsStore.getState();
      if (!playgroundExecutionId || execId !== playgroundExecutionId) return;

      setPlaygroundExecutionId(null);
      // Reset any still-running opps to error so UI doesn't stay stuck
      const { playgroundOpps, setPlaygroundOppStatus } =
        useAiFieldsStore.getState();
      for (const opp of playgroundOpps) {
        if (opp.status === "running") {
          setPlaygroundOppStatus(opp.opportunityId, "error", {
            opportunityId: opp.opportunityId,
            success: false,
            error: errorMsg,
          });
        }
      }
      showToast({
        message: `Playground error: ${errorMsg}`,
        variant: "error",
      });
    },
    [showToast, setPlaygroundExecutionId],
  );

  // ─── Bind / Unbind all events ─────────────────────────────────
  useEffect(() => {
    if (!channel) {
      if (import.meta.env.DEV) {
        console.log("[useAiFieldEvents] No channel, skipping bind");
      }
      return;
    }
    if (import.meta.env.DEV) {
      console.log(
        "[useAiFieldEvents] Binding events on channel:",
        channel.name,
      );
    }

    channel.bind(
      AiFieldChannelEvents.ACTIVATE_COMPLETED,
      handleActivateCompleted,
    );
    channel.bind(AiFieldChannelEvents.ACTIVATE_FAILED, handleActivateFailed);
    channel.bind(
      AiFieldChannelEvents.PLAYGROUND_RESULT,
      handlePlaygroundResult,
    );
    channel.bind(
      AiFieldChannelEvents.PLAYGROUND_COMPLETE,
      handlePlaygroundComplete,
    );
    channel.bind(AiFieldChannelEvents.PLAYGROUND_ERROR, handlePlaygroundError);

    return () => {
      channel.unbind(
        AiFieldChannelEvents.ACTIVATE_COMPLETED,
        handleActivateCompleted,
      );
      channel.unbind(
        AiFieldChannelEvents.ACTIVATE_FAILED,
        handleActivateFailed,
      );
      channel.unbind(
        AiFieldChannelEvents.PLAYGROUND_RESULT,
        handlePlaygroundResult,
      );
      channel.unbind(
        AiFieldChannelEvents.PLAYGROUND_COMPLETE,
        handlePlaygroundComplete,
      );
      channel.unbind(
        AiFieldChannelEvents.PLAYGROUND_ERROR,
        handlePlaygroundError,
      );
    };
  }, [
    channel,
    handleActivateCompleted,
    handleActivateFailed,
    handlePlaygroundResult,
    handlePlaygroundComplete,
    handlePlaygroundError,
  ]);
}
