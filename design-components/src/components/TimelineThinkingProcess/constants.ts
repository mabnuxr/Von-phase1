import type { SourceType } from './types';

// ============================================================================
// TimelineThinkingProcess Constants
// ============================================================================

/**
 * Maximum height of the scrollable container in pixels
 */
export const CONTAINER_HEIGHT = 320;

/**
 * Labels for source types (used in source badge)
 */
export const SOURCE_LABELS: Record<SourceType, string> = {
  salesforce: 'Salesforce',
  gong: 'Gong',
  email: 'Email',
  voniq: 'VonIQ',
  calendar: 'Calendar',
  generic: 'Tool',
};
