import { useCallback, useRef } from "react";
import { useRunTimer } from "./useRunTimer";

export interface RunTimerController {
  /** Current elapsed time in seconds. */
  elapsedTime: number;

  /** A new run started (first events for a brand-new run). Resets to 0. */
  onRunStarted: (runId: string) => void;

  /** Mid-stream reconnect (events for an already-known run). Resumes from current value. */
  onReconnected: (runId: string) => void;

  /** Called after each event transform with the result flags. Manages pause/play/stop. */
  onEventProcessed: (
    runId: string,
    state: {
      isAwaitingApproval: boolean;
      isThinking: boolean;
      isFinalResponseStreaming: boolean;
    },
  ) => void;

  /** Run completed normally (not thinking, not transitional). */
  onRunCompleted: (runId: string) => void;

  /** Run terminated by user stop or timeout.
   *  Pass resetElapsed=true when no events were received (timer should show 0). */
  onRunTerminated: (resetElapsed?: boolean) => void;

  /** User clicked approve — optimistically resume before Pusher events arrive. */
  onApprovalResumed: () => void;

  /** Reconciliation detected run finished. */
  onReconciliationFinished: (runId: string) => void;

  /** Check if the controller is already tracking a specific run. */
  isTrackingRun: (runId: string) => boolean;

  /** Seed timer from server-derived elapsed on page refresh recovery.
   *  No-op if Pusher is already tracking this run. */
  seedFromServer: (
    runId: string,
    elapsed: number,
    state: { isThinking: boolean; isAwaitingApproval: boolean },
  ) => void;

  /** Seeding detected a completed run while Pusher was tracking
   *  (edge case: Pusher missed RUN_FINISHED). */
  onSeedingDetectedCompletion: (runId: string) => void;
}

export function useRunTimerController(): RunTimerController {
  const { elapsedTime, start, stop, pause, play, set } = useRunTimer();

  /** Tracks the active run so timer operations from stale runs are ignored. */
  const currentRunIdRef = useRef<string | null>(null);
  /** When true, the user clicked approve and we optimistically resumed the timer.
   *  Prevents the event handler from re-pausing until isAwaitingApproval clears. */
  const approvalResumedRef = useRef(false);

  const onRunStarted = useCallback(
    (runId: string) => {
      currentRunIdRef.current = runId;
      approvalResumedRef.current = false;
      start();
    },
    [start],
  );

  const onReconnected = useCallback(
    (runId: string) => {
      currentRunIdRef.current = runId;
      play();
    },
    [play],
  );

  const onEventProcessed = useCallback(
    (
      runId: string,
      state: {
        isAwaitingApproval: boolean;
        isThinking: boolean;
        isFinalResponseStreaming: boolean;
      },
    ) => {
      if (runId !== currentRunIdRef.current) return;

      if (state.isAwaitingApproval && !approvalResumedRef.current) {
        pause();
      } else if (state.isThinking && !state.isFinalResponseStreaming) {
        if (approvalResumedRef.current && !state.isAwaitingApproval) {
          approvalResumedRef.current = false;
        }
        play();
      } else if (state.isFinalResponseStreaming) {
        approvalResumedRef.current = false;
        stop();
      }
    },
    [pause, play, stop],
  );

  const onRunCompleted = useCallback(
    (runId: string) => {
      if (runId !== currentRunIdRef.current) return;
      stop();
    },
    [stop],
  );

  const onRunTerminated = useCallback(
    (resetElapsed?: boolean) => {
      if (resetElapsed) set(0);
      stop();
    },
    [stop, set],
  );

  const onApprovalResumed = useCallback(() => {
    approvalResumedRef.current = true;
    play();
  }, [play]);

  const onReconciliationFinished = useCallback(
    (runId: string) => {
      if (runId !== currentRunIdRef.current) return;
      stop();
    },
    [stop],
  );

  const isTrackingRun = useCallback((runId: string) => {
    return currentRunIdRef.current === runId;
  }, []);

  const seedFromServer = useCallback(
    (
      runId: string,
      elapsed: number,
      state: { isThinking: boolean; isAwaitingApproval: boolean },
    ) => {
      // If Pusher is already tracking this run, it owns the timer — don't overwrite
      if (currentRunIdRef.current === runId) return;

      currentRunIdRef.current = runId;
      set(elapsed);

      if (state.isThinking && !state.isAwaitingApproval) {
        stop();
        play();
      } else if (!state.isThinking) {
        stop();
      } else {
        // isThinking && isAwaitingApproval
        pause();
      }
    },
    [set, stop, play, pause],
  );

  const onSeedingDetectedCompletion = useCallback(
    (runId: string) => {
      if (runId !== currentRunIdRef.current) return;
      stop();
    },
    [stop],
  );

  return {
    elapsedTime,
    onRunStarted,
    onReconnected,
    onEventProcessed,
    onRunCompleted,
    onRunTerminated,
    onApprovalResumed,
    onReconciliationFinished,
    isTrackingRun,
    seedFromServer,
    onSeedingDetectedCompletion,
  };
}
