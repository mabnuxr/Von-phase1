import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SparkleIcon, CheckIcon } from "@phosphor-icons/react";
import { Streamdown } from "streamdown";
import { OrgContextEditor } from "./OrgContextEditor";
import type { MemoryContext } from "../types/memoryContext";
import { MEMORY_CONTEXT_LIMITS } from "../types/memoryContext";

/**
 * Which memory fields a Von proposal is touching. Only these fields get the
 * loading treatment; other fields stay live-editable during generation.
 */
export type ProposalField = "title" | "description" | "content";

/**
 * State machine for a Von-generated edit. Owned by the parent so both the
 * editor (renders visual treatment) and the chat pane (knows when to trigger)
 * see the same source of truth. The UI-only demo drives this through fake
 * timers; the backend integration will drive it from stream events.
 *
 * Loading + proposed states both carry the id of the memory the proposal
 * targets, so the badge in the sidebar can stay pinned to that specific memory
 * regardless of which pill the user is currently viewing.
 */
export type ProposalState =
  | { kind: "idle" }
  | {
      kind: "loading";
      contextId: string;
      fields: ReadonlySet<ProposalField>;
    }
  | {
      kind: "proposed";
      contextId: string;
      changes: { key?: string; description?: string; value?: string };
    };

/**
 * Circular progress indicator for character budget. Only renders once usage
 * climbs into warning territory (≥60%). Amber from 60–90%, red above. Hover
 * surfaces the exact count via a small custom tooltip (native `title` was
 * unreliable — long delays, inconsistent across browsers).
 */
function CharacterBudget({ current, max }: { current: number; max: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const ratio = current / max;
  if (ratio < 0.6) return null;

  const clampedRatio = Math.min(1, ratio);
  const isCritical = ratio >= 0.9;
  const color = isCritical ? "#ef4444" : "#f59e0b";

  const size = 12;
  const stroke = 1.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - clampedRatio * circumference;

  const tooltipText = `${current.toLocaleString()} / ${max.toLocaleString()} characters`;

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={tooltipText}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 150ms ease" }}
        />
      </svg>
      {isHovered && (
        <span
          role="tooltip"
          className="absolute bottom-full right-0 mb-1.5 px-2 py-1 rounded-md bg-gray-900 text-white text-xs whitespace-nowrap shadow-sm pointer-events-none z-20"
        >
          {tooltipText}
        </span>
      )}
    </span>
  );
}

interface MemoryContextEditorProps {
  mode: "create" | "edit";
  context?: MemoryContext | null;
  onSave: (data: {
    key: string;
    description: string;
    value: string;
  }) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
  /** Opens the Ask Von chat pane. Rendered as a CTA at the right edge of the
   *  content editor toolbar when provided. */
  onEditWithVon?: () => void;
  /** Forwarded to the TipTap editor — fires when a stable text selection is
   *  made inside Memory Content (used to build chat context chips). */
  onSelectionCapture?: (text: string) => void;
  /** Active Von proposal state. Drives the review card + editor treatment. */
  proposal?: ProposalState;
  /** Called when the user accepts the proposal — after the editor has
   *  applied the changes to its local form state. */
  onProposalApplied?: () => void;
  /** Called when the user dismisses the proposal without applying it. */
  onProposalDismissed?: () => void;
}

/**
 * Inline memory context editor — mirrors the form that used to live in the
 * MemoryContextPane drawer. Callers should remount (via `key`) when switching
 * between contexts so the initial form values stay in sync.
 */
export function MemoryContextEditor({
  mode,
  context,
  onSave,
  onCancel,
  isSaving = false,
  onEditWithVon,
  onSelectionCapture,
  proposal = { kind: "idle" },
  onProposalApplied,
  onProposalDismissed,
}: MemoryContextEditorProps) {
  // `context` seeds initial values in BOTH modes — edit mode loads an existing
  // memory, create mode can pre-fill from a draft (e.g., a Von-proposed new
  // section the user chose to "Edit" before inserting).
  const [editingKey, setEditingKey] = useState(context ? context.key : "");
  const [editingDescription, setEditingDescription] = useState(
    context ? context.description : "",
  );
  const [editingContent, setEditingContent] = useState(
    context ? (context.value ?? "") : "",
  );

  // Stable per-instance key + a monotonic version bump we can nudge to force
  // OrgContextEditor to re-parse the markdown when we programmatically swap
  // the content (e.g. after the user accepts a Von proposal).
  const instanceId = useId();
  const [contentVersion, setContentVersion] = useState(0);
  const contentKey = `${instanceId}-${contentVersion}`;

  const isLoadingProposal = proposal.kind === "loading";
  const isProposed = proposal.kind === "proposed";
  const proposalFields = isLoadingProposal
    ? proposal.fields
    : isProposed
      ? (new Set<ProposalField>([
          ...(proposal.changes.key !== undefined ? ["title" as const] : []),
          ...(proposal.changes.description !== undefined
            ? ["description" as const]
            : []),
          ...(proposal.changes.value !== undefined
            ? ["content" as const]
            : []),
        ]) as ReadonlySet<ProposalField>)
      : (new Set<ProposalField>() as ReadonlySet<ProposalField>);

  const handleApplyProposal = () => {
    if (proposal.kind !== "proposed") return;
    if (proposal.changes.key !== undefined) setEditingKey(proposal.changes.key);
    if (proposal.changes.description !== undefined)
      setEditingDescription(proposal.changes.description);
    if (proposal.changes.value !== undefined) {
      setEditingContent(proposal.changes.value);
      // Bump the content key so the TipTap editor re-parses the new markdown
      // instead of diffing it against its prior state.
      setContentVersion((v) => v + 1);
    }
    onProposalApplied?.();
  };

  const handleDismissProposal = () => {
    onProposalDismissed?.();
  };

  const isDefault = mode === "edit" && context?.isDefault;
  const isUserMemory = mode === "edit" && context?.accessLevel === "user";
  const isTitleReadOnly = isDefault || isUserMemory;

  const isValid =
    editingKey.trim().length > 0 &&
    (isUserMemory || editingDescription.trim().length > 0) &&
    editingKey.length <= MEMORY_CONTEXT_LIMITS.key &&
    (isUserMemory ||
      editingDescription.length <= MEMORY_CONTEXT_LIMITS.description) &&
    editingContent.length <= MEMORY_CONTEXT_LIMITS.value;

  const handleSave = async () => {
    await onSave({
      key: editingKey,
      description: editingDescription,
      value: editingContent,
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Von proposal review card — pinned above everything while proposed. */}
      <AnimatePresence initial={false}>
        {isProposed && (
          <motion.div
            key="proposal-review"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex-shrink-0 mx-4 mt-4 flex items-start gap-3 px-3 py-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/70"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-800">
                <SparkleIcon
                  size={14}
                  weight="fill"
                  className="text-emerald-600"
                />
                Von proposed changes
              </div>
              <p className="text-xs text-emerald-900/70 mt-0.5 capitalize">
                {[...proposalFields]
                  .map((f) => (f === "title" ? "title" : f))
                  .join(", ")}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={handleDismissProposal}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-800 bg-white border border-gray-200/80 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={handleApplyProposal}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-white bg-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                Insert
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Non-scrolling top section: title + description */}
      {!isUserMemory && (
        <div className="flex-shrink-0 px-4 pt-4 flex flex-col gap-4">
          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs text-gray-800">
                Title <span className="text-gray-600">*</span>
                {isTitleReadOnly && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Read-only)
                  </span>
                )}
              </label>
              <CharacterBudget
                current={editingKey.length}
                max={MEMORY_CONTEXT_LIMITS.key}
              />
            </div>
            <input
              type="text"
              value={editingKey}
              onChange={(e) => setEditingKey(e.target.value)}
              disabled={isTitleReadOnly}
              className={`w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-300 transition-all ${
                isTitleReadOnly
                  ? "opacity-60 cursor-not-allowed bg-gray-50"
                  : ""
              }`}
              placeholder="e.g., Pricing Structure"
            />
            {isTitleReadOnly && (
              <p className="mt-1.5 text-xs text-gray-500">
                The title of the default context cannot be changed.
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs text-gray-800">
                When should the agent use this?{" "}
                <span className="text-gray-600">*</span>
              </label>
              <CharacterBudget
                current={editingDescription.length}
                max={MEMORY_CONTEXT_LIMITS.description}
              />
            </div>
            <textarea
              value={editingDescription}
              onChange={(e) => setEditingDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-300 transition-all resize-none"
              placeholder="e.g., When answering questions about pricing or discounts"
            />
          </div>
        </div>
      )}

      {/* Memory Content — stretches to fill remaining space so the TipTap
          editor gets a concrete height to scroll within. */}
      <div className="flex-1 min-h-0 flex flex-col px-4 pt-4">
        <div className="flex items-center justify-between mb-1 flex-shrink-0">
          <label className="block text-xs text-gray-800">Memory Content</label>
          <CharacterBudget
            current={editingContent.length}
            max={MEMORY_CONTEXT_LIMITS.value}
          />
        </div>
        {isLoadingProposal && proposalFields.has("content") ? (
          /* Loading treatment: Von gradient ring around the editor + shimmer
             overlay. Editor is locked so the user can't type over a mutation
             in flight. */
          <div className="flex-1 min-h-0 relative rounded-xl p-[1.5px] bg-[linear-gradient(130deg,#ff9042_0%,#854fff_100%)]">
            <div className="h-full w-full bg-white rounded-[11px] overflow-hidden relative memory-shimmer-overlay">
              <OrgContextEditor
                content={editingContent}
                onChange={setEditingContent}
                isEditing={false}
                placeholder="Add the memory content here..."
                contentKey={contentKey}
                onSelectionCapture={onSelectionCapture}
              />
            </div>
          </div>
        ) : isProposed && proposalFields.has("content") ? (
          /* Proposed treatment: replace the editor with a read-only preview
             of the proposal. Accept/Dismiss in the review card drives the
             transition back to the editor. */
          <div className="flex-1 min-h-0 border border-emerald-200 bg-emerald-50/40 rounded-xl overflow-hidden">
            <div className="h-full w-full overflow-y-auto settings-scrollbar p-4">
              <div className="prose prose-sm max-w-full w-full text-sm [&>*]:text-sm [&>*]:leading-relaxed [&>*]:break-words [&_[data-streamdown]:first-child]:!mt-1 [&_pre]:overflow-x-auto [&_code]:break-all">
                <Streamdown parseIncompleteMarkdown={false}>
                  {proposal.kind === "proposed" && proposal.changes.value
                    ? proposal.changes.value
                    : editingContent}
                </Streamdown>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 border border-gray-200/80 rounded-xl overflow-hidden">
            <OrgContextEditor
              content={editingContent}
              onChange={setEditingContent}
              isEditing={true}
              placeholder="Add the memory content here..."
              contentKey={contentKey}
              onEditWithVon={onEditWithVon}
              onSelectionCapture={onSelectionCapture}
            />
          </div>
        )}
      </div>

      {/* Sticky footer */}
      <div className="flex-shrink-0 px-3 py-2.5 mt-4 border-t border-gray-100 bg-white flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-2.5 py-1.5 text-sm text-gray-800 border border-gray-200/80 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!isValid || isSaving}
          title={
            !isValid &&
            editingKey.trim().length > 0 &&
            editingDescription.trim().length > 0
              ? "One or more fields exceed character limits"
              : undefined
          }
          className="px-2.5 py-1.5 text-sm text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
              ? "Create Memory"
              : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

export default MemoryContextEditor;
