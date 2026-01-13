import type { CallTranscript } from '../types';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Groups call transcripts by month for timeline display
 *
 * @param calls - Array of call transcripts to group
 * @returns Object with month-year keys and arrays of calls
 */
export const groupCallsByMonth = (calls: CallTranscript[]): Record<string, CallTranscript[]> => {
  const groups: Record<string, CallTranscript[]> = {};

  calls.forEach((call) => {
    const date = new Date(call.date);
    const monthYear = date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(call);
  });

  return groups;
};
