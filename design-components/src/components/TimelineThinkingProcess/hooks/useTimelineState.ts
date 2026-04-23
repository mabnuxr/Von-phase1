import { useMemo } from 'react';
import type { ThinkingStepDetail } from '../../ThinkingDrawer';
import type { TimelineStep } from '../types';
import { useStickToBottom } from '../../../hooks/useStickToBottom';
import { useApprovalState } from './useApprovalState';
import { useStepDrawer } from './useStepDrawer';
import { useCollapseState } from './useCollapseState';
import { useStepExpansion } from './useStepExpansion';

// ============================================================================
// Types
// ============================================================================

export interface UseTimelineStateOptions {
  steps: TimelineStep[];
  isThinking: boolean;
  autoCollapse?: boolean;
  onExpandStep?: (step: TimelineStep) => void;
  initiallyCollapsed?: boolean;
}

export interface UseTimelineStateReturn {
  // -- Drawer (detail view for a single step) --

  /** Whether the step detail drawer is currently open. */
  isDrawerOpen: boolean;
  /** The step being inspected in the drawer, or `null` when closed. */
  selectedStepForDrawer: TimelineStep | null;
  /** Steps transformed into the format expected by ThinkingDrawer. */
  drawerSteps: ThinkingStepDetail[];
  /** Close the detail drawer and clear the selected step. */
  closeDrawer: () => void;
  /** Open the detail drawer for a step and notify the parent via `onExpandStep`. */
  handleExpandStep: (step: TimelineStep) => void;

  // -- Container collapse/expand --

  /** Whether the thinking process container is collapsed (header-only). */
  isCollapsed: boolean;
  /** Toggle the container between collapsed and expanded. Prevents expanding when there are no steps. */
  toggleCollapse: () => void;

  // -- Step row expansion --

  /** Toggle an individual step row between expanded and collapsed. */
  toggleStep: (stepId: string) => void;
  /** Whether a step row should render in its expanded state (user toggle, auto-expand, or artifact). */
  isStepExpanded: (step: TimelineStep, index: number) => boolean;
  /** Whether to render a placeholder row for the next expected step. */
  shouldShowPlaceholder: boolean;

  // -- Approval --

  /** Optimistic approval state map — keyed by `toolCallId`, used to hide the approval bell immediately. */
  localApprovalState: Map<string, 'approved' | 'rejected'>;
  /** Mark a step as approved (optimistic UI update before the API responds). */
  markAsApproved: (toolCallId: string) => void;
  /** Mark a step as rejected (optimistic UI update before the API responds). */
  markAsRejected: (toolCallId: string) => void;
  /** The first step still awaiting user approval (not yet locally resolved), or `undefined`. */
  awaitingApprovalStep: TimelineStep | undefined;

  // -- Auto-scroll --

  /** Ref to attach to the scrollable steps container. Handles auto-scroll during thinking and approval. */
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;

  // -- Derived --

  /** `true` when every step has completed or the container is auto-collapsed. */
  allComplete: boolean;
  /** Steps filtered to exclude `pending` status — the set actually rendered in the UI. */
  visibleSteps: TimelineStep[];
  /** Header summary text — current step name during thinking, empty otherwise. */
  summary: string;
}

// ============================================================================
// Hook
// ============================================================================

export function useTimelineState({
  steps,
  isThinking,
  autoCollapse = false,
  onExpandStep,
  initiallyCollapsed = false,
}: UseTimelineStateOptions): UseTimelineStateReturn {
  // Derived data used by multiple sub-hooks
  const visibleSteps = useMemo(() => steps.filter((s) => s.status !== 'pending'), [steps]);

  const completedCount = useMemo(
    () => steps.filter((s) => s.status === 'complete').length,
    [steps]
  );
  const totalCount = steps.length;

  const allComplete = useMemo(
    () => (completedCount === totalCount && totalCount > 0 && !isThinking) || autoCollapse,
    [completedCount, totalCount, isThinking, autoCollapse]
  );

  // Header summary — current step name during thinking, empty when collapsed or done
  const summary = useMemo(() => {
    if (steps.length === 0 || autoCollapse) return '';
    if (!isThinking) return '';

    const inProgressStep = steps.find((s) => s.status === 'in-progress');
    const currentStep = inProgressStep || steps[steps.length - 1];
    if (!currentStep) return '';

    return currentStep.type === 'reasoning' ? 'Thinking' : currentStep.text;
  }, [steps, isThinking, autoCollapse]);

  // Sub-hooks
  const { localApprovalState, markAsApproved, markAsRejected, awaitingApprovalStep } =
    useApprovalState(steps);

  const { isDrawerOpen, selectedStepForDrawer, drawerSteps, closeDrawer, handleExpandStep } =
    useStepDrawer({ steps, onExpandStep });

  const { isCollapsed, toggleCollapse } = useCollapseState({
    initiallyCollapsed,
    autoCollapse,
    isThinking,
    awaitingApprovalStep,
    totalCount,
  });

  const { toggleStep, isStepExpanded, shouldShowPlaceholder } = useStepExpansion({
    steps,
    isThinking,
    visibleSteps,
    localApprovalState,
  });

  const { ref: scrollContainerRef } = useStickToBottom({ disabled: isCollapsed });

  return {
    isDrawerOpen,
    isCollapsed,
    selectedStepForDrawer,
    drawerSteps,
    scrollContainerRef,
    localApprovalState,
    closeDrawer,
    toggleCollapse,
    toggleStep,
    handleExpandStep,
    markAsApproved,
    markAsRejected,
    shouldShowPlaceholder,
    allComplete,
    visibleSteps,
    awaitingApprovalStep,
    isStepExpanded,
    summary,
  };
}
