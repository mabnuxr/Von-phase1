import {
  Lightning as LightningIcon,
  X as XIcon,
  ArrowSquareOut as ArrowSquareOutIcon,
  LockSimple as LockSimpleIcon,
} from "@phosphor-icons/react";
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
import type { AiFieldStatus } from "../../types/vonAiFields";
import { AIFieldFilterBlock } from "./AIFieldFilterBlock";

import { AiFieldSourcesDrawer } from "./AiFieldSourcesDrawer";

// ─── Props ─────────────────────────────────────────────────
interface AIFieldSidePanelProps {
  fieldId: string;
  onClose: () => void;
  onNavigateToSettings?: (realFieldId: string) => void;
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

// ─── Status badge (matching VonAiFieldDetailPane pattern) ──
function StatusBadge({ status }: { status: AiFieldStatus }) {
  switch (status) {
    case "live":
      return (
        <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-medium text-green-700 border border-green-200">
          <span className="w-[5px] h-[5px] rounded-full bg-green-500" />
          Live
        </span>
      );
    case "disabled":
      return (
        <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-medium text-gray-600 border border-gray-200">
          <span className="w-[5px] h-[5px] rounded-full bg-gray-400" />
          Disabled
        </span>
      );
    case "draft":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-medium text-amber-700 border border-amber-200">
          <span className="w-[5px] h-[5px] rounded-full bg-amber-400" />
          Draft
        </span>
      );
  }
}

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
  // - Existing field, applied: false → "Update field"
  // - Existing field, applied: true → disabled
  const isUpdate = isDraft && !!existingField;
  const isApplied = isDraft && !!existingField?.applied;

  // Merge draft and fetched data. When the draft maps to an already-applied
  // field (Create/Update button is disabled), surface that field's real
  // status — otherwise we'd label a Live field as "Draft" in the header.
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
          status: existingField?.status ?? ("draft" as const),
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
              <LightningIcon
                size={18}
                weight="fill"
                className="text-gray-500"
              />
            </span>
            <span className="text-base font-semibold text-gray-900 truncate">
              {field.displayName ?? field.name}
            </span>
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
          <StatusBadge status={status} />
          <AiFieldSourcesDrawer sources={field.sources ?? []} />
          <span className="text-xs text-gray-400">
            Created {formatDate(field.createdAt)}
          </span>
        </div>
      </div>

      {/* ─── Body ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Prompt */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Prompt
            </span>
            <span className="flex items-center gap-1 ml-auto text-gray-400">
              <LockSimpleIcon size={12} />
              <span className="text-[10.5px] uppercase tracking-wide font-medium">
                Edit in chat
              </span>
            </span>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-700 m-0 whitespace-pre-wrap">
              {field.description || "No prompt provided."}
            </p>
          </div>
        </div>

        {/* Filter */}
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
