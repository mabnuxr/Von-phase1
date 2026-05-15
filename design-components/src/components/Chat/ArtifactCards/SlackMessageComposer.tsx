import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import parse, { NodeType, type Node } from 'slack-message-parser';
import * as emoji from 'node-emoji';
import {
  CopyIcon,
  CheckIcon,
  HashIcon,
  AtIcon,
  UsersThreeIcon,
  ArrowSquareOutIcon,
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

  /**
   * Backend convention: `[@Name](mention:U…)` markdown link → bridged to
   * Slack-native `<@U…|@Name>` before parsing so the AST emits a labelled
   * UserLink node. Brackets/backslashes inside the name come pre-escaped
   * from the backend; we strip those escapes when bridging.
   */
  static readonly mentionLinkRe = /\[@((?:\\[\\[\]]|[^\]])+)\]\(mention:(U[A-Z0-9]+)\)/g;
}

export type SlackConversationType = 'channel' | 'dm' | 'group_dm';

export interface SlackMessageData {
  /** Stable identifier per draft (e.g. artifact file id). Used as the React
   *  key so tab state survives reorders and stale sent/permalink state doesn't
   *  bleed onto a different draft. Falls back to a composite if omitted. */
  id?: string;
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

/**
 * Bridge the backend's `[@Name](mention:U…)` markdown-link convention back to
 * Slack-native `<@U…|@Name>` so `slack-message-parser` emits a labelled
 * UserLink node. Unescapes `\[`, `\]`, `\\` that the backend inserted to keep
 * the markdown link parseable.
 */
function bridgeMentionLinks(text: string): string {
  return text.replace(SlackComposerConfig.mentionLinkRe, (_match, escapedName, userId) => {
    const name = (escapedName as string)
      .replace(/\\\\/g, '\\')
      .replace(/\\\[/g, '[')
      .replace(/\\\]/g, ']');
    return `<@${userId}|@${name}>`;
  });
}

/** Render a `slack-message-parser` AST as React, preserving Slack formatting. */
function renderSlackMrkdwn(text: string): React.ReactNode {
  const tree = parse(bridgeMentionLinks(text));
  return renderSlackChildren(tree.children, 'root');
}

function renderSlackChildren(nodes: Node[], parentKey: string): React.ReactNode {
  return nodes.map((node, i) => renderSlackNode(node, `${parentKey}.${i}`));
}

function renderSlackNode(node: Node, key: string): React.ReactNode {
  switch (node.type) {
    case NodeType.Text:
      return <React.Fragment key={key}>{node.text}</React.Fragment>;
    case NodeType.Bold:
      return (
        <strong key={key} className="font-semibold">
          {renderSlackChildren(node.children, key)}
        </strong>
      );
    case NodeType.Italic:
      return <em key={key}>{renderSlackChildren(node.children, key)}</em>;
    case NodeType.Strike:
      return (
        <span key={key} className="line-through">
          {renderSlackChildren(node.children, key)}
        </span>
      );
    case NodeType.Code:
      return (
        <code
          key={key}
          className="px-1 py-0.5 rounded bg-gray-100 text-[0.85em] text-gray-800 font-mono"
        >
          {node.text}
        </code>
      );
    case NodeType.PreText:
      return (
        <pre
          key={key}
          className="my-1.5 p-2 rounded bg-gray-100 text-xs font-mono whitespace-pre overflow-x-auto"
        >
          <code>{node.text}</code>
        </pre>
      );
    case NodeType.Quote:
      return (
        <blockquote key={key} className="border-l-2 border-gray-300 pl-2 my-1 text-gray-700">
          {renderSlackChildren(node.children, key)}
        </blockquote>
      );
    case NodeType.Emoji: {
      const unicode = emoji.get(node.name);
      return (
        <span key={key} aria-label={node.name}>
          {unicode ?? `:${node.name}:`}
        </span>
      );
    }
    case NodeType.URL: {
      const label = node.label ? renderSlackChildren(node.label, key) : node.url;
      return (
        <a
          key={key}
          href={safeHref(node.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {label}
        </a>
      );
    }
    case NodeType.UserLink: {
      const label = node.label ? renderSlackChildren(node.label, key) : `@${node.userID}`;
      return (
        <span key={key} className={`font-medium ${SlackComposerConfig.mention.text}`}>
          {label}
        </span>
      );
    }
    case NodeType.ChannelLink: {
      const label = node.label ? renderSlackChildren(node.label, key) : `#${node.channelID}`;
      return (
        <span key={key} className="font-medium text-indigo-700">
          {label}
        </span>
      );
    }
    case NodeType.Command: {
      const label = node.label ? renderSlackChildren(node.label, key) : `@${node.name}`;
      return (
        <span key={key} className="font-medium text-indigo-700">
          {label}
        </span>
      );
    }
    case NodeType.Root:
      return <React.Fragment key={key}>{renderSlackChildren(node.children, key)}</React.Fragment>;
    default:
      return null;
  }
}

/**
 * Allowlist navigable URL schemes. Since `displayText` is LLM/agent-authored,
 * a crafted `<javascript:alert(1)|click>` would otherwise render as a live
 * XSS vector in both the React tree and the clipboard `text/html` payload.
 * The old react-markdown pipeline ran `defaultUrlTransform` which did the
 * same — re-introducing the gate at the AST boundary keeps that protection.
 */
function safeHref(url: string): string {
  try {
    const scheme = new URL(url, window.location.href).protocol.toLowerCase();
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(scheme) ? url : '#';
  } catch {
    return '#';
  }
}

/** HTML-escape so AST text content can't break out of the clipboard payload. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render the Slack AST to HTML for the clipboard's `text/html` payload.
 * Mirrors the React renderer's tag choices so paste-into-Slack / Notion /
 * Google Docs sees the same structure the user sees on screen.
 */
function slackMrkdwnToHtml(text: string): string {
  const tree = parse(bridgeMentionLinks(text));
  return tree.children.map(nodeToHtml).join('');
}

function nodeToHtml(node: Node): string {
  switch (node.type) {
    case NodeType.Text:
      // Preserve intra-paragraph line breaks — HTML otherwise collapses them.
      return escapeHtml(node.text).replace(/\n/g, '<br>');
    case NodeType.Bold:
      return `<strong>${node.children.map(nodeToHtml).join('')}</strong>`;
    case NodeType.Italic:
      return `<em>${node.children.map(nodeToHtml).join('')}</em>`;
    case NodeType.Strike:
      return `<s>${node.children.map(nodeToHtml).join('')}</s>`;
    case NodeType.Code:
      return `<code>${escapeHtml(node.text)}</code>`;
    case NodeType.PreText:
      return `<pre><code>${escapeHtml(node.text)}</code></pre>`;
    case NodeType.Quote:
      return `<blockquote>${node.children.map(nodeToHtml).join('')}</blockquote>`;
    case NodeType.Emoji: {
      const unicode = emoji.get(node.name);
      return escapeHtml(unicode ?? `:${node.name}:`);
    }
    case NodeType.URL: {
      const label = node.label ? node.label.map(nodeToHtml).join('') : escapeHtml(node.url);
      return `<a href="${escapeHtml(safeHref(node.url))}">${label}</a>`;
    }
    case NodeType.UserLink: {
      const label = node.label
        ? node.label.map(nodeToHtml).join('')
        : `@${escapeHtml(node.userID)}`;
      return `<span>${label}</span>`;
    }
    case NodeType.ChannelLink: {
      const label = node.label
        ? node.label.map(nodeToHtml).join('')
        : `#${escapeHtml(node.channelID)}`;
      return `<span>${label}</span>`;
    }
    case NodeType.Command: {
      const label = node.label ? node.label.map(nodeToHtml).join('') : `@${escapeHtml(node.name)}`;
      return `<span>${label}</span>`;
    }
    case NodeType.Root:
      return node.children.map(nodeToHtml).join('');
    default:
      return '';
  }
}

function ConversationPill({ type, display }: { type: SlackConversationType; display: string }) {
  const Icon = type === 'channel' ? HashIcon : type === 'dm' ? AtIcon : UsersThreeIcon;
  const { text, bg, border } = SlackComposerConfig.pill;
  // Strip the leading sigil — the icon already conveys channel/DM, so backend payloads
  // shaped like "#ext-globex" or "@sarah" would otherwise render as "# #ext-globex".
  const sigil = type === 'channel' ? '#' : type === 'dm' ? '@' : null;
  const label = sigil && display.startsWith(sigil) ? display.slice(1) : display;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md ${text} ${bg} border ${border}`}
    >
      <Icon size={12} weight="bold" className="shrink-0" />
      <span className="truncate max-w-50">{label}</span>
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

  useEffect(() => {
    if (totalCount > SlackComposerConfig.maxTabs) {
      console.warn(
        `[SlackMessageComposer] truncated ${totalCount - SlackComposerConfig.maxTabs} of ${totalCount} drafts; ` +
          `only the first ${SlackComposerConfig.maxTabs} are reachable. Agent should cap variants upstream.`
      );
    }
  }, [totalCount]);

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
    const html = slackMrkdwnToHtml(current.displayText ?? current.text);
    try {
      // Write both formats — Slack/Notion/Docs pick HTML and preserve styling;
      // plain editors fall back to text/plain. ClipboardItem isn't on older
      // Safari / non-secure contexts, so fall through to writeText.
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plain], { type: 'text/plain' }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(plain);
      }
      setBodyCopied(true);
      setTimeout(() => setBodyCopied(false), 2000);
    } catch {
      try {
        await navigator.clipboard.writeText(plain);
        setBodyCopied(true);
        setTimeout(() => setBodyCopied(false), 2000);
      } catch {
        // Clipboard unavailable (permissions denied / non-secure context)
      }
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
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-100 shrink-0">
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
          <div className="flex items-center gap-1 px-3 py-2 shrink-0 overflow-x-auto settings-scrollbar">
            {dedupedMessages.map((m, i) => (
              <button
                key={m.id ?? `${m.conversationId}::${m.threadTs ?? ''}::${m.tabLabel ?? i}`}
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
          <span aria-hidden="true" className="text-gray-500 leading-none">
            ↳
          </span>
          <span>
            {current.threadContext ?? 'Replying in thread'}
            {current.replyBroadcast && ' (also posting to channel)'}
          </span>
        </div>
      )}

      {/* Body — scrollable, rendered from Slack mrkdwn AST */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
        <div className="text-sm text-gray-900 leading-relaxed markdown-content whitespace-pre-wrap">
          {renderSlackMrkdwn(current.displayText ?? current.text)}
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
                title="View in Slack"
                className="flex items-center gap-2 h-8.5 px-3 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <CheckIcon size={14} weight="bold" />
                Sent
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
              className="flex items-center gap-2 h-8.5 px-3.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
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
