import {
  CloudIcon,
  PhoneIcon,
  EnvelopeIcon,
  SparkleIcon,
  CalendarIcon,
  WrenchIcon,
  BrainIcon,
  CodeIcon,
  FileTextIcon,
} from '@phosphor-icons/react';
import type { StepType, SourceType } from './types';

// ============================================================================
// TimelineThinkingProcess Constants
// ============================================================================

/**
 * Maximum height of the scrollable container in pixels
 */
export const CONTAINER_HEIGHT = 320;

/**
 * Configuration for source icons and labels
 */
export const SOURCE_CONFIG: Record<
  SourceType,
  { icon: React.ElementType; label: string; color: string }
> = {
  salesforce: { icon: CloudIcon, label: 'Salesforce', color: 'text-blue-600' },
  gong: { icon: PhoneIcon, label: 'Gong', color: 'text-purple-600' },
  email: { icon: EnvelopeIcon, label: 'Email', color: 'text-gray-600' },
  voniq: { icon: SparkleIcon, label: 'VonIQ', color: 'text-teal-600' },
  calendar: { icon: CalendarIcon, label: 'Calendar', color: 'text-orange-500' },
  generic: { icon: WrenchIcon, label: 'Tool', color: 'text-gray-600' },
};

/**
 * Configuration for step type icons and labels
 */
export const TYPE_CONFIG: Record<StepType, { icon: React.ElementType; label: string }> = {
  reasoning: { icon: BrainIcon, label: 'Thinking' },
  tool_call: { icon: WrenchIcon, label: 'Tool' },
  code_execution: { icon: CodeIcon, label: 'Code' },
  output: { icon: FileTextIcon, label: 'Output' },
  approval: { icon: CloudIcon, label: 'Approval' },
};
