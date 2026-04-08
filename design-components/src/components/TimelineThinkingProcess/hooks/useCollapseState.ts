import { useEffect, useCallback } from 'react';
import { useVisibilityToggle } from '../../../hooks';
import type { TimelineStep } from '../types';

export interface UseCollapseStateReturn {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

/**
 * Manages the collapse/expand state of the thinking process container.
 *
 * Auto-collapse/expand priority:
 * 1. autoCollapse (final response, timeout, error, stopped) → always collapse
 * 2. isThinking → expand
 * 3. awaitingApprovalStep → expand (isThinking is false during approval)
 */
export function useCollapseState({
  initiallyCollapsed,
  autoCollapse,
  isThinking,
  awaitingApprovalStep,
  totalCount,
}: {
  initiallyCollapsed: boolean;
  autoCollapse: boolean;
  isThinking: boolean;
  awaitingApprovalStep: TimelineStep | undefined;
  totalCount: number;
}): UseCollapseStateReturn {
  const {
    isVisible: isExpanded,
    show: expand,
    hide: collapse,
  } = useVisibilityToggle(!initiallyCollapsed);
  const isCollapsed = !isExpanded;

  const toggleCollapse = useCallback(() => {
    if (isCollapsed) {
      if (totalCount > 0) expand();
    } else {
      collapse();
    }
  }, [isCollapsed, totalCount, expand, collapse]);

  useEffect(() => {
    if (autoCollapse) {
      collapse();
      return;
    }
    if (isThinking) {
      expand();
    } else if (awaitingApprovalStep) {
      expand();
    }
  }, [autoCollapse, isThinking, awaitingApprovalStep, expand, collapse]);

  return { isCollapsed, toggleCollapse };
}
