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
}: BulkImportPaneProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [contentKey, setContentKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const title = (
    <div className="flex flex-col gap-0.5 min-w-0">
      <div className="flex items-center gap-2">
        <DownloadSimpleIcon
          size={16}
          weight="regular"
          className="text-gray-700 flex-shrink-0"
        />
        <span className="text-sm font-medium text-gray-900">Bulk Import</span>
      </div>
      <span className="text-xs text-gray-600">
        Von will review this against {existingSectionCount} existing section
        {existingSectionCount === 1 ? "" : "s"} and propose updates + new
        sections
      </span>
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

      <div className="flex flex-col h-full min-h-0 gap-2 pt-2">
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
