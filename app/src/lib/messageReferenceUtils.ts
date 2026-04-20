import type { MentionItem } from "@vonlabs/design-components";
import { MentionItemType } from "@vonlabs/design-components";
import { ReferenceType } from "../types/constants";
import type { MessageReference } from "../types/conversation";

/**
 * Map chat MentionItems to backend MessageReferences. Widget mentions emit
 * a self-contained widget ref; dashboard mentions build a dashboard ref from
 * the MentionItem fields. See UI-contract.md for the wire shape.
 */
export function buildMentionReferences(
  mentions: MentionItem[],
): MessageReference[] {
  return mentions.flatMap((m): MessageReference[] => {
    if (m.type === MentionItemType.Widget) {
      if (!m.widgetContext) return [];
      return [
        {
          refId: m.refId ?? `${ReferenceType.Widget}-${m.id}`,
          type: ReferenceType.Widget,
          context: m.widgetContext,
        },
      ];
    }
    return [
      {
        refId: m.refId ?? `${ReferenceType.Dashboard}-${m.id}`,
        type: ReferenceType.Dashboard,
        context: {
          dashboardId: m.id,
          dashboardVersion: m.version,
          dashboardName: m.name,
        },
      },
    ];
  });
}
