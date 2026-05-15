import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  CopyIcon,
  CheckIcon,
  HashIcon,
  AtIcon,
  UsersThreeIcon,
  ArrowSquareOutIcon,
  ChatTeardropTextIcon,
} from '@phosphor-icons/react';

/**
 * All static configuration owned by SlackMessageComposer.
 *
 * Grouping these as static fields gives them a clear home (Slack-the-provider)
 * rather than scattering URLs, magic numbers, and class strings as module globals.
 * Add new Slack-specific UI config here rather than introducing new top-level constants.
 */
class SlackComposerConfig {
  static readonly iconUrl =
    'https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/slack.svg';

  static readonly label = 'Slack';

  /** Maximum number of message-variant tabs rendered in one card. */
  static readonly maxTabs = 10;

  /** Visible character budget for a tab label before ellipsizing. */
  static readonly tabLabelMaxChars = 25;

  /** Default max-height of the card before the body scrolls. */
  static readonly defaultMaxHeight = 480;

  /** Tailwind tokens for the conversation pill (channel/user/group). */
  static readonly pill = {
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  } as const;

  /** Tailwind token for an inline @user mention in the message body. */
  static readonly mention = {
    text: 'text-indigo-700',
  } as const;

  /** URL scheme the backend uses to mark a resolved user mention. */
  static readonly mentionScheme = 'mention:';
}

export type SlackConversationType = 'channel' | 'dm' | 'group_dm';

export interface SlackMessageData {
  /** Opaque Slack ID — channel (C…), DM (D…), or MPIM (G…). Sent verbatim to the API. */
  conversationId: string;
  /** Human label rendered in the pill ("ext-globex-deal", "Sarah Chen", "Sarah, Mike"). */
  conversationDisplay: string;
  /** Drives pill icon: # for channel, @ for DM, three-person glyph for group DM. */
  conversationType: SlackConversationType;
  /** Set when the message is a thread reply. */
  threadTs?: string;
  /** Display label for the thread context line ("Replying in #ext-globex-deal"). */
  threadContext?: string;
  /** True when the thread reply also broadcasts to the channel. */
  replyBroadcast?: boolean;
  /** mrkdwn / markdown body — sent verbatim to Slack (keeps `<@U…>` tokens). */
  text: string;
  /** Preview body with `<@U…>` resolved to `@DisplayName`. Falls back to `text`. */
  displayText?: string;
  /** Plain-text variant used for copy-to-clipboard. */
  textPlain?: string;
  /** Contextual tab label from the agent (e.g. "Customer update"). */
  tabLabel?: string;
}

export interface SlackMessageComposerProps {
  messages: SlackMessageData[];
  maxHeight?: number;
  /** Called with the active tab index when the user clicks Send. */
  onSend?: (index: number) => void;
  /** Show shimmer state on the Send button. */
  isSending?: boolean;
  /** Indices that have already been sent — locks the row and swaps the button. */
  sentIndices?: number[];
  /** Permalinks for sent messages, keyed by tab index ("View in Slack"). */
  permalinks?: Record<number, string>;
  /** Optional discard handler — hides the affordance when undefined. */
  onDiscard?: (index: number) => void;
}

function truncateLabel(label: string | undefined): string | undefined {
  if (!label) return undefined;
  const max = SlackComposerConfig.tabLabelMaxChars;
  return label.length > max ? label.slice(0, max - 3) + '...' : label;
}

function deduplicateLabels(messages: SlackMessageData[]): SlackMessageData[] {
  const seen = new Set<string>();
  return messages.map((m) => {
    const label = m.tabLabel;
    if (!label || seen.has(label)) return { ...m, tabLabel: undefined };
    seen.add(label);
    return m;
  });
}

function ConversationPill({ type, display }: { type: SlackConversationType; display: string }) {
  const Icon = type === 'channel' ? HashIcon : type === 'dm' ? AtIcon : UsersThreeIcon;
  const { text, bg, border } = SlackComposerConfig.pill;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md ${text} ${bg} border ${border}`}
    >
      <Icon size={12} weight="bold" className="shrink-0" />
      <span className="truncate max-w-50">{display}</span>
    </span>
  );
}

export const SlackMessageComposer: React.FC<SlackMessageComposerProps> = ({
  messages,
  maxHeight = SlackComposerConfig.defaultMaxHeight,
  onSend,
  isSending = false,
  sentIndices = [],
  permalinks = {},
  onDiscard,
}) => {
  const totalCount = messages.length;
  const labelsKey = useMemo(() => messages.map((m) => m.tabLabel ?? '').join('\0'), [messages]);
  const dedupedMessages = useMemo(
    () => deduplicateLabels(messages.slice(0, SlackComposerConfig.maxTabs)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labelsKey, totalCount]
  );

  const [activeTab, setActiveTab] = useState(0);
  const [bodyCopied, setBodyCopied] = useState(false);

  useEffect(() => {
    setActiveTab((prev) =>
      prev >= dedupedMessages.length ? Math.max(0, dedupedMessages.length - 1) : prev
    );
  }, [dedupedMessages.length]);

  const current = dedupedMessages.length > 0 ? dedupedMessages[activeTab] : null;
  const isCurrentSent = sentIndices.includes(activeTab);
  const currentPermalink = permalinks[activeTab];

  const handleCopyBody = useCallback(async () => {
    if (!current) return;
    const plain = current.textPlain ?? current.text;
    try {
      await navigator.clipboard.writeText(plain);
      setBodyCopied(true);
      setTimeout(() => setBodyCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions denied / non-secure context)
    }
  }, [current]);

  if (!current) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="border border-gray-100 rounded-xl bg-white overflow-hidden flex flex-col shadow-xs"
      style={{ maxHeight }}
    >
      {/* Provider strip */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 shrink-0">
        <img
          src={SlackComposerConfig.iconUrl}
          alt={SlackComposerConfig.label}
          width={16}
          height={16}
        />
        <span className="text-sm font-medium text-gray-900">{SlackComposerConfig.label}</span>
      </div>

      {/* Tabs — only when multiple messages */}
      {dedupedMessages.length > 1 && (
        <>
          <div className="flex items-center gap-1 px-3 py-2 shrink-0 overflow-x-auto">
            {dedupedMessages.map((m, i) => (
              <button
                key={i}
                onClick={() => {
                  setActiveTab(i);
                  setBodyCopied(false);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer truncate max-w-40 shrink-0 ${
                  i === activeTab
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
                title={m.tabLabel || `Message ${i + 1}`}
              >
                {truncateLabel(m.tabLabel) || `Message ${i + 1}`}
              </button>
            ))}
          </div>
          {totalCount > SlackComposerConfig.maxTabs && (
            <p className="text-xs text-gray-500 px-3 pb-1">
              Showing {SlackComposerConfig.maxTabs} of {totalCount}.
            </p>
          )}
          <div className="border-b border-gray-100" />
        </>
      )}

      {/* To row */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 shrink-0">
        <span className="text-xs text-gray-700 shrink-0">To</span>
        <ConversationPill type={current.conversationType} display={current.conversationDisplay} />
      </div>

      {/* Thread context */}
      {current.threadTs && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border-b border-gray-100 shrink-0 text-xs text-gray-600">
          <ChatTeardropTextIcon size={12} className="text-gray-500" />
          <span>
            {current.threadContext ?? 'Replying in thread'}
            {current.replyBroadcast && ' (also posting to channel)'}
          </span>
        </div>
      )}

      {/* Body — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
        <div className="text-sm text-gray-900 leading-relaxed markdown-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            urlTransform={(url) => url}
            components={{
              a: ({ href, children, ...rest }) => {
                if (href?.startsWith(SlackComposerConfig.mentionScheme)) {
                  return (
                    <span className={`font-medium ${SlackComposerConfig.mention.text}`}>
                      {children}
                    </span>
                  );
                }
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
                    {children}
                  </a>
                );
              },
            }}
          >
            {current.displayText ?? current.text}
          </ReactMarkdown>
        </div>
      </div>

      {/* Footer CTAs */}
      <div className="flex items-center justify-between gap-1.5 px-3 py-2.5 border-t border-gray-100 shrink-0">
        <div className="flex items-center gap-1.5">
          {onDiscard && !isCurrentSent && (
            <button
              onClick={() => onDiscard(activeTab)}
              className="h-8.5 px-3 text-sm font-medium text-gray-700 bg-white rounded-xl border border-gray-200/70 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Discard
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyBody}
            className="flex items-center justify-center rounded-xl border border-gray-200/70 hover:bg-gray-50 transition-colors cursor-pointer"
            style={{ width: 34, height: 34, minWidth: 34, minHeight: 34 }}
            title="Copy body"
          >
            {bodyCopied ? (
              <CheckIcon size={15} weight="bold" className="text-emerald-600" />
            ) : (
              <CopyIcon size={15} className="text-gray-700" />
            )}
          </button>

          {isCurrentSent ? (
            currentPermalink ? (
              <a
                href={currentPermalink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 h-8.5 px-3 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <CheckIcon size={14} weight="bold" />
                View in Slack
                <ArrowSquareOutIcon size={12} />
              </a>
            ) : (
              <div className="flex items-center gap-2 h-8.5 px-3 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200">
                <CheckIcon size={14} weight="bold" />
                Sent
              </div>
            )
          ) : isSending ? (
            <div className="flex items-center gap-2 h-8.5 px-3 rounded-xl border border-gray-200/70 bg-linear-to-r from-gray-400 via-gray-600 to-gray-400 bg-clip-text text-transparent animate-shimmer">
              <img
                src={SlackComposerConfig.iconUrl}
                alt={SlackComposerConfig.label}
                width={16}
                height={16}
                className="opacity-40"
              />
              <span className="text-sm font-medium">Sending…</span>
            </div>
          ) : (
            <button
              onClick={() => onSend?.(activeTab)}
              className="flex items-center gap-2 h-8.5 px-3.5 text-sm font-medium text-white bg-von-purple rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
            >
              Send
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SlackMessageComposer;
