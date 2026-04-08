import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TimelineStep } from '../types';

export interface UseStepExpansionReturn {
  toggleStep: (stepId: string) => void;
  isStepExpanded: (step: TimelineStep, index: number) => boolean;
  /** Whether to render a placeholder row for the next expected step. */
  shouldShowPlaceholder: boolean;
}

/**
 * Tracks which individual step rows are expanded, auto-expands
 * the current in-progress or awaiting-approval step, and determines
 * whether to show a placeholder for the next expected step.
 */
export function useStepExpansion({
  steps,
  isThinking,
  visibleSteps,
  localApprovalState,
}: {
  steps: TimelineStep[];
  isThinking: boolean;
  visibleSteps: TimelineStep[];
  localApprovalState: Map<string, 'approved' | 'rejected'>;
}): UseStepExpansionReturn {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = useCallback((stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }, []);

  // Indices of the current in-progress/awaiting-approval step and its predecessor,
  // auto-expanded during thinking so the user sees recent context.
  const autoExpandedIndices = useMemo((): Set<number> => {
    const indices = new Set<number>();
    const currentIdx = visibleSteps.findIndex(
      (s) => s.status === 'in-progress' || s.status === 'awaiting-approval'
    );
    if (currentIdx !== -1) {
      indices.add(currentIdx);
      if (currentIdx > 0) {
        indices.add(currentIdx - 1);
      }
    }
    return indices;
  }, [visibleSteps]);

  const isStepExpanded = useCallback(
    (step: TimelineStep, index: number): boolean => {
      if (expandedSteps.has(step.id)) {
        return true;
      }

      if (isThinking && autoExpandedIndices.has(index)) {
        return true;
      }

      if (step.artifact) {
        return true;
      }

      return false;
    },
    [expandedSteps, isThinking, autoExpandedIndices]
  );

  // Show placeholder when thinking and expecting more steps —
  // but not while an approval step is still waiting for user action.
  const shouldShowPlaceholder = useMemo(() => {
    if (!isThinking) return false;
    if (visibleSteps.length === 0) return true;

    const lastStep = visibleSteps[visibleSteps.length - 1];

    // Don't show after approval steps that are still waiting for user action.
    // If the user has locally approved/rejected (optimistic UI), treat the step
    // as resolved and allow the placeholder to show.
    const lastStepToolCallId = lastStep?.approval?.toolCallId || lastStep?.id;
    const isLocallyResolved = lastStepToolCallId
      ? localApprovalState.has(lastStepToolCallId)
      : false;

    if (lastStep?.status === 'awaiting-approval' && !isLocallyResolved) return false;

    // If there's an in-progress step, don't show placeholder (that step has its own spinner)
    if (visibleSteps.some((s) => s.status === 'in-progress')) return false;

    return true;
  }, [isThinking, visibleSteps, localApprovalState]);

  // Auto-expand the current in-progress or awaiting-approval step row
  useEffect(() => {
    const currentStep = steps.find(
      (s) => s.status === 'in-progress' || s.status === 'awaiting-approval'
    );
    if (currentStep) {
      setExpandedSteps((prev) => new Set(prev).add(currentStep.id));
    }
  }, [steps]);

  return { toggleStep, isStepExpanded, shouldShowPlaceholder };
}
