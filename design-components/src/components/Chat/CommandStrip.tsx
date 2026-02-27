/**
 * CommandStrip
 *
 * Rendered above the chat input when a command is selected.
 * Layout: [CommandChip pill]  ···  [FileIconStack  N files  ×]
 *
 * Interactions:
 *  - Click the chip       → open CommandDrawer in read-only mode
 *  - Click the file stack → open FilesPreviewPanel
 *  - Click ×              → clear the selected command
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { X } from '@phosphor-icons/react';
import { CommandChip } from '../Commands/CommandChip';
import { CommandDrawer } from '../Commands/CommandDrawer';
import type { Command } from '../Commands/types';
import { FileIconStack } from '../FileChip';
import { FilesPreviewPanel } from '../FilesPreview';

export interface CommandStripProps {
  command: Command;
  onRemove: () => void;
  onRequestFilePreviewUrl?: (s3Key: string) => Promise<string>;
}

export const CommandStrip: React.FC<CommandStripProps> = ({
  command,
  onRemove,
  onRequestFilePreviewUrl,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFilesPanelOpen, setIsFilesPanelOpen] = useState(false);

  // Presigned URLs fetched on demand; null = fetch failed.
  const [fetchedUrls, setFetchedUrls] = useState<Record<string, string | null>>({});
  // Tracks fileIds that have been requested (including in-flight). Using a ref
  // instead of state means the check is always current, preventing concurrent
  // duplicate fetches and keeping the callback stable.
  const fetchedIdsRef = useRef<Set<string>>(new Set());

  const handleRequestPreviewUrl = useCallback(
    async (fileId: string) => {
      if (fetchedIdsRef.current.has(fileId)) return;
      fetchedIdsRef.current.add(fileId);
      const s3Key = command.dataSources?.find((ds) => ds.id === fileId)?.s3Key;
      if (!s3Key || !onRequestFilePreviewUrl) {
        setFetchedUrls((prev) => ({ ...prev, [fileId]: null }));
        return;
      }
      try {
        const url = await onRequestFilePreviewUrl(s3Key);
        setFetchedUrls((prev) => ({ ...prev, [fileId]: url }));
      } catch {
        setFetchedUrls((prev) => ({ ...prev, [fileId]: null }));
      }
    },
    [command.dataSources, onRequestFilePreviewUrl]
  );

  const fileEntries = useMemo(
    () =>
      (command.dataSources ?? []).map((ds) => ({
        file: ds,
        previewUrl: ds.id in fetchedUrls ? fetchedUrls[ds.id] : ds.previewUrl,
      })),
    [command.dataSources, fetchedUrls]
  );

  const fileCount = fileEntries.length;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between w-full">
        <CommandChip command={command} showCaret={false} onClick={() => setIsDrawerOpen(true)} />

        <div className="flex items-center gap-2 shrink-0">
          {fileCount > 0 && (
            <button
              onClick={() => setIsFilesPanelOpen(true)}
              className="cursor-pointer hover:opacity-75 transition-opacity"
              aria-label="Preview files"
            >
              <FileIconStack
                files={command.dataSources ?? []}
                label={`${fileCount} ${fileCount === 1 ? 'file' : 'files'}`}
              />
            </button>
          )}

          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-150 cursor-pointer shrink-0"
            aria-label="Remove command"
          >
            <X size={13} weight="bold" />
          </button>
        </div>
      </div>

      {/* Read-only view of the command */}
      <CommandDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={() => {}}
        editingCommand={command}
        readOnly
        onRequestFilePreviewUrl={onRequestFilePreviewUrl}
      />

      {/* Files preview panel */}
      <FilesPreviewPanel
        contextName={command.name}
        files={fileEntries}
        isOpen={isFilesPanelOpen}
        onClose={() => setIsFilesPanelOpen(false)}
        onRequestPreviewUrl={handleRequestPreviewUrl}
      />
    </div>
  );
};
