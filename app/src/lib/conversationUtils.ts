/**
 * Generate numbered conversation title
 * Format: "New Chat 1", "New Chat 2", etc.
 *
 * @param existingCount - Total number of existing conversations
 * @returns Numbered title for new conversation
 */
export function generateConversationTitle(existingCount: number): string {
  return `New Chat ${existingCount + 1}`;
}
