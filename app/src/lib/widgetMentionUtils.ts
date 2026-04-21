import type {
  MentionItem,
  WidgetAddToChatPayload,
  WidgetMentionType,
} from "@vonlabs/design-components";
import { MentionItemType } from "@vonlabs/design-components";

/**
 * Map the design-components WidgetType ('chart' | 'counter' | 'table' | 'text')
 * to the wire-level widgetType required by the backend contract
 * ('kpi' | 'chart' | 'table' | 'text'). Only 'counter' differs.
 */
export function mapWidgetTypeToWire(
  type: WidgetAddToChatPayload["type"],
): WidgetMentionType {
  return type === "counter" ? "kpi" : type;
}

export interface ParentDashboardSnapshot {
  dashboardId: string;
  dashboardVersion: number;
  dashboardName: string;
}

/**
 * Build a widget MentionItem from the widget payload + a snapshot of the
 * parent dashboard at the moment the user clicked the "Add to chat" icon.
 */
export function buildWidgetMention(
  widget: WidgetAddToChatPayload,
  parent: ParentDashboardSnapshot,
): MentionItem {
  return {
    id: widget.id,
    name: widget.title,
    type: MentionItemType.Widget,
    version: 0,
    refId: crypto.randomUUID(),
    widgetContext: {
      widgetId: widget.id,
      widgetTitle: widget.title,
      widgetType: mapWidgetTypeToWire(widget.type),
      dashboardId: parent.dashboardId,
      dashboardVersion: parent.dashboardVersion,
      dashboardName: parent.dashboardName,
    },
  };
}
