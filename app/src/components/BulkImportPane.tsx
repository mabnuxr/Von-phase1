import { useRef, useState } from "react";
import {
  SidePane,
  FilePreview,
  generateFileId,
  getFileInfo,
  getAcceptString,
  formatFileSize,
  type FileAttachment,
} from "@vonlabs/design-components";
import {
  PaperclipIcon,
  SparkleIcon,
  DownloadSimpleIcon,
  CopyIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import { OrgContextEditor } from "./OrgContextEditor";

export interface BulkImportPaneProps {
  isOpen: boolean;
  onClose: () => void;
  /** Number of existing memory sections the import will be reviewed against —
   *  shown in the header subtitle. */
  existingSectionCount: number;
  /** Fires when the user submits the import. UI-only for now; backend
   *  integration replaces this with a real ingestion call. */
  onSubmit?: (input: string, files: FileAttachment[]) => void;
  /** When provided, renders a "Copy this prompt into another AI" step above
   *  the editor. The text is what the user pastes into an external LLM to
   *  get an exportable memory dump they can bring back here. */
  exportPrompt?: string;
  /** Optional title override — defaults to "Bulk Import". User memory uses
   *  "Import memory" since it's not really "bulk" when there's only one. */
  titleText?: string;
  /** Optional subtitle override — defaults to the org "Von will review this
   *  against N sections..." copy. */
  subtitleText?: string;
}

/**
 * Side drawer for bulk-importing memory. The user pastes a large chunk of
 * text (doc export, playbook, onboarding notes) and Von reviews it against
 * existing sections to propose updates + new sections.
 *
 * Pure UI shell for now — the submit handler hands input + attachments to
 * the parent. Backend wiring replaces it with a real ingestion call.
 */
export function BulkImportPane({
  isOpen,
  onClose,
  existingSectionCount,
  onSubmit,
  exportPrompt,
  titleText = "Bulk Import",
  subtitleText,
}: BulkImportPaneProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [contentKey, setContentKey] = useState(0);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Copy the export prompt to the clipboard and flash a "Copied" affordance
  // for ~1.5s so the user knows the click registered without an extra toast.
  const handleCopyPrompt = async () => {
    if (!exportPrompt) return;
    try {
      await navigator.clipboard.writeText(exportPrompt);
      setCopiedPrompt(true);
      window.setTimeout(() => setCopiedPrompt(false), 1500);
    } catch {
      // Clipboard API can fail in some browsers (e.g. insecure context).
      // Silent fail is fine — the prompt is still visible for manual copy.
    }
  };

  const resetForm = () => {
    setInput("");
    setAttachments([]);
    setContentKey((v) => v + 1);
  };

  const handleSubmit = () => {
    onSubmit?.(input, attachments);
    resetForm();
    onClose();
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

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
        status: "uploaded",
      });
    });
    if (next.length > 0) {
      setAttachments((prev) => [...prev, ...next]);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Title stacks above subtitle so the "Bulk Import" label reads as the
  // primary affordance and the explanatory text gets its own line of
  // breathing room rather than competing on the same row.
  const resolvedSubtitle =
    subtitleText ??
    `Von will review this against ${existingSectionCount} existing section${
      existingSectionCount === 1 ? "" : "s"
    } and propose updates + new sections`;

  const title = (
    <div className="flex flex-col gap-0.5 min-w-0">
      <div className="flex items-center gap-2">
        <DownloadSimpleIcon
          size={16}
          weight="regular"
          className="text-gray-700 flex-shrink-0"
        />
        <span className="text-sm font-medium text-gray-900">{titleText}</span>
      </div>
      <span className="text-xs text-gray-600">{resolvedSubtitle}</span>
    </div>
  );

  const totalSize = attachments.reduce((sum, a) => sum + a.size, 0);
  const hasContent = input.trim().length > 0 || attachments.length > 0;

  const footer = (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-xl border border-gray-200/80 text-sm text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <PaperclipIcon size={14} weight="regular" />
        Attach file
      </button>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCancel}
          className="px-2.5 py-1.5 text-sm text-gray-800 border border-gray-200/80 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!hasContent}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SparkleIcon size={12} weight="fill" />
          Update
        </button>
      </div>
    </div>
  );

  return (
    <SidePane
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      width="560px"
      minWidth={440}
      maxWidth="720px"
      storageKey="bulk-import-pane-width"
      footer={footer}
      resizable
    >
      {/* Hidden file input — click routed from the Attach file button. */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={getAcceptString()}
        className="hidden"
        onChange={(e) => {
          handleFilesSelected(e.target.files);
          // Reset so picking the same file twice still fires onChange.
          e.target.value = "";
        }}
      />

      <div className="flex flex-col h-full min-h-0 gap-3 pt-2">
        {/* Step 1: copy the export prompt into another AI. Only rendered
            when a prompt is provided — this is primarily a user-memory
            affordance (import a dump from Claude/ChatGPT/etc). */}
        {exportPrompt && (
          <div className="flex-shrink-0 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full border border-gray-200 text-[10px] font-semibold text-gray-700 bg-white">
                1
              </span>
              <span className="text-sm text-gray-900">
                Copy this prompt into a chat with your other AI provider
              </span>
            </div>
            <div className="relative rounded-xl border border-gray-200/80 bg-gray-50/70 p-3 pr-20">
              <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                {exportPrompt}
              </p>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="absolute top-2 right-2 inline-flex items-center gap-1 h-7 px-2 rounded-lg border border-gray-200/80 bg-white text-xs text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {copiedPrompt ? (
                  <>
                    <CheckIcon size={12} weight="bold" />
                    Copied
                  </>
                ) : (
                  <>
                    <CopyIcon size={12} weight="regular" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2 label only renders when step 1 is present — otherwise
            the editor stands alone without numeric framing. */}
        {exportPrompt && (
          <div className="flex-shrink-0 flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full border border-gray-200 text-[10px] font-semibold text-gray-700 bg-white">
              2
            </span>
            <span className="text-sm text-gray-900">
              Paste results below to add to your memory
            </span>
          </div>
        )}

        {/* Rich text editor — same Tiptap surface as the Memory Content
            editor. Starts at ~65% of available height so the editor feels
            intentional rather than gobbling the whole drawer, and is
            user-resizable (vertical drag) up to the full pane height. */}
        <div className="flex-shrink-0 min-h-[180px] h-[65%] max-h-full resize-y overflow-auto border border-gray-200/80 rounded-xl">
          <OrgContextEditor
            content={input}
            onChange={setInput}
            isEditing={true}
            placeholder="Paste memory export from another AI, an onboarding doc, a playbook, or describe what to learn..."
            contentKey={`bulk-import-${contentKey}`}
          />
        </div>

        {/* Attachment chips — matches the command-attachment preview strip
            used elsewhere. Only shown when the user has added files. */}
        {attachments.length > 0 && (
          <div className="flex-shrink-0 flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-xs text-gray-600">
                {attachments.length} file
                {attachments.length === 1 ? "" : "s"} attached
              </span>
              <span className="text-xs text-gray-500">
                {formatFileSize(totalSize)}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {attachments.map((attachment) => (
                <FilePreview
                  key={attachment.id}
                  attachment={attachment}
                  onRemove={handleRemoveAttachment}
                  removable
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </SidePane>
  );
}

export default BulkImportPane;
