/**
 * Application-wide constants for hooks and React Query configuration
 * All constants are exported as readonly for protection against accidental modification
 */

// ============================================================================
// React Query Configuration Constants
// ============================================================================

/**
 * Time in milliseconds that data is considered fresh for conversations list
 * After this time, React Query will refetch data on component mount or window focus
 */
export const CONVERSATIONS_STALE_TIME = 30000 as const; // 30 seconds

/**
 * Time in milliseconds that data is considered fresh for conversation messages
 * Shorter than conversations since messages update more frequently
 */
export const MESSAGES_STALE_TIME = 10000 as const; // 10 seconds

/**
 * Time in milliseconds that data is considered fresh for user preferences
 * Longer than other queries since preferences rarely change
 */
export const PREFERENCES_STALE_TIME = 300000 as const; // 5 minutes (5 * 60 * 1000)

// ============================================================================
// Debounce Constants
// ============================================================================

/**
 * Debounce delay in milliseconds for preferences auto-save
 * Batches multiple rapid edits into a single API call
 */
export const PREFERENCES_DEBOUNCE_DELAY = 2000 as const; // 2 seconds

// ============================================================================
// Pagination Constants
// ============================================================================

/**
 * Default number of conversations to fetch per page in infinite scroll
 */
export const CONVERSATIONS_PAGE_LIMIT = 20 as const;

/**
 * Default number of messages to fetch per page in infinite scroll
 */
export const MESSAGES_PAGE_LIMIT = 10 as const;

// ============================================================================
// OAuth & Integration Polling Constants
// ============================================================================

/**
 * OAuth polling timeout duration in milliseconds
 * After this time, polling will stop if authentication hasn't completed
 */
export const OAUTH_POLLING_TIMEOUT_MS = 30000 as const; // 30 seconds

/**
 * Interval in milliseconds for polling OAuth authentication status
 */
export const OAUTH_POLLING_INTERVAL_MS = 3000 as const; // 3 seconds

/**
 * Delay in milliseconds to check if OAuth popup was blocked
 */
export const OAUTH_POPUP_CHECK_DELAY_MS = 100 as const;

// ============================================================================
// Intersection Observer Constants
// ============================================================================

/**
 * Threshold for Intersection Observer in infinite scroll
 * 1.0 means the element must be fully visible before triggering
 */
export const INFINITE_SCROLL_THRESHOLD = 1.0 as const;

// ============================================================================
// Message Cache Constants
// ============================================================================

/**
 * Maximum size of the replay cache for AGUI event reconstruction
 * Prevents unbounded memory growth from cached replayed events
 */
export const MAX_REPLAY_CACHE_SIZE = 1000 as const;

/**
 * Timeout duration in milliseconds while waiting for response
 * After this time, the response will be considered timed out
 */
export const STREAM_TIMEOUT_MS = 300000 as const; // 300 seconds (5 minutes)

// ============================================================================
// Artifact Query Configuration Constants
// ============================================================================

/**
 * Time in milliseconds that artifact data is considered fresh
 * Artifacts are cached longer since they rarely change once created
 */
export const ARTIFACT_STALE_TIME = 3600000 as const; // 1 hour (60 * 60 * 1000)

/**
 * Garbage collection time in milliseconds for artifact data
 * Determines how long unused artifact data stays in cache before cleanup
 */
export const ARTIFACT_GC_TIME = 7200000 as const; // 2 hours (2 * 60 * 60 * 1000)

/**
 * Number of retry attempts for failed artifact queries
 * Uses exponential backoff between retries
 */
export const ARTIFACT_RETRY_COUNT = 3 as const;

/**
 * Maximum delay in milliseconds between artifact query retries
 * Caps exponential backoff to prevent excessively long delays
 */
export const ARTIFACT_MAX_RETRY_DELAY = 30000 as const; // 30 seconds

// ============================================================================
// UI Text & Display Constants
// ============================================================================

/**
 * Maximum length for error messages before truncation
 * Applied to error displays in thinking blocks and tool call items
 */
export const ERROR_MESSAGE_TRUNCATE_LENGTH = 100 as const;

// ============================================================================
// UI Dimensions Constants
// ============================================================================

/**
 * Default width for artifact side panel
 */
export const ARTIFACT_PANE_WIDTH = "480px" as const;

// ============================================================================
// Type Exports
// ============================================================================

/**
 * Re-export all constants as a single object for convenience
 * Useful when you need to pass multiple constants or for testing
 */
export const QUERY_CONSTANTS = {
  CONVERSATIONS_STALE_TIME,
  MESSAGES_STALE_TIME,
  PREFERENCES_STALE_TIME,
  PREFERENCES_DEBOUNCE_DELAY,
  CONVERSATIONS_PAGE_LIMIT,
  MESSAGES_PAGE_LIMIT,
  OAUTH_POLLING_TIMEOUT_MS,
  OAUTH_POLLING_INTERVAL_MS,
  OAUTH_POPUP_CHECK_DELAY_MS,
  INFINITE_SCROLL_THRESHOLD,
  MAX_REPLAY_CACHE_SIZE,
  STREAM_TIMEOUT_MS,
  ARTIFACT_STALE_TIME,
  ARTIFACT_GC_TIME,
  ARTIFACT_RETRY_COUNT,
  ARTIFACT_MAX_RETRY_DELAY,
  ERROR_MESSAGE_TRUNCATE_LENGTH,
  ARTIFACT_PANE_WIDTH,
} as const;
