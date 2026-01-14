import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { TimelineStep } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface UseTimelineStateOptions {
  steps: TimelineStep[];
  isThinking: boolean;
  controlledCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onExpandStep?: (step: TimelineStep) => void;
}

export interface UseTimelineStateReturn {
  // State
  isDrawerOpen: boolean;
  isCollapsed: boolean;
  expandedSteps: Set<string>;
  selectedStepForDrawer: TimelineStep | null;
  focusedStepId: string | null;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  // Setters
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedStepForDrawer: React.Dispatch<React.SetStateAction<TimelineStep | null>>;
  // Handlers
  handleToggleCollapse: () => void;
  toggleStep: (stepId: string) => void;
  handleExpandStep: (step: TimelineStep) => void;
  focusOnStep: (stepId: string) => void;
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
  controlledCollapsed,
  onToggleCollapse,
  onExpandStep,
}: UseTimelineStateOptions): UseTimelineStateReturn {
  // State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [selectedStepForDrawer, setSelectedStepForDrawer] = useState<TimelineStep | null>(null);
  const [focusedStepId, setFocusedStepId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Derived state
  const isCollapsed = useMemo(
    () => controlledCollapsed ?? internalCollapsed,
    [controlledCollapsed, internalCollapsed]
  );

  const completedCount = useMemo(
    () => steps.filter((s) => s.status === 'complete').length,
    [steps]
  );

  const totalCount = steps.length;

  const allComplete = useMemo(
    () => completedCount === totalCount && totalCount > 0 && !isThinking,
    [completedCount, totalCount, isThinking]
  );

  const visibleSteps = useMemo(() => steps.filter((s) => s.status !== 'pending'), [steps]);

  const awaitingApprovalStep = useMemo(
    () => steps.find((s) => s.status === 'awaiting-approval'),
    [steps]
  );

  // Handlers
  const handleToggleCollapse = useCallback(() => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  }, [onToggleCollapse]);

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

  // Auto-scroll to keep current step in view
  useEffect(() => {
    if (scrollContainerRef.current && !isCollapsed && isThinking) {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
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

  // Clear focused step when thinking state changes
  useEffect(() => {
    if (isThinking) {
      setFocusedStepId(null);
    }
  }, [isThinking]);

  return {
    // State
    isDrawerOpen,
    isCollapsed,
    expandedSteps,
    selectedStepForDrawer,
    focusedStepId,
    scrollContainerRef,
    // Setters
    setIsDrawerOpen,
    setSelectedStepForDrawer,
    // Handlers
    handleToggleCollapse,
    toggleStep,
    handleExpandStep,
    focusOnStep,
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
