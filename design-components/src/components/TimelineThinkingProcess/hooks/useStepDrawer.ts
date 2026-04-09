import { useState, useCallback, useMemo } from 'react';
import { useVisibilityToggle } from '../../../hooks';
import type { ThinkingStepDetail } from '../../ThinkingDrawer';
import type { TimelineStep } from '../types';

export interface UseStepDrawerReturn {
  isDrawerOpen: boolean;
  selectedStepForDrawer: TimelineStep | null;
  /** Steps transformed into the format expected by ThinkingDrawer. */
  drawerSteps: ThinkingStepDetail[];
  closeDrawer: () => void;
  handleExpandStep: (step: TimelineStep) => void;
}

/**
 * Manages the detail drawer for inspecting a specific timeline step.
 * Transforms raw timeline steps into the drawer's display format.
 */
export function useStepDrawer({
  steps,
  onExpandStep,
}: {
  steps: TimelineStep[];
  onExpandStep?: (step: TimelineStep) => void;
}): UseStepDrawerReturn {
  const { isVisible: isDrawerOpen, show: showDrawer, hide: hideDrawer } = useVisibilityToggle();
  const [selectedStepForDrawer, setSelectedStepForDrawer] = useState<TimelineStep | null>(null);

  const handleExpandStep = useCallback(
    (step: TimelineStep) => {
      setSelectedStepForDrawer(step);
      showDrawer();
      onExpandStep?.(step);
    },
    [onExpandStep, showDrawer]
  );

  const closeDrawer = useCallback(() => {
    hideDrawer();
    setSelectedStepForDrawer(null);
  }, [hideDrawer]);

  const drawerSteps: ThinkingStepDetail[] = useMemo(
    () =>
      steps.map((step) => ({
        id: step.id,
        title: step.text,
        description: step.description || step.text,
        status:
          step.status === 'warning' ||
          step.status === 'error' ||
          step.status === 'awaiting-approval'
            ? 'complete'
            : step.status,
        queryId: step.queryId,
      })),
    [steps]
  );

  return { isDrawerOpen, selectedStepForDrawer, drawerSteps, closeDrawer, handleExpandStep };
}
