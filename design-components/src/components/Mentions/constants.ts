/**
 * Mention item type discriminator.
 * Extend as new mentionable entity types are added.
 */
export const MentionItemType = {
  Dashboard: 'dashboard',
  Widget: 'widget',
  /** Text snippet captured from a memory body — shown with a text-align icon
   *  to signal "quoted passage" instead of a widget/dashboard chip. */
  Snippet: 'snippet',
} as const;

export type MentionItemType = (typeof MentionItemType)[keyof typeof MentionItemType];
