// ============================================================================
// TimelineThinkingProcess Formatters
// ============================================================================

/**
 * Formats elapsed time in seconds to a human-readable string
 *
 * @param seconds - The number of seconds elapsed
 * @returns Formatted string like "5s" or "2m 30s"
 */
export const formatElapsedTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};
