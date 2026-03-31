import type { MentionItemType } from './constants';

/**
 * Dashboard sub-type — determines which Chalkboard icon variant to show.
 * - 'user'   → ChalkboardTeacher (person silhouette)
 * - 'shared' → Chalkboard  (plain board)
 */
export type DashboardVariant = 'user' | 'shared';

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
  /** Dashboard sub-type for icon differentiation */
  dashboardVariant?: DashboardVariant;
}
