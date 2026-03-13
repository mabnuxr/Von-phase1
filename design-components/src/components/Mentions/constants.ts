/**
 * Mention item type discriminator.
 * Extend as new mentionable entity types are added.
 */
export const MentionItemType = {
  Dashboard: 'dashboard',
} as const;

export type MentionItemType = (typeof MentionItemType)[keyof typeof MentionItemType];
