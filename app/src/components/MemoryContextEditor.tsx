import { useRef, useState, useId } from "react";
import { PaperclipIcon } from "@phosphor-icons/react";
import {
  FileChip,
  generateFileId,
  getFileInfo,
  getAcceptString,
  type FileAttachment,
} from "@vonlabs/design-components";
import { OrgContextEditor } from "./OrgContextEditor";
import {
  MEMORY_CONTEXT_LIMITS,
  type MemoryContext,
} from "../types/memoryContext";

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
    attachments: FileAttachment[];
  }) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
  /** Initial attachments associated with the memory — seeds the local edit
   *  state so previously saved files stay visible in the editor. */
  initialAttachments?: FileAttachment[];
  /** Click a file chip to open a preview drawer. Owned by the parent so it
   *  can pick the surface (SidePane, modal, etc). */
  onPreviewAttachment?: (attachment: FileAttachment) => void;
  /** Called immediately when the user picks a file. Should presign + S3 PUT
   *  + confirm and resolve with the persisted FileMetadata id. The editor
   *  shows an uploading spinner until this resolves. */
  onUploadFile?: (file: File) => Promise<{ fileId: string }>;
}

/**
 * Inline memory context editor — title + description + content + attachments,
 * with cancel/save in a sticky footer. Callers should remount (via `key`) when
 * switching between contexts so the initial form values stay in sync.
 */
export function MemoryContextEditor({
  mode,
  context,
  onSave,
  onCancel,
  isSaving = false,
  initialAttachments = [],
  onPreviewAttachment,
  onUploadFile,
}: MemoryContextEditorProps) {
  // `context` seeds initial values in BOTH modes — edit mode loads an existing
  // memory, create mode can pre-fill from a draft.
  const [editingKey, setEditingKey] = useState(context ? context.key : "");
  const [editingDescription, setEditingDescription] = useState(
    context ? context.description : "",
  );
  const [editingContent, setEditingContent] = useState(
    context ? (context.value ?? "") : "",
  );

  // Stable per-instance key for the TipTap editor.
  const instanceId = useId();
  const contentKey = `${instanceId}-0`;

  // Attachments are local to this edit session — seeded from the context
  // via props so previously saved files stay visible, mutated via the
  // Attach file button, and flushed to the parent through onSave.
  const [attachments, setAttachments] =
    useState<FileAttachment[]>(initialAttachments);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next: FileAttachment[] = [];
    Array.from(files).forEach((file) => {
      const info = getFileInfo(file.type);
      if (!info) return;
      next.push({
        id: generateFileId(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        extension: info.extension,
        category: info.category,
        status: onUploadFile ? "uploading" : "uploaded",
      });
    });
    if (next.length === 0) return;
    setAttachments((prev) => [...prev, ...next]);
    if (!onUploadFile) return;

    // Kick off uploads in parallel; patch each chip with its uploadId
    // (FileMetadata id) as the upload resolves. The local id is preserved
    // so concurrent picks and removes don't collide. Failed uploads drop
    // their chip — the user retries by re-attaching.
    next.forEach((att) => {
      onUploadFile(att.file)
        .then(({ fileId }) => {
          setAttachments((prev) =>
            prev.map((a) =>
              a.id === att.id
                ? { ...a, uploadId: fileId, status: "uploaded" }
                : a,
            ),
          );
        })
        .catch((err) => {
          console.error("Memory attachment upload failed", err);
          setAttachments((prev) => prev.filter((a) => a.id !== att.id));
        });
    });
  };

  // Remove just drops the chip locally. The BE has no per-file delete — the
  // memory's attachments array (sent on save) is the source of truth, so
  // dropping a chip and saving is enough; orphan S3 objects are reaped by
  // BE-side cleanup.
  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Hidden file input + Attach button.
  const hiddenFileInput = (
    <input
      ref={fileInputRef}
      type="file"
      multiple
      accept={getAcceptString()}
      className="hidden"
      onChange={(e) => {
        handleFilesSelected(e.target.files);
        e.target.value = "";
      }}
    />
  );
  const attachButton = (
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-xl border border-gray-200/60 bg-white text-xs text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer flex-shrink-0"
      title="Attach file"
    >
      <PaperclipIcon size={14} weight="regular" />
      Attach file
    </button>
  );

  const isDefault = mode === "edit" && context?.isDefault;
  const isUserMemory = mode === "edit" && context?.accessLevel === "user";
  const isTitleReadOnly = isDefault || isUserMemory;

  const hasUploadInFlight = attachments.some((a) => a.status === "uploading");

  const isValid =
    editingKey.trim().length > 0 &&
    (isUserMemory || editingDescription.trim().length > 0) &&
    editingKey.length <= MEMORY_CONTEXT_LIMITS.key &&
    (isUserMemory ||
      editingDescription.length <= MEMORY_CONTEXT_LIMITS.description) &&
    editingContent.length <= MEMORY_CONTEXT_LIMITS.value &&
    !hasUploadInFlight;

  const handleSave = async () => {
    await onSave({
      key: editingKey,
      description: editingDescription,
      value: editingContent,
      attachments,
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Non-scrolling top section: title + description. */}
      <div className="flex-shrink-0 px-4 pt-4 flex flex-col gap-4">
        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs text-gray-800">
              Title <span className="text-gray-600">*</span>
              {isTitleReadOnly && (
                <span className="ml-2 text-xs text-gray-500">(Read-only)</span>
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
              isTitleReadOnly ? "opacity-60 cursor-not-allowed bg-gray-50" : ""
            }`}
            placeholder="e.g., Pricing Structure"
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs text-gray-800">
              When should the agent use this?
              {!isUserMemory && <span className="text-gray-600"> *</span>}
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

      {/* Attachments — pinned ABOVE Memory Content. Hidden for user memory
          (text-only). Chips wrap freely on top, Attach button on its own
          row below. Stable layout regardless of chip count. */}
      {!isUserMemory && (
        <div className="flex-shrink-0 flex flex-col gap-2 px-4 pt-4 min-w-0">
          {hiddenFileInput}
          {attachments.length > 0 && (
            <div className="flex flex-row flex-wrap items-start gap-1.5 min-w-0">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="shrink-0">
                  <FileChip
                    file={attachment}
                    isUploading={attachment.status === "uploading"}
                    onRemove={handleRemoveAttachment}
                    onClick={() => onPreviewAttachment?.(attachment)}
                  />
                </div>
              ))}
            </div>
          )}
          <div>{attachButton}</div>
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
        <div className="flex-1 min-h-0 border border-gray-200/80 rounded-xl overflow-hidden">
          <OrgContextEditor
            content={editingContent}
            onChange={setEditingContent}
            isEditing={true}
            placeholder="Add the memory content here..."
            contentKey={contentKey}
          />
        </div>
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
            hasUploadInFlight
              ? "Waiting for file uploads to finish"
              : !isValid &&
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
