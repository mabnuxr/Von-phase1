/**
 * Design components library constants
 */

// ============================================================================
// UI Dimensions Constants
// ============================================================================

/**
 * Default width for artifact side panel
 */
export const ARTIFACT_PANE_WIDTH = '480px' as const;

// ============================================================================
// UI Text & Display Constants
// ============================================================================

/**
 * Maximum length for error messages before truncation
 * Applied to error displays in thinking blocks and tool call items
 */
export const ERROR_MESSAGE_TRUNCATE_LENGTH = 100 as const;

// ============================================================================
// Auto-Scroll Behavior Constants
// ============================================================================

/** Distance from bottom (px) within which auto-scroll is enabled */
export const AUTO_SCROLL_THRESHOLD_PX = 50 as const;

/** Duration (ms) to ignore scroll events after user sends message */
export const SCROLL_LOCK_DURATION_MS = 1000 as const;
