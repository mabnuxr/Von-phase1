import type { MentionItemType } from './constants';

/**
 * Dashboard sub-type — determines which Chalkboard icon variant to show.
 * - 'user'   → ChalkboardTeacher (person silhouette)
 * - 'shared' → Chalkboard  (plain board)
 */
export type DashboardVariant = 'user' | 'shared';

/**
 * Widget type on the wire (matches UI-contract.md). Counter widgets map to 'kpi'.
 */
export type WidgetMentionType = 'kpi' | 'chart' | 'table' | 'text';

/**
 * Snapshot of a widget at tag time. Self-contained — carries parent dashboard
 * identity so the backend can resolve access via the parent dashboard.
 */
export interface WidgetMentionContext {
  widgetId: string;
  widgetTitle: string;
  widgetType: WidgetMentionType;
  dashboardId: string;
  dashboardVersion: number;
  dashboardName: string;
}

/**
 * A mentionable item shown in the @ mentions dropdown.
 */
export interface MentionItem {
  /** Unique identifier (e.g. dashboard_id, widget_id) */
  id: string;
  /** Display name */
  name: string;
  /** Item type */
  type: MentionItemType;
  /** Version at time of mention */
  version: number;
  /** Dashboard sub-type for icon differentiation */
  dashboardVariant?: DashboardVariant;
  /** Whether this is the currently open/in-viewport dashboard */
  isCurrent?: boolean;
  /** Client-generated reference id, stable per tag instance. Used on the wire. */
  refId?: string;
  /** Populated only when type === 'widget'. Snapshot at tag time. */
  widgetContext?: WidgetMentionContext;
}
