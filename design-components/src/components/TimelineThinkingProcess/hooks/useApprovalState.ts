import { useState, useMemo, useCallback } from 'react';
import type { TimelineStep } from '../types';

export interface UseApprovalStateReturn {
  localApprovalState: Map<string, 'approved' | 'rejected'>;
  markAsApproved: (toolCallId: string) => void;
  markAsRejected: (toolCallId: string) => void;
  awaitingApprovalStep: TimelineStep | undefined;
}

/**
 * Manages optimistic approval UI state and derives the current awaiting-approval step.
 */
export function useApprovalState(steps: TimelineStep[]): UseApprovalStateReturn {
  const [localApprovalState, setLocalApprovalState] = useState<
    Map<string, 'approved' | 'rejected'>
  >(new Map());

  const markAsApproved = useCallback((toolCallId: string) => {
    setLocalApprovalState((prev) => new Map(prev).set(toolCallId, 'approved'));
  }, []);

  const markAsRejected = useCallback((toolCallId: string) => {
    setLocalApprovalState((prev) => new Map(prev).set(toolCallId, 'rejected'));
  }, []);

  const awaitingApprovalStep = useMemo(() => {
    const approvalStep = steps.find(
      (s) =>
        s.status === 'awaiting-approval' && !localApprovalState.has(s.approval?.toolCallId || s.id)
    );

    if (
      import.meta.env.DEV &&
      (approvalStep || steps.some((s) => s.status === 'awaiting-approval'))
    ) {
      console.log('[useApprovalState] Approval step check:', {
        foundAwaitingApproval: !!approvalStep,
        approvalStepId: approvalStep?.id,
        approvalToolCallId: approvalStep?.approval?.toolCallId,
        localApprovalStateSize: localApprovalState.size,
        allStepsWithApproval: steps
          .filter((s) => s.status === 'awaiting-approval')
          .map((s) => ({
            id: s.id,
            status: s.status,
            toolCallId: s.approval?.toolCallId,
            approvalData: s.approval,
          })),
      });
    }

    return approvalStep;
  }, [steps, localApprovalState]);

  return { localApprovalState, markAsApproved, markAsRejected, awaitingApprovalStep };
}
