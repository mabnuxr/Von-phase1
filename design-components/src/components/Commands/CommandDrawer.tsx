/**
 * CommandDrawer component
 *
 * Single-page form for creating and editing quick commands.
 * Sections (Pre-fill, Data sources, Sharing) are collapsible accordions.
 *
 * Edit mode: command name is read-only.
 * Create mode: command name is editable.
 */

import React from 'react';
import { X, PaperclipIcon, UploadSimple } from '@phosphor-icons/react';
import type { Command, CommandAttachment } from './types';
import { FilesPreviewPanel } from '../FilesPreview';
import { useFileDrop } from '../../hooks';
import { Drawer } from '../Drawer';
import { Accordion } from '../Accordion';
import { FileChip } from '../FileChip';
import { useCommandForm } from './useCommandForm';
import { useCommandDataSources } from './useCommandDataSources';

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
  const { form, setForm, setField, commandId, isEditing, sharingLabel } = useCommandForm({
    isOpen,
    editingCommand,
  });

  const {
    dataSources,
    isAnyFileUploading,
    fileInputRef,
    handleFilesSelected,
    handleRemoveDataSource,
    handleFileChipClick,
    previewFileId,
    setPreviewFileId,
    fetchedPreviewUrls,
    requestPreviewUrl,
    previewIndex,
  } = useCommandDataSources({
    isOpen,
    commandId,
    editingCommand,
    onUploadFile,
    onRequestFilePreviewUrl,
  });

  const { isDragOver, dragHandlers } = useFileDrop({
    onDrop: handleFilesSelected,
    disabled: readOnly,
  });

  const handleSave = () => {
    onSave(
      {
        name: form.name.trim(),
        prompt: form.prompt.trim(),
        prefillText: form.prefillText.trim() || undefined,
        sharingScope: form.sharingScope,
      },
      dataSources.filter((ds) => ds.uploadStatus === 'uploaded' || (!ds.uploadStatus && ds.s3Key)),
      commandId
    );
  };

  const canSave =
    form.name.trim().length > 0 && form.prompt.trim().length > 0 && !isAnyFileUploading;

  return (
    <>
      <Drawer isOpen={isOpen} onClose={onClose}>
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
                placeholder="manager-note-for-deal"
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
                Commands can generate documents, slides, and sheets based on your prompt and data
                sources.
              </p>
            )}
          </div>

          {/* Pre-fill text — collapsible */}
          <Accordion title="Pre-fill text">
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
          </Accordion>

          {/* Data sources — collapsible */}
          <Accordion
            defaultOpen
            title="Data sources"
            summary={
              dataSources.length > 0
                ? `${dataSources.length} file${dataSources.length !== 1 ? 's' : ''}`
                : undefined
            }
          >
            <div className="relative" {...dragHandlers}>
              {isDragOver && !readOnly && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-400 bg-white/90 pointer-events-none">
                  <UploadSimple size={22} className="text-gray-400" />
                  <p className="text-xs font-medium text-gray-600">Drop files to attach</p>
                </div>
              )}
              {dataSources.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {dataSources.map((ds) => (
                    <FileChip
                      key={ds.id}
                      file={ds}
                      isUploading={ds.uploadStatus === 'uploading'}
                      onClick={handleFileChipClick}
                      onRemove={readOnly ? undefined : handleRemoveDataSource}
                    />
                  ))}
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
                    Add files or drag and drop here
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
            </div>
          </Accordion>

          {/* Sharing — collapsible */}
          <Accordion title="Sharing" summary={sharingLabel}>
            <div className="flex items-center gap-1.5">
              {(['private', 'org'] as const)
                .filter((scope) => scope === 'private' || isAdmin)
                .map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => !readOnly && setForm((v) => ({ ...v, sharingScope: scope }))}
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
          </Accordion>
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
      </Drawer>

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
