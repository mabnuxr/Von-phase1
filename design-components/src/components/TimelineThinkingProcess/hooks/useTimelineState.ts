import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { TimelineStep } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface UseTimelineStateOptions {
  steps: TimelineStep[];
  isThinking: boolean;
  autoCollapse?: boolean;
  controlledCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onExpandStep?: (step: TimelineStep) => void;
  initiallyCollapsed?: boolean;
}

export interface UseTimelineStateReturn {
  // State
  isDrawerOpen: boolean;
  isCollapsed: boolean;
  expandedSteps: Set<string>;
  selectedStepForDrawer: TimelineStep | null;
  focusedStepId: string | null;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  // Local approval state (for optimistic UI updates)
  localApprovalState: Map<string, 'approved' | 'rejected'>;
  // Setters
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedStepForDrawer: React.Dispatch<React.SetStateAction<TimelineStep | null>>;
  // Handlers
  handleToggleCollapse: () => void;
  toggleStep: (stepId: string) => void;
  handleExpandStep: (step: TimelineStep) => void;
  focusOnStep: (stepId: string) => void;
  markAsApproved: (stepId: string) => void;
  markAsRejected: (stepId: string) => void;
  // Derived
  completedCount: number;
  totalCount: number;
  allComplete: boolean;
  visibleSteps: TimelineStep[];
  awaitingApprovalStep: TimelineStep | undefined;
  // Helpers
  getStepDisplayMode: (step: TimelineStep, index: number) => 'expanded' | 'collapsed';
  getSummary: () => string;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook for managing timeline state and interactions
 *
 * Handles:
 * - Collapse/expand state
 * - Step expansion tracking
 * - Drawer state for detailed view
 * - Auto-scroll during thinking
 * - Auto-expand current step
 */
export function useTimelineState({
  steps,
  isThinking,
  autoCollapse,
  onExpandStep,
  initiallyCollapsed = false,
}: UseTimelineStateOptions): UseTimelineStateReturn {
  // State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCollapsed, setInternalCollapsed] = useState(initiallyCollapsed);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [selectedStepForDrawer, setSelectedStepForDrawer] = useState<TimelineStep | null>(null);
  const [focusedStepId, setFocusedStepId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Track if user has scrolled away from bottom (to prevent auto-scroll hijacking)
  const userHasScrolledRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  // Local approval state for optimistic UI updates (bell icon hides immediately)
  const [localApprovalState, setLocalApprovalState] = useState<
    Map<string, 'approved' | 'rejected'>
  >(new Map());

  const completedCount = useMemo(
    () => steps.filter((s) => s.status === 'complete').length,
    [steps]
  );

  const totalCount = steps.length;

  const allComplete = useMemo(
    () => (completedCount === totalCount && totalCount > 0 && !isThinking) || !!autoCollapse,
    [completedCount, totalCount, isThinking, autoCollapse]
  );

  const visibleSteps = useMemo(() => steps.filter((s) => s.status !== 'pending'), [steps]);

  const awaitingApprovalStep = useMemo(() => {
    const approvalStep = steps.find(
      (s) =>
        s.status === 'awaiting-approval' && !localApprovalState.has(s.approval?.toolCallId || s.id)
    );

    if (
      import.meta.env.DEV &&
      (approvalStep || steps.some((s) => s.status === 'awaiting-approval'))
    ) {
      console.log('[useTimelineState] Approval step check:', {
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

  // Handlers
  const handleToggleCollapse = useCallback(() => {
    setInternalCollapsed((prev) => {
      if (prev) {
        return totalCount > 0 ? false : true;
      }
      return true;
    });
  }, [totalCount]);

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

  const handleExpandStep = useCallback(
    (step: TimelineStep) => {
      setSelectedStepForDrawer(step);
      setIsDrawerOpen(true);
      onExpandStep?.(step);
    },
    [onExpandStep]
  );

  const focusOnStep = useCallback((stepId: string) => {
    setFocusedStepId(stepId);
    setExpandedSteps((prev) => new Set(prev).add(stepId));
  }, []);

  // Mark a step as locally approved (for optimistic UI updates)
  const markAsApproved = useCallback((toolCallId: string) => {
    setLocalApprovalState((prev) => new Map(prev).set(toolCallId, 'approved'));
  }, []);

  // Mark a step as locally rejected (for optimistic UI updates)
  const markAsRejected = useCallback((toolCallId: string) => {
    setLocalApprovalState((prev) => new Map(prev).set(toolCallId, 'rejected'));
  }, []);

  // Helper functions
  const getExpandedStepIndices = useCallback((): Set<number> => {
    const expandedIndices = new Set<number>();
    const currentIdx = visibleSteps.findIndex(
      (s) => s.status === 'in-progress' || s.status === 'awaiting-approval'
    );
    if (currentIdx !== -1) {
      expandedIndices.add(currentIdx);
      if (currentIdx > 0) {
        expandedIndices.add(currentIdx - 1);
      }
    }
    return expandedIndices;
  }, [visibleSteps]);

  const getStepDisplayMode = useCallback(
    (step: TimelineStep, index: number): 'expanded' | 'collapsed' => {
      // If user has explicitly toggled this step in expandedSteps, respect that
      if (expandedSteps.has(step.id)) {
        return 'expanded';
      }

      // If user clicked to focus on a specific step, show it expanded
      if (focusedStepId === step.id) {
        return 'expanded';
      }

      // During thinking process, auto-expand current and previous step
      if (isThinking) {
        const expandedIndices = getExpandedStepIndices();
        if (expandedIndices.has(index)) {
          return 'expanded';
        }
      }

      // Always expand steps that have an artifact so the chip is always visible
      if (step.artifact) {
        return 'expanded';
      }

      // Default to collapsed
      return 'collapsed';
    },
    [expandedSteps, focusedStepId, isThinking, getExpandedStepIndices]
  );

  const getSummary = useCallback((): string => {
    if (allComplete) {
      return `${totalCount} steps`;
    }
    const inProgressStep = steps.find((s) => s.status === 'in-progress');
    if (inProgressStep) {
      return inProgressStep.text;
    }
    return `${completedCount}/${totalCount} steps`;
  }, [allComplete, totalCount, steps, completedCount]);

  // Effects

  // Track user scroll to detect when they've scrolled away from bottom
  // Re-runs when visibleSteps.length changes so the listener attaches once
  // the scroll container mounts (it's gated on visibleSteps.length > 0)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      // Consider "at bottom" if within 50px of the bottom
      const isAtBottom = distanceFromBottom < 50;

      // If user scrolled up (away from bottom), mark as user-scrolled
      if (!isAtBottom && scrollTop < lastScrollTopRef.current) {
        userHasScrolledRef.current = true;
      }
      // If user scrolled back to bottom, reset the flag
      if (isAtBottom) {
        userHasScrolledRef.current = false;
      }

      lastScrollTopRef.current = scrollTop;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [visibleSteps.length]);

  // Reset user scroll tracking when thinking starts
  useEffect(() => {
    if (isThinking) {
      userHasScrolledRef.current = false;
    }
  }, [isThinking]);

  // Auto-scroll to keep current step in view (only if user hasn't scrolled away)
  useEffect(() => {
    if (scrollContainerRef.current && !isCollapsed && isThinking && !userHasScrolledRef.current) {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current && !userHasScrolledRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      });
    }
  }, [visibleSteps.length, isCollapsed, isThinking, steps]);

  // Auto-expand current in-progress or awaiting-approval step
  useEffect(() => {
    const currentStep = steps.find(
      (s) => s.status === 'in-progress' || s.status === 'awaiting-approval'
    );
    if (currentStep) {
      setExpandedSteps((prev) => new Set(prev).add(currentStep.id));
    }
  }, [steps]);

  // Auto-collapse when autoCollapse becomes true (e.g., final response starts streaming)
  useEffect(() => {
    if (autoCollapse) {
      setInternalCollapsed(true);
    }
  }, [autoCollapse]);

  // When thinking starts (including follow-up runs), expand the thinking process
  // and clear any focused step from the previous run.
  // Guard with !autoCollapse so this doesn't override the auto-collapse during final response.
  useEffect(() => {
    if (isThinking && !autoCollapse) {
      setInternalCollapsed(false);
      setFocusedStepId(null);
    }
  }, [isThinking, autoCollapse]);

  return {
    // State
    isDrawerOpen,
    isCollapsed,
    expandedSteps,
    selectedStepForDrawer,
    focusedStepId,
    scrollContainerRef,
    localApprovalState,
    // Setters
    setIsDrawerOpen,
    setSelectedStepForDrawer,
    // Handlers
    handleToggleCollapse,
    toggleStep,
    handleExpandStep,
    focusOnStep,
    markAsApproved,
    markAsRejected,
    // Derived
    completedCount,
    totalCount,
    allComplete,
    visibleSteps,
    awaitingApprovalStep,
    // Helpers
    getStepDisplayMode,
    getSummary,
  };
}
