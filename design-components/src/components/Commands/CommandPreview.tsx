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

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Command } from './types';
import { CommandChip } from './CommandChip';
import { TiptapViewer } from '../TiptapEditor';
import { useVisibilityToggle } from '../../hooks';
import { FilesPreviewPanel } from '../FilesPreview';
import { FileIconStack } from '../FileChip';
import { MentionPreview } from '../Chat/FileAttachment/MentionPreview';
import type { MentionItem } from '../Mentions/types';
import { MentionItemType } from '../Mentions/constants';

export interface CommandPreviewProps {
  command: Command;
  /**
   * Called when the file preview panel needs a download URL for a data source.
   * If omitted, the panel uses the previewUrl already stored on the attachment.
   */
  onRequestFilePreviewUrl?: (s3Key: string) => Promise<string>;
  /** When false, the bottom divider is hidden. Defaults to true. */
  hasContentBelow?: boolean;
  /** When true, the command preview is disabled and the command is not rendered. */
  disableFileAttachments?: boolean;
  /**
   * Called when a tagged dashboard pill is clicked. The MentionItem shape
   * matches what `UserMessage` already passes to its inline mention chips,
   * so hosts can route both through the same handler (typically navigating
   * to the dashboard).
   */
  onMentionClick?: (mention: MentionItem) => void;
}

export const CommandPreview: React.FC<CommandPreviewProps> = ({
  command,
  onRequestFilePreviewUrl,
  hasContentBelow = true,
  disableFileAttachments = false,
  onMentionClick,
}) => {
  const { isVisible: isExpanded, toggleVisibility: onToggle } = useVisibilityToggle();
  const filesPanel = useVisibilityToggle();

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
        fetchedIdsRef.current.delete(fileId);
        setFetchedUrls((prev) => ({ ...prev, [fileId]: null }));
        return;
      }
      try {
        const url = await onRequestFilePreviewUrl(s3Key);
        setFetchedUrls((prev) => ({ ...prev, [fileId]: url }));
      } catch {
        fetchedIdsRef.current.delete(fileId);
        setFetchedUrls((prev) => ({ ...prev, [fileId]: null }));
      }
    },
    [command.dataSources, onRequestFilePreviewUrl]
  );

  const fileEntries = useMemo(
    () =>
      (command.dataSources ?? []).map((ds) => ({
        file: ds,
        previewUrl: fetchedUrls[ds.id] ?? ds.previewUrl,
      })),
    [command.dataSources, fetchedUrls]
  );

  const attachmentCount = fileEntries.length;
  const dashboardRefs = (command.references ?? []).filter((r) => r.type === 'dashboard');

  return (
    <div className="w-96">
      <div className="flex items-center justify-between gap-2">
        <CommandChip command={command} onClick={onToggle} isExpanded={isExpanded} />
        {!isExpanded && attachmentCount > 0 && (
          <button
            onClick={disableFileAttachments ? undefined : filesPanel.show}
            className={`transition-opacity shrink-0 ${disableFileAttachments ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-75'}`}
            disabled={disableFileAttachments}
          >
            <FileIconStack
              files={command.dataSources ?? []}
              label={`referring ${attachmentCount} file${attachmentCount !== 1 ? 's' : ''}`}
            />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            {dashboardRefs.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {dashboardRefs.map((r) => {
                  const mention: MentionItem = {
                    id: r.context.dashboardId,
                    name: r.context.dashboardName,
                    type: MentionItemType.Dashboard,
                    version: r.context.dashboardVersion,
                  };
                  return (
                    <div
                      key={r.context.dashboardId}
                      onClick={
                        onMentionClick
                          ? (e) => {
                              // Don't toggle the surrounding CommandPreview's expand state.
                              e.stopPropagation();
                              onMentionClick(mention);
                            }
                          : undefined
                      }
                      className={onMentionClick ? 'cursor-pointer' : undefined}
                    >
                      <MentionPreview mention={mention} removable={false} />
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-1.5 text-sm text-gray-700">
              <TiptapViewer content={command.prompt} />
            </div>

            {attachmentCount > 0 && (
              <button
                onClick={disableFileAttachments ? undefined : filesPanel.show}
                className={`mt-2 transition-opacity ${disableFileAttachments ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-75'}`}
                disabled={disableFileAttachments}
              >
                <FileIconStack
                  files={command.dataSources ?? []}
                  label={`referring ${attachmentCount} file${attachmentCount !== 1 ? 's' : ''}`}
                />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {hasContentBelow && <div className="mt-1.5 border-t border-gray-200/60" />}

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
