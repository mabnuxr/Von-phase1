/**
 * CommandPreview component
 * Renders the command chip and an expandable section showing the command prompt
 * and the files it references. Does NOT own chat-uploaded files or user message
 * text — those are rendered by the parent so they remain consistent with the
 * no-command path.
 *
 * Layout (top to bottom):
 *   1. CommandChip — always visible, click to toggle expanded
 *   2. [Expanded] Command prompt text
 *   3. [Expanded] "referring N files" label with stacked icons
 *   4. [Expanded] Separator — only when hasContentBelow is true
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Command } from './types';
import { CommandChip } from './CommandChip';
import { TiptapViewer } from '../TiptapEditor';
import { useVisibilityToggle } from '../../hooks';
import { FilesPreviewPanel } from '../FilesPreview';

export interface CommandPreviewProps {
  command: Command;
  /**
   * Called when the file preview panel needs a download URL for a data source.
   * If omitted, the panel uses the previewUrl already stored on the attachment.
   */
  onRequestFilePreviewUrl?: (s3Key: string) => Promise<string>;
}

export const CommandPreview: React.FC<CommandPreviewProps> = ({
  command,
  onRequestFilePreviewUrl,
}) => {
  const { isVisible: isExpanded, toggleVisibility: onToggle } = useVisibilityToggle();
  const filesPanel = useVisibilityToggle();

  // Presigned URLs fetched on demand; null = fetch failed.
  const [fetchedUrls, setFetchedUrls] = useState<Record<string, string | null>>({});

  const handleRequestPreviewUrl = useCallback(
    async (fileId: string) => {
      if (fileId in fetchedUrls) return;
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
    [command.dataSources, fetchedUrls, onRequestFilePreviewUrl]
  );

  const fileEntries = useMemo(
    () =>
      (command.dataSources ?? []).map((ds) => ({
        file: ds,
        previewUrl: ds.id in fetchedUrls ? fetchedUrls[ds.id] : ds.previewUrl,
      })),
    [command.dataSources, fetchedUrls]
  );

  const attachmentCount = fileEntries.length;

  return (
    <div>
      <CommandChip command={command} onClick={onToggle} isExpanded={isExpanded} />

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 text-sm text-gray-700 line-clamp-4">
              <TiptapViewer content={command.prompt} />
            </div>

            {attachmentCount > 0 && (
              <button
                onClick={filesPanel.show}
                className="mt-2 text-xs text-gray-500 hover:text-gray-800 cursor-pointer transition-colors"
              >
                Referring {attachmentCount} file{attachmentCount !== 1 ? 's' : ''}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-1.5 border-t border-gray-200/60" />

      <FilesPreviewPanel
        contextName={command.name}
        files={fileEntries}
        isOpen={filesPanel.isVisible}
        onClose={filesPanel.hide}
        onRequestPreviewUrl={handleRequestPreviewUrl}
      />
    </div>
  );
};
