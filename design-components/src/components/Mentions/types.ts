import type { MentionItemType } from './constants';

/**
 * A mentionable item shown in the @ mentions dropdown.
 */
export interface MentionItem {
  /** Unique identifier (e.g. dashboard_id) */
  id: string;
  /** Display name */
  name: string;
  /** Item type */
  type: MentionItemType;
  /** Version at time of mention */
  version: number;
}
