export { ThinkingDrawer, default } from './ThinkingDrawer';
export type {
  ThinkingDrawerProps,
  ThinkingStepDetail,
  SelectedStep,
  QueryResult,
  StepStatus,
} from './types';

// Re-export components for potential external use
export { TypingText, StatusIcon, DrawerBackdrop } from './components';
export type { TypingTextProps, StatusIconProps, DrawerBackdropProps } from './components';

// Re-export hooks
export { useTypingAnimation } from './hooks';
export type { UseTypingAnimationOptions, UseTypingAnimationReturn } from './hooks';
