import type { AiFieldDraft, AiFieldObjectType } from "../types/vonAiFields";

// AI_FIELD_READY payloads arrive in both camelCase (live Pusher events) and
// snake_case (persisted MongoDB events). This is the single place that
// normalizes either shape into an AiFieldDraft, so the event processor,
// restore-on-mount, and card injection can't drift apart.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function aiFieldToDraft(af: any): AiFieldDraft {
  return {
    fieldId: af.fieldId ?? af.field_id ?? null,
    workflowId: af.workflowId ?? af.workflow_id ?? "",
    name: af.name ?? "",
    displayName: af.displayName ?? af.display_name,
    description: af.description ?? "",
    objectType: (af.objectType ??
      af.object_type ??
      "opportunity") as AiFieldObjectType,
    columnsToGenerate:
      af.columnsToGenerate ??
      af.columns_to_generate ??
      (af.columnsGenerated ?? af.columns_generated ?? []).map(
        (name: string) => ({ name, description: "", type: "string" }),
      ),
    columnsGenerated: af.columnsGenerated ?? af.columns_generated ?? [],
    sources: af.sources ?? [],
    opportunityFilter: af.opportunityFilter ?? af.opportunity_filter ?? null,
    displayFilter: af.displayFilter ?? af.display_filter,
    matchCount: af.matchCount ?? af.match_count ?? null,
    totalRecords: af.totalRecords ?? af.total_records ?? null,
    sampleOpportunities: af.sampleOpportunities ?? af.sample_opportunities,
    conversationId: af.conversationId ?? af.conversation_id ?? null,
  };
}

// Stable identity for a draft across the store, the chat card's fieldId, and
// the open side panel. A field keeps the same workflowId as the user iterates
// on it, so re-emissions replace in place rather than piling up. "draft" is the
// last-resort sentinel for the (unexpected) case of a missing workflowId.
export function draftKey(draft: Pick<AiFieldDraft, "workflowId">): string {
  return draft.workflowId || "draft";
}
