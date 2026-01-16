export { TimelineThinkingProcess, default } from './TimelineThinkingProcess';
export type {
  TimelineThinkingProcessProps,
  TimelineStep,
  ApprovalData,
  StepType,
  SourceType,
  EventCategory,
  StepStatus,
  QueryResult,
  StepRowProps,
  CollapsedStepRowProps,
  CompactApprovalCardProps,
  StepTypeIconProps,
  StatusIconProps,
} from './types';

// Re-export constants
export { CONTAINER_HEIGHT, SOURCE_CONFIG, TYPE_CONFIG } from './constants';

// Re-export components for potential external use
export {
  StatusIcon,
  StepTypeIcon,
  CompactApprovalCard,
  StepRow,
  CollapsedStepRow,
} from './components';

// Re-export hooks
export { useTimelineState } from './hooks';
export type { UseTimelineStateOptions, UseTimelineStateReturn } from './hooks';

// Re-export utils
export { formatElapsedTime } from './utils';
