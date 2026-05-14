import { useEffect, useRef, useState } from "react";
import {
  X as XIcon,
  ArrowSquareOut as ArrowSquareOutIcon,
} from "@phosphor-icons/react";
import { AiFieldIcon } from "../icons/AiFieldIcon";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAiField,
  useExistingAiField,
  useActivateField,
  useCreateAiField,
  aiFieldKeys,
} from "../../hooks/useVonAiFields";
import { useUserPusherChannel } from "../../hooks/useUserPusherChannel";
import { useAiFieldEvents } from "../../hooks/useAiFieldEvents";
import useAiFieldsStore from "../../store/vonAiFieldsStore";
import { useUser } from "../../hooks/useUser";
import { AIFieldPlayground } from "./AIFieldPlayground";
import type {
  AiField,
  AiFieldDraft,
  AiFieldStatus,
} from "../../types/vonAiFields";
import { AIFieldFilterBlock } from "./AIFieldFilterBlock";

import { AiFieldSourcesDrawer } from "./AiFieldSourcesDrawer";

// ─── Props ─────────────────────────────────────────────────
interface AIFieldSidePanelProps {
  fieldId: string;
  onClose: () => void;
  onNavigateToSettings?: (realFieldId: string) => void;
}

// ─── Draft-vs-existing comparison ──────────────────────────
// The server's `applied` flag is a snapshot at fetch time and doesn't
// reflect in-memory draft changes that arrive via AI_FIELD_READY. Compute
// "is applied" locally by comparing the current draft against the
// remotely-stored field. Compares only the fields persisted by
// CreateAiFieldRequest, so the comparison is symmetric with what the
// Update/Create call would actually send.
function arraysEqualAsSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

function isDraftApplied(
  draft: AiFieldDraft,
  existing: AiField | null | undefined,
): boolean {
  if (!existing) return false;
  if (draft.name !== existing.name) return false;
  if (draft.description !== existing.description) return false;
  if (draft.objectType !== existing.objectType) return false;
  if (
    (draft.opportunityFilter ?? null) !== (existing.opportunityFilter ?? null)
  )
    return false;

  if (!arraysEqualAsSet(draft.sources ?? [], existing.sources ?? []))
    return false;

  const draftCols = draft.columnsToGenerate ?? [];
  const existingCols = existing.columnsToGenerate ?? [];
  if (draftCols.length !== existingCols.length) return false;
  const existingByName = new Map(existingCols.map((c) => [c.name, c]));
  for (const col of draftCols) {
    const match = existingByName.get(col.name);
    if (!match) return false;
    if (match.description !== col.description) return false;
    if (match.type !== col.type) return false;
  }

  return true;
}

// ─── Date formatter ────────────────────────────────────────
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "\u2014";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Status badge (matching the AI Fields list row style) ──
// Minimal pill-less indicator: just a colored dot + text, no border or
// background. Lives inline next to the field name in the header.
function StatusBadge({ status }: { status: AiFieldStatus }) {
  const isLive = status === "live";
  const label = isLive ? "Live" : status === "draft" ? "Draft" : "Disabled";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        isLive ? "text-gray-900" : "text-gray-400"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isLive ? "bg-green-500" : "bg-gray-300"
        }`}
      />
      {label}
    </span>
  );
}

// ─── Body skeleton ─────────────────────────────────────────
// Shown briefly when the draft is replaced by a fresh AI_FIELD_READY event
// so the user can see that the panel is being refreshed. Mirrors the real
// body's section layout (prompt, run criteria, playground) so the transition
// reads as a refresh rather than a navigation. Uses the repo's standard
// animate-pulse gray placeholders.
function PanelBodySkeleton() {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
      {/* Prompt block */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <div className="h-3 w-14 bg-gray-200 rounded animate-pulse" />
          <div className="ml-auto h-4 w-12 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-28 bg-gray-100 rounded-lg animate-pulse" />
      </div>

      {/* Run Criteria block */}
      <div className="h-11 bg-gray-100 rounded-lg animate-pulse" />

      {/* Playground block */}
      <div className="border border-gray-200 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-10 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-8 bg-gray-100 rounded-md animate-pulse" />
        <div className="space-y-2">
          <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// Length of the refresh skeleton flash when AI_FIELD_READY replaces the draft.
const REFRESH_FLASH_MS = 400;

// ─── Component ─────────────────────────────────────────────
export function AIFieldSidePanel({
  fieldId,
  onClose,
  onNavigateToSettings,
}: AIFieldSidePanelProps) {
  const queryClient = useQueryClient();
  const { user } = useUser();

  const {
    draftAiField,
    setDraftAiField,
    openChatPanel,
    activatingFieldId,
    setActivatingFieldId,
  } = useAiFieldsStore();

  // Draft mode: fieldId matches draftAiField.workflowId (or is "draft" sentinel)
  const isDraft =
    !!draftAiField &&
    (fieldId === "draft" || fieldId === draftAiField.workflowId);

  // Refresh flash: when a new AI_FIELD_READY replaces the draft *while the
  // panel is already showing one*, the content swap is otherwise
  // instantaneous and invisible. Briefly render the body skeleton so the
  // user can see that the panel was refreshed. The initial mount is
  // skipped via hasMountedRef — that case already has its own open-in
  // motion and doesn't need a flash.
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (!draftAiField) return;
    setIsRefreshing(true);
    const t = setTimeout(() => setIsRefreshing(false), REFRESH_FLASH_MS);
    return () => clearTimeout(t);
  }, [draftAiField]);
  // `refetchOnMount: "always"` guarantees every open of the side panel hits
  // the backend for the freshest field state, regardless of the 30s global
  // staleTime. Cached data still renders instantly while the refetch is
  // in-flight, so there's no loading flash for subsequent opens.
  const { data: fetchedField, isLoading } = useAiField(
    isDraft ? null : fieldId,
    { refetchOnMount: "always" },
  );

  // Check if a field already exists (determines Create vs Update vs Disabled)
  // If event has fieldId → lookup by ID. Otherwise → lookup by name.
  const { data: existingField } = useExistingAiField(
    isDraft ? (draftAiField?.fieldId ?? null) : null,
    isDraft && !draftAiField?.fieldId ? (draftAiField?.name ?? null) : null,
  );

  const activateField = useActivateField();
  const createField = useCreateAiField();

  // Button state logic:
  // - No existing field → "Create field"
  // - Existing field, draft differs from saved → "Update field" (enabled)
  // - Existing field, draft matches saved → disabled
  // We compute applied locally (not via the server's `applied` flag) so
  // that a fresh AI_FIELD_READY immediately re-enables the button when
  // the new draft diverges from what's been persisted remotely.
  const isUpdate = isDraft && !!existingField;
  const isApplied =
    isDraft && !!draftAiField && isDraftApplied(draftAiField, existingField);

  // Merge draft and fetched data. Surface the saved field's real status
  // (Live / Disabled) only when the draft matches what's persisted — i.e.
  // the Create/Update button is disabled. The moment the user has unsaved
  // chat-driven changes, the header drops back to "Draft" so the badge
  // tracks "is this what's actually live right now?" rather than "did a
  // live version once exist for this name?".
  const field =
    isDraft && draftAiField
      ? {
          id: draftAiField.fieldId ?? "",
          fieldId: draftAiField.fieldId ?? "",
          name: draftAiField.name,
          displayName: draftAiField.displayName,
          description: draftAiField.description,
          objectType: draftAiField.objectType,
          columnsToGenerate: draftAiField.columnsToGenerate,
          sources: draftAiField.sources,
          opportunityFilter: draftAiField.opportunityFilter,
          displayFilter: draftAiField.displayFilter,
          matchCount: draftAiField.matchCount,
          totalRecords: draftAiField.totalRecords,
          status:
            isApplied && existingField
              ? existingField.status
              : ("draft" as const),
          workflowId: draftAiField.workflowId,
          conversationId: draftAiField.conversationId,
          createdBy: "",
          createdAt: existingField?.createdAt ?? new Date().toISOString(),
          updatedAt: null,
        }
      : fetchedField;

  // Use user channel for real-time playground/activate events
  const { channel } = useUserPusherChannel({
    tenantId: user?.tenantId,
    userId: user?.id,
  });
  useAiFieldEvents(channel);

  const isActivating = activatingFieldId === fieldId;
  const status = field?.status ?? "draft";

  const handleActivate = async () => {
    if (!field) return;
    setActivatingFieldId(field.fieldId);
    try {
      await activateField.mutateAsync(field.fieldId);
    } catch {
      // Error handled by the mutation's onError + Pusher events
    }
  };

  const handleCreate = async () => {
    if (!draftAiField) return;
    setActivatingFieldId("draft");
    try {
      const response = await createField.mutateAsync({
        name: draftAiField.name,
        description: draftAiField.description,
        objectType: draftAiField.objectType,
        columnsToGenerate: draftAiField.columnsToGenerate,
        sources: draftAiField.sources,
        opportunityFilter: draftAiField.opportunityFilter,
        conversationId: draftAiField.conversationId,
        workflowId: draftAiField.workflowId,
      });
      // Seed cache and switch to created mode
      queryClient.setQueryData(
        aiFieldKeys.detail(response.field.fieldId),
        response.field,
      );
      setDraftAiField(null);
      openChatPanel(response.field.fieldId);
      setActivatingFieldId(null);
    } catch {
      setActivatingFieldId(null);
    }
  };

  // ─── Loading state ─────────────────────────────────────────
  if (!isDraft && isLoading) {
    return (
      <div className="flex flex-col h-full bg-white border-l border-gray-200">
        <div className="flex items-center justify-center flex-1">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" />
        </div>
      </div>
    );
  }

  // ─── Not found state ──────────────────────────────────────
  if (!field) {
    return (
      <div className="flex flex-col h-full bg-white border-l border-gray-200">
        <div className="flex items-center justify-center flex-1">
          <span className="text-sm text-gray-500">Field not found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="px-5 py-3 border-b border-gray-200 shrink-0">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
              <AiFieldIcon size={18} className="text-gray-500" />
            </span>
            <span className="text-base font-semibold text-gray-900 truncate">
              {field.displayName ?? field.name}
            </span>
            <StatusBadge status={status} />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {(status === "live" || isApplied) && onNavigateToSettings && (
              <button
                onClick={() => {
                  const realId = existingField?.fieldId ?? field.fieldId;
                  if (realId) onNavigateToSettings(realId);
                }}
                className="flex items-center gap-1.5 h-[34px] px-2.5 text-sm font-medium text-gray-800 bg-white border border-gray-200/70 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                <ArrowSquareOutIcon size={13} />
                View in Settings
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <XIcon size={18} />
            </button>
          </div>
        </div>

        {/* Meta row — full width below title */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <AiFieldSourcesDrawer sources={field.sources ?? []} />
          <span className="text-xs text-gray-400">
            Created {formatDate(field.createdAt)}
          </span>
        </div>
      </div>

      {/* ─── Body ────────────────────────────────────────────── */}
      {isRefreshing ? (
        <PanelBodySkeleton />
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Prompt */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Prompt
              </span>
              {field.columnsToGenerate &&
                field.columnsToGenerate.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                    {field.columnsToGenerate.map((col) => (
                      <span
                        key={col.name}
                        className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded"
                      >
                        {col.type}
                      </span>
                    ))}
                  </div>
                )}
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 max-h-60 overflow-y-auto settings-scrollbar">
              <p className="text-sm text-gray-700 m-0 whitespace-pre-wrap">
                {field.description || "No prompt provided."}
              </p>
            </div>
          </div>

          {/* Run Criteria */}
          {field.displayFilter && field.displayFilter.length > 0 && (
            <AIFieldFilterBlock conditions={field.displayFilter} />
          )}

          {/* Playground */}
          <AIFieldPlayground
            columnsToGenerate={field.columnsToGenerate}
            sources={field.sources}
            opportunityFilter={field.opportunityFilter}
            sampleOpportunities={
              isDraft ? draftAiField?.sampleOpportunities : undefined
            }
          />
        </div>
      )}

      {/* ─── Footer ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50 shrink-0">
        <span className="text-xs text-gray-400">Edit via chat</span>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {isDraft && !isApplied && (
            <button
              onClick={handleCreate}
              disabled={isActivating}
              className="px-4 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isActivating
                ? isUpdate
                  ? "Updating..."
                  : "Creating..."
                : isUpdate
                  ? "Update field"
                  : "Create field"}
            </button>
          )}

          {isDraft && isApplied && (
            <div className="relative group">
              <button
                disabled
                className="px-4 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg opacity-50 cursor-not-allowed"
              >
                {isUpdate ? "Update field" : "Create field"}
              </button>
              <div className="absolute bottom-full mb-2 right-0 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Already applied
              </div>
            </div>
          )}

          {!isDraft && status === "draft" && (
            <button
              onClick={handleActivate}
              disabled={isActivating}
              className="px-4 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isActivating ? "Creating..." : "Create field"}
            </button>
          )}

          {!isDraft && status === "live" && (
            <div className="relative group">
              <button
                disabled
                className="px-4 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg opacity-50 cursor-not-allowed"
              >
                Update field
              </button>
              <div className="absolute bottom-full mb-2 right-0 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                No changes to update yet
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
