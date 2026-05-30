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

// ============================================================================
// Asset URLs
// ============================================================================

/**
 * Von Labs logo URL hosted on S3 (animated gif)
 * Used across the application for brand consistency
 */
export const LOGO_URL =
  'https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/vonlabs-logo.gif' as const;

/**
 * Von Labs static logo mark (v2 PNG) hosted on S3.
 * Used for the brand badge/avatar across chat and icon surfaces.
 */
export const LOGO_MARK_URL =
  'https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/v2/vonlabs-logo.png' as const;

// ============================================================================
// External API URLs
// ============================================================================

/**
 * Thesys C1 API base URL for dashboard generation
 */
export const THESYS_API_URL = 'https://api.thesys.dev/v1/embed' as const;
