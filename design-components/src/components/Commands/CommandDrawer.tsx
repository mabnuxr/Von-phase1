/**
 * CommandDrawer component
 *
 * Single-page form for creating and editing quick commands.
 * Sections (Pre-fill, Data sources, Sharing) are collapsible accordions.
 *
 * Edit mode: command name is read-only.
 * Create mode: command name is editable.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CaretRight, PaperclipIcon, SpinnerGap } from '@phosphor-icons/react';
import type { Command, CommandAttachment } from './types';
import { generateCommandId } from './types';
import { FilesPreviewPanel } from '../FilesPreview';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface CommandDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Called with the collected form data on submit.
   * `dataSources` — all attachments (all already uploaded eagerly).
   * `commandId`   — pre-generated ObjectId used for file presigning; pass as
   *                 `id` when creating a new command so a single API call suffices.
   */
  onSave: (
    data: Pick<Command, 'name' | 'prompt' | 'prefillText' | 'sharingScope'>,
    dataSources: CommandAttachment[],
    commandId: string
  ) => void;
  /** Pre-populate the form when editing an existing command */
  editingCommand?: Command | null;
  /** Shows a spinner / disables the save button while the mutation is in-flight */
  isSaving?: boolean;
  /** When true, all fields are read-only and the save button is hidden */
  readOnly?: boolean;
  /** When false (default), the "Org-wide" sharing option is hidden — only admins may create org-wide commands */
  isAdmin?: boolean;
  /**
   * Called immediately when the user picks a file — upload should happen here.
   * Returns the backend fileId and s3Key once the upload completes.
   */
  onUploadFile?: (commandId: string, file: File) => Promise<{ fileId: string; s3Key: string }>;
  /**
   * Called when the user clicks a file chip for an already-uploaded file that
   * has no local blob URL. Should return a presigned download URL for the file.
   */
  onRequestFilePreviewUrl?: (s3Key: string) => Promise<string>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface FormValues {
  name: string;
  prompt: string;
  prefillText: string;
  sharingScope: 'private' | 'org';
}

const emptyForm: FormValues = {
  name: '',
  prompt: '',
  prefillText: '',
  sharingScope: 'private',
};

function commandToForm(cmd: Command): FormValues {
  return {
    name: cmd.name,
    prompt: cmd.prompt,
    prefillText: cmd.prefillText ?? '',
    sharingScope: cmd.sharingScope ?? 'private',
  };
}

function getFileIcon(attachment: CommandAttachment): string {
  if (attachment.category === 'image') return '🖼';
  if (attachment.category === 'spreadsheet') return '📊';
  if (attachment.category === 'presentation') return '📑';
  return '📄';
}

// ---------------------------------------------------------------------------
// AccordionSection
// ---------------------------------------------------------------------------

interface AccordionSectionProps {
  title: string;
  summary?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  summary,
  children,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full px-3 py-2.5 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-800/80">{title}</span>
          {summary && <span className="text-xs text-gray-400">{summary}</span>}
        </div>
        <CaretRight
          size={12}
          className={`text-gray-400 transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---------------------------------------------------------------------------
// FileChip
// ---------------------------------------------------------------------------

interface FileChipProps {
  attachment: CommandAttachment;
  onRemove: (id: string) => void;
  onClick: (id: string) => void;
}

const FileChip: React.FC<FileChipProps> = ({ attachment, onRemove, onClick }) => {
  const isUploading = attachment.uploadStatus === 'uploading';

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs max-w-[160px] transition-colors ${
        isUploading
          ? 'bg-gray-100 text-gray-400 cursor-default opacity-60'
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer'
      }`}
      onClick={() => !isUploading && onClick(attachment.id)}
      title={isUploading ? 'Uploading…' : attachment.name}
    >
      {isUploading ? (
        <SpinnerGap size={12} className="animate-spin shrink-0" />
      ) : (
        <span>{getFileIcon(attachment)}</span>
      )}
      <span className="truncate">{attachment.name}</span>
      {!isUploading && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(attachment.id);
          }}
          className="ml-0.5 text-gray-400 hover:text-gray-700 shrink-0"
          aria-label={`Remove ${attachment.name}`}
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

export const CommandDrawer: React.FC<CommandDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCommand,
  isSaving = false,
  readOnly = false,
  isAdmin = false,
  onUploadFile,
  onRequestFilePreviewUrl,
}) => {
  const isEditing = Boolean(editingCommand);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [dataSources, setDataSources] = useState<CommandAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Pre-generated (or editing) command ID used for presigning
  const [commandId, setCommandId] = useState(() => generateCommandId());
  // Presigned download URLs fetched on-demand for preview; keyed by attachment id.
  // null means the fetch was attempted and failed (show "Preview not available").
  const [fetchedPreviewUrls, setFetchedPreviewUrls] = useState<Record<string, string | null>>({});
  // Preview panel state
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);

  // Reset form whenever the drawer opens
  useEffect(() => {
    if (isOpen) {
      setFetchedPreviewUrls({});
      setPreviewFileId(null);
      setForm(editingCommand ? commandToForm(editingCommand) : emptyForm);
      setDataSources(editingCommand?.dataSources ?? []);
      setCommandId(editingCommand ? editingCommand.id : generateCommandId());
    }
  }, [isOpen, editingCommand]);

  const setField =
    <K extends keyof FormValues>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((v) => ({ ...v, [key]: e.target.value }));

  const handleRemoveDataSource = useCallback((id: string) => {
    setPreviewFileId((current) => (current === id ? null : current));
    setDataSources((prev) => prev.filter((ds) => ds.id !== id));
  }, []);

  // Fetches a presigned URL for a single file and stores the result.
  // Sets null on failure so the panel can distinguish "not yet fetched" from "failed".
  const requestPreviewUrl = useCallback(
    async (fileId: string) => {
      if (fileId in fetchedPreviewUrls) return;
      if (!onRequestFilePreviewUrl) return;
      const s3Key = dataSources.find((ds) => ds.id === fileId)?.s3Key;
      if (!s3Key) return;
      try {
        const url = await onRequestFilePreviewUrl(s3Key);
        setFetchedPreviewUrls((prev) => ({ ...prev, [fileId]: url }));
      } catch {
        setFetchedPreviewUrls((prev) => ({ ...prev, [fileId]: null }));
      }
    },
    [dataSources, fetchedPreviewUrls, onRequestFilePreviewUrl]
  );

  const handleFileChipClick = useCallback((fileId: string) => {
    setPreviewFileId(fileId);
    // URL fetch is delegated to the panel via onRequestPreviewUrl so that
    // tab switches inside the panel also trigger fetches, not just chip clicks.
  }, []);

  /**
   * Called when the user picks files from the file input.
   * Creates attachment placeholders immediately, then kicks off eager uploads.
   */
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const newAttachments: CommandAttachment[] = files.map((file) => {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        let category: CommandAttachment['category'] = 'document';
        if (file.type.startsWith('image/')) category = 'image';
        else if (
          file.type.includes('spreadsheet') ||
          file.type.includes('excel') ||
          ['xlsx', 'xls', 'csv'].includes(ext)
        )
          category = 'spreadsheet';
        else if (
          file.type.includes('presentation') ||
          file.type.includes('powerpoint') ||
          ['pptx', 'ppt'].includes(ext)
        )
          category = 'presentation';
        else if (['txt', 'md', 'json'].includes(ext)) category = 'text';

        return {
          id: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          extension: ext,
          category,
          uploadStatus: 'uploading' as const,
        };
      });

      // Show all files immediately as loading chips
      setDataSources((prev) => [...prev, ...newAttachments]);

      if (onUploadFile) {
        await Promise.all(
          newAttachments.map(async (attachment, idx) => {
            const file = files[idx];
            const tempId = attachment.id;
            try {
              const { fileId, s3Key } = await onUploadFile(commandId, file);
              // Replace temp id with the real backend fileId; preview URL fetched on-demand
              setDataSources((prev) =>
                prev.map((ds) =>
                  ds.id === tempId
                    ? { ...ds, id: fileId, s3Key, uploadStatus: 'uploaded' as const }
                    : ds
                )
              );
            } catch {
              // Remove silently — no error state left in the UI
              setDataSources((prev) => prev.filter((ds) => ds.id !== tempId));
              setPreviewFileId((current) => (current === tempId ? null : current));
            }
          })
        );
      }
    },
    [commandId, onUploadFile]
  );

  const handleSave = () => {
    onSave(
      {
        name: form.name.trim(),
        prompt: form.prompt.trim(),
        prefillText: form.prefillText.trim() || undefined,
        sharingScope: form.sharingScope,
      },
      // Only include successfully uploaded files
      dataSources.filter((ds) => ds.uploadStatus === 'uploaded' || (!ds.uploadStatus && ds.s3Key)),
      commandId
    );
  };

  const isAnyFileUploading = dataSources.some((ds) => ds.uploadStatus === 'uploading');
  const canSave =
    form.name.trim().length > 0 && form.prompt.trim().length > 0 && !isAnyFileUploading;
  const sharingLabel = form.sharingScope === 'org' ? 'Org-wide' : 'Private';

  const drawerPortal = ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/15 z-[55]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Panel */}
          <motion.div
            className="fixed top-0 right-0 h-full p-2 z-[60]"
            style={{ width: 480, maxWidth: '90vw' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="h-full flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-medium text-gray-900">
                  {readOnly ? 'View Command' : isEditing ? 'Edit Command' : 'New Command'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {/* Command name */}
                <div>
                  <label className="block text-xs font-medium text-gray-800/80 mb-1.5">
                    Command name {!readOnly && <span className="text-red-400">*</span>}
                  </label>
                  {isEditing || readOnly ? (
                    <div className="w-full px-3 py-2 text-sm border border-gray-100 rounded-lg bg-gray-50 text-gray-600 select-none">
                      {form.name}
                    </div>
                  ) : (
                    <input
                      autoFocus
                      type="text"
                      value={form.name}
                      onChange={setField('name')}
                      placeholder="Create a manager note for a deal"
                      className="w-full px-3 py-2 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-all placeholder:text-gray-400"
                    />
                  )}
                </div>

                {/* Prompt */}
                <div>
                  <label className="block text-xs font-medium text-gray-800/80 mb-1.5">
                    Prompt / Instructions {!readOnly && <span className="text-red-400">*</span>}
                  </label>
                  <textarea
                    value={form.prompt}
                    onChange={setField('prompt')}
                    rows={6}
                    readOnly={readOnly}
                    placeholder="Summarize the latest call notes and highlight key action items for the manager"
                    className={`w-full px-3 py-2 text-sm border border-gray-100 rounded-lg resize-none transition-all placeholder:text-gray-400 ${
                      readOnly
                        ? 'bg-gray-50 text-gray-600 cursor-default focus:outline-none'
                        : 'focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300'
                    }`}
                  />
                  {!readOnly && (
                    <p className="mt-1.5 text-xs text-gray-500">
                      Commands can generate documents, slides, and sheets based on your prompt and
                      data sources.
                    </p>
                  )}
                </div>

                {/* Pre-fill text — collapsible */}
                <AccordionSection title="Pre-fill text" defaultOpen>
                  <textarea
                    value={form.prefillText}
                    onChange={setField('prefillText')}
                    rows={3}
                    readOnly={readOnly}
                    placeholder={readOnly ? '—' : 'Where owner is [owner_name]'}
                    className={`w-full px-3 py-2 text-sm border border-gray-100 rounded-lg resize-none transition-all placeholder:text-gray-400 ${
                      readOnly
                        ? 'bg-gray-50 text-gray-600 cursor-default focus:outline-none'
                        : 'focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300'
                    }`}
                  />
                  {!readOnly && (
                    <p className="mt-1.5 text-xs text-gray-500">
                      Pre-populate the chat input when this command is used.
                    </p>
                  )}
                </AccordionSection>

                {/* Data sources — collapsible */}
                <AccordionSection
                  defaultOpen
                  title="Data sources"
                  summary={
                    dataSources.length > 0
                      ? `${dataSources.length} file${dataSources.length !== 1 ? 's' : ''}`
                      : undefined
                  }
                >
                  {dataSources.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {dataSources.map((ds) =>
                        readOnly ? (
                          <div
                            key={ds.id}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-700 max-w-[160px] cursor-pointer transition-colors"
                            onClick={() => handleFileChipClick(ds.id)}
                            title={ds.name}
                          >
                            <span>{getFileIcon(ds)}</span>
                            <span className="truncate">{ds.name}</span>
                          </div>
                        ) : (
                          <FileChip
                            key={ds.id}
                            attachment={ds}
                            onRemove={handleRemoveDataSource}
                            onClick={handleFileChipClick}
                          />
                        )
                      )}
                    </div>
                  ) : (
                    readOnly && <p className="text-xs text-gray-400 mb-2">No files attached.</p>
                  )}
                  {!readOnly && (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 w-full text-xs text-gray-600 border border-dashed border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <PaperclipIcon size={12} />
                        Add files
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                          handleFilesSelected(files);
                        }}
                      />
                    </>
                  )}
                </AccordionSection>

                {/* Sharing — collapsible */}
                <AccordionSection title="Sharing" summary={sharingLabel} defaultOpen>
                  <div className="flex items-center gap-1.5">
                    {(['private', 'org'] as const)
                      .filter((scope) => scope === 'private' || isAdmin)
                      .map((scope) => (
                        <button
                          key={scope}
                          type="button"
                          onClick={() =>
                            !readOnly && setForm((v) => ({ ...v, sharingScope: scope }))
                          }
                          className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
                            form.sharingScope === scope
                              ? 'border-gray-300 bg-gray-50 text-gray-900'
                              : 'border-gray-100 text-gray-500'
                          } ${readOnly ? 'cursor-default' : 'cursor-pointer hover:border-gray-200'}`}
                        >
                          {scope === 'private' ? 'Private' : 'Org-wide'}
                        </button>
                      ))}
                  </div>
                </AccordionSection>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-sm text-gray-800 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {readOnly ? 'Close' : 'Cancel'}
                </button>
                {!readOnly && (
                  <button
                    onClick={handleSave}
                    disabled={!canSave || isSaving}
                    className={`px-4 py-1.5 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                      canSave && !isSaving
                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isSaving
                      ? 'Saving…'
                      : isAnyFileUploading
                        ? 'Uploading…'
                        : isEditing
                          ? 'Save Changes'
                          : 'Create'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );

  const previewIndex = previewFileId ? dataSources.findIndex((ds) => ds.id === previewFileId) : -1;

  return (
    <>
      {drawerPortal}
      <FilesPreviewPanel
        contextName={form.name || 'Command'}
        files={dataSources.map((ds) => ({
          file: ds,
          // Prefer fetched presigned URL; fall back to local blob URL (pending files).
          // Explicit `in` check so a null sentinel (failed fetch) is preserved.
          previewUrl: ds.id in fetchedPreviewUrls ? fetchedPreviewUrls[ds.id] : ds.previewUrl,
        }))}
        initialIndex={previewIndex >= 0 ? previewIndex : 0}
        isOpen={!!previewFileId && dataSources.length > 0}
        onClose={() => setPreviewFileId(null)}
        onRequestPreviewUrl={requestPreviewUrl}
      />
    </>
  );
};

export default CommandDrawer;
