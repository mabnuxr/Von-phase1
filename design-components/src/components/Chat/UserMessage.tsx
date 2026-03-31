import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { CopyIcon, CheckIcon } from '@phosphor-icons/react';
import { Tooltip } from '../Tooltip';
import { TiptapViewer } from '../TiptapEditor';
import { MessageFilePreview } from './FileAttachment/MessageFilePreview';
import { MessageMentionPreview } from './FileAttachment/MessageMentionPreview';
import { CommandPreview } from '../Commands/CommandPreview';
import { formatMessageTimestamp, formatFullTimestamp, getUserInitials } from './utils/messageUtils';
import type { MessageFileAttachment } from './types';
import type { MentionItem } from '../Mentions/types';
import type { Command } from '../Commands/types';

export interface UserMessageProps {
  content: string;
  userName?: string;
  userEmail?: string;
  timestamp?: Date;
  attachments?: MessageFileAttachment[];
  mentions?: MentionItem[];
  command?: Command;
  onFileClick?: (attachment: MessageFileAttachment) => void;
  onMentionClick?: (mention: MentionItem) => void;
  onRequestFilePreviewUrl?: (s3Key: string) => Promise<string>;
  compact?: boolean;
}

export const UserMessage: React.FC<UserMessageProps> = ({
  content,
  userName,
  userEmail,
  timestamp,
  attachments,
  mentions,
  command,
  onFileClick,
  onMentionClick,
  onRequestFilePreviewUrl,
  compact = false,
}) => {
  const userInitials = getUserInitials(userName, userEmail);

  const userMessageRef = useRef<HTMLDivElement>(null);
  const [isSingleLine, setIsSingleLine] = useState(true);
  const [copiedUser, setCopiedUser] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // Measure user message height to determine alignment
  useLayoutEffect(() => {
    if (userMessageRef.current) {
      // Single line threshold ~36px (accounts for line-height + padding)
      const height = userMessageRef.current.offsetHeight;
      setIsSingleLine(height <= 36);
    }
  }, [content]);

  const handleCopyUser = async () => {
    try {
      await navigator.clipboard.writeText(content);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      setCopiedUser(true);
      copyTimeoutRef.current = setTimeout(() => setCopiedUser(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const isTimestampOlderThan24h =
    !!timestamp && (Date.now() - timestamp.getTime()) / (1000 * 60 * 60) >= 24;

  return (
    <>
      {/* Horizontal layout: Avatar + Content (reversed for user) */}
      <div
        className={
          compact
            ? 'flex justify-end'
            : `flex gap-3 flex-row-reverse ${isSingleLine ? 'items-center' : 'items-start'}`
        }
      >
        {/* Avatar — hidden in compact mode */}
        {!compact && (
          <div className={`flex items-start gap-2 shrink-0 @max-[550px]/chat:hidden`}>
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
              {userInitials}
            </div>
          </div>
        )}

        {/* Content Column */}
        <div className={compact ? 'w-fit ml-auto min-w-0 -mt-0.5' : 'flex-1 min-w-0 -mt-0.5'}>
          <div
            ref={userMessageRef}
            className="bg-gray-50 border border-gray-100 rounded-2xl px-3 py-2 overflow-hidden wrap-break-word"
          >
            {command && (
              <CommandPreview
                command={command}
                onRequestFilePreviewUrl={onRequestFilePreviewUrl}
                hasContentBelow={!!(content || (attachments && attachments.length > 0))}
              />
            )}
            {attachments && attachments.length > 0 && (
              <div className={command ? 'mt-2' : undefined}>
                <MessageFilePreview attachments={attachments} onFileClick={onFileClick} />
              </div>
            )}
            {mentions && mentions.length > 0 && (
              <div
                className={command || (attachments && attachments.length > 0) ? 'mt-2' : undefined}
              >
                <MessageMentionPreview mentions={mentions} onMentionClick={onMentionClick} />
              </div>
            )}
            {/* Text content - render markdown using TiptapViewer */}
            {content && (
              <TiptapViewer
                content={content}
                className="markdown-content prose-sm max-w-none text-left"
              />
            )}
          </div>

          {/* User message hover actions: timestamp + copy */}
          <div className="flex items-center justify-end gap-1.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            {timestamp && (
              <Tooltip
                content={formatFullTimestamp(timestamp)}
                enabled={isTimestampOlderThan24h}
                placement="bottom"
              >
                <span className="text-xs text-gray-400 select-none">
                  {formatMessageTimestamp(timestamp)}
                </span>
              </Tooltip>
            )}
            {content && (
              <button
                onClick={handleCopyUser}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
                title={copiedUser ? 'Copied!' : 'Copy message'}
                aria-label={copiedUser ? 'Copied!' : 'Copy message'}
              >
                {copiedUser ? (
                  <CheckIcon size={14} className="text-green-500" weight="bold" />
                ) : (
                  <CopyIcon size={14} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
