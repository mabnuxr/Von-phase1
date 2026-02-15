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

/**
 * Time in milliseconds that Salesforce opportunity stages are considered fresh
 * Stages don't change frequently, so cached for same duration as preferences
 */
export const SALESFORCE_STAGES_STALE_TIME = 300000 as const; // 5 minutes (5 * 60 * 1000)

/**
 * Number of retry attempts for failed Salesforce queries
 */
export const SALESFORCE_RETRY_COUNT = 1 as const;

/**
 * Whether to refetch Salesforce data when window regains focus
 * Set to false since Salesforce data is relatively static
 */
export const SALESFORCE_REFETCH_ON_FOCUS = false as const;

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
export const OAUTH_POLLING_TIMEOUT_MS = 60000 as const; // 60 seconds

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
 * 0.1 means the callback fires when 10% of the sentinel is visible,
 * which is more reliable than 1.0 for small sentinel elements
 */
export const INFINITE_SCROLL_THRESHOLD = 0.1 as const;

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
// Pusher Connection & Reconciliation Constants
// ============================================================================

/**
 * Pusher activity timeout in seconds.
 * Time without any Pusher activity before considering the connection dead.
 * Default is 120s — reduced to 45s for faster dead-connection detection.
 * Backend has 30s timeout to send events, so 45s provides safe margin.
 */
export const PUSHER_ACTIVITY_TIMEOUT_S = 45 as const;

/**
 * Pusher pong timeout in seconds.
 * Time to wait for a pong response from the Pusher server.
 * Default is 30s — reduced to 10s for faster failure detection.
 */
export const PUSHER_PONG_TIMEOUT_S = 10 as const;

/**
 * Stall threshold in milliseconds.
 * If no AGUI events are received for this duration during active streaming,
 * the connection is considered stalled and reconciliation is triggered.
 */
export const RECONCILIATION_STALL_THRESHOLD_MS = 45000 as const; // 45 seconds

/**
 * Health check interval in milliseconds.
 * How frequently to check for stalled connections during active streaming.
 */
export const RECONCILIATION_CHECK_INTERVAL_MS = 10000 as const; // 10 seconds

// ============================================================================
// Permissions Query Configuration Constants
// ============================================================================

/**
 * Time in milliseconds that permissions data is considered fresh
 * Permissions don't change frequently, cache for 5 minutes
 */
export const PERMISSIONS_STALE_TIME = 300000 as const; // 5 minutes (5 * 60 * 1000)

/**
 * Garbage collection time in milliseconds for permissions data
 * Keep permissions in cache for 10 minutes after becoming inactive
 */
export const PERMISSIONS_GC_TIME = 600000 as const; // 10 minutes (10 * 60 * 1000)

/**
 * Number of retry attempts for failed permissions queries
 */
export const PERMISSIONS_RETRY_COUNT = 1 as const;

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
// Asset URLs
// ============================================================================

/**
 * Von Labs logo URL hosted on S3
 * Used across the application for brand consistency
 */
export const LOGO_URL =
  "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/vonlabs-logo.gif" as const;

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
  SALESFORCE_STAGES_STALE_TIME,
  SALESFORCE_RETRY_COUNT,
  SALESFORCE_REFETCH_ON_FOCUS,
  PREFERENCES_DEBOUNCE_DELAY,
  CONVERSATIONS_PAGE_LIMIT,
  MESSAGES_PAGE_LIMIT,
  OAUTH_POLLING_TIMEOUT_MS,
  OAUTH_POLLING_INTERVAL_MS,
  OAUTH_POPUP_CHECK_DELAY_MS,
  INFINITE_SCROLL_THRESHOLD,
  MAX_REPLAY_CACHE_SIZE,
  STREAM_TIMEOUT_MS,
  PUSHER_ACTIVITY_TIMEOUT_S,
  PUSHER_PONG_TIMEOUT_S,
  RECONCILIATION_STALL_THRESHOLD_MS,
  RECONCILIATION_CHECK_INTERVAL_MS,
  PERMISSIONS_STALE_TIME,
  PERMISSIONS_GC_TIME,
  PERMISSIONS_RETRY_COUNT,
  ARTIFACT_STALE_TIME,
  ARTIFACT_GC_TIME,
  ARTIFACT_RETRY_COUNT,
  ARTIFACT_MAX_RETRY_DELAY,
  ERROR_MESSAGE_TRUNCATE_LENGTH,
  ARTIFACT_PANE_WIDTH,
  LOGO_URL,
} as const;
