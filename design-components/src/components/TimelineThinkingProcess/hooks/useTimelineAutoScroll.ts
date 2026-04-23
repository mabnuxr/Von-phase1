import { useStickToBottom } from '../../../hooks/useStickToBottom';

/**
 * Pins the thinking process container to the bottom as steps stream in
 * and approval cards appear. Thin wrapper around `useStickToBottom` that
 * disables pinning while the timeline is collapsed.
 */
export function useTimelineAutoScroll({
  isCollapsed,
}: {
  isCollapsed: boolean;
}): React.RefObject<HTMLDivElement | null> {
  return useStickToBottom({ disabled: isCollapsed });
}
