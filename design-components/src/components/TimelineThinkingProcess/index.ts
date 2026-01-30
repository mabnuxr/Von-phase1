export { TimelineThinkingProcess, default } from './TimelineThinkingProcess';
export type {
  TimelineThinkingProcessProps,
  TimelineStep,
  ApprovalData,
  BulkOperation,
  StepType,
  SourceType,
  EventCategory,
  StepStatus,
  QueryResult,
  StepRowProps,
  CollapsedStepRowProps,
  CompactApprovalCardProps,
  StepIndicatorProps,
} from './types';

// Re-export constants
export { CONTAINER_HEIGHT, SOURCE_LABELS } from './constants';

// Re-export components for potential external use
export {
  StepIndicator,
  ApprovalCard,
  CompactApprovalCard,
  BulkApprovalCard,
  StepRow,
  CollapsedStepRow,
} from './components';

// Re-export hooks
export { useTimelineState } from './hooks';
export type { UseTimelineStateOptions, UseTimelineStateReturn } from './hooks';

// Re-export utils
export { formatElapsedTime } from './utils';
