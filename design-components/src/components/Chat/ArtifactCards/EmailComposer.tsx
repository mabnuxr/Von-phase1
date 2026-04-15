import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyIcon, CheckIcon } from '@phosphor-icons/react';

// ============================================================================
// Gmail Icon — loaded from S3 assets
// ============================================================================

const GMAIL_ICON_URL =
  'https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/Gmail.svg';

// ============================================================================
// Types
// ============================================================================

export interface EmailData {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  /** Plain text version for copy-to-clipboard */
  bodyPlain?: string;
  /** Whether body contains HTML (false = legacy plain text / markdown) */
  isHtml?: boolean;
  /** Contextual tab label from agent (e.g. "Formal", "Sarah Chen") */
  tabLabel?: string;
}

export interface EmailComposerProps {
  /** Array of emails — each tab is one email */
  emails: EmailData[];
  /** Max height in pixels — content will shrink-wrap below this (default 480) */
  maxHeight?: number;
  /** Called when user clicks "Open in Gmail" with the index of the active email */
  onOpenInGmail?: (index: number) => void;
  /** Show loading state on the "Open in Gmail" button */
  isCreatingDraft?: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

const MAX_TABS = 10;

function truncateLabel(label?: string, max = 25): string | undefined {
  if (!label) return undefined;
  return label.length > max ? label.slice(0, max - 3) + '...' : label;
}

function deduplicateLabels(emails: EmailData[]): EmailData[] {
  const seen = new Set<string>();
  return emails.map((email) => {
    const label = email.tabLabel;
    if (!label || seen.has(label)) {
      return { ...email, tabLabel: undefined };
    }
    seen.add(label);
    return email;
  });
}

// ============================================================================
// EmailComposer
// ============================================================================

export const EmailComposer: React.FC<EmailComposerProps> = ({
  emails,
  maxHeight = 480,
  onOpenInGmail,
  isCreatingDraft = false,
}) => {
  const totalCount = emails.length;
  const dedupedEmails = useMemo(() => deduplicateLabels(emails.slice(0, MAX_TABS)), [emails]);

  const [activeTab, setActiveTab] = useState(0);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [bodyCopied, setBodyCopied] = useState(false);
  const [showSubjectTooltip, setShowSubjectTooltip] = useState(false);
  const subjectTextRef = useRef<HTMLParagraphElement>(null);

  // Clamp activeTab when emails array shrinks
  useEffect(() => {
    setActiveTab((prev) => (prev >= dedupedEmails.length ? Math.max(0, dedupedEmails.length - 1) : prev));
  }, [dedupedEmails.length]);

  const currentEmail = dedupedEmails.length > 0 ? dedupedEmails[activeTab] : null;

  const handleCopyBody = useCallback(async () => {
    if (!currentEmail) return;
    const plainText = currentEmail.bodyPlain ?? currentEmail.body;

    try {
      if (currentEmail.isHtml && typeof ClipboardItem !== 'undefined') {
        // Copy both HTML (for rich paste) and plain text (for plain paste)
        const htmlBlob = new Blob([currentEmail.body], { type: 'text/html' });
        const textBlob = new Blob([plainText], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob }),
        ]);
      } else {
        await navigator.clipboard.writeText(plainText);
      }
      setBodyCopied(true);
      setTimeout(() => setBodyCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support ClipboardItem
      try {
        await navigator.clipboard.writeText(plainText);
        setBodyCopied(true);
        setTimeout(() => setBodyCopied(false), 2000);
      } catch {
        // Clipboard unavailable (permissions denied / non-secure context)
      }
    }
  }, [currentEmail]);

  const sanitizedHtml = useMemo(() => {
    if (!currentEmail?.isHtml) return '';
    return DOMPurify.sanitize(currentEmail.body);
  }, [currentEmail?.body, currentEmail?.isHtml]);

  const isSubjectTruncated = useCallback(() => {
    const el = subjectTextRef.current;
    if (!el) return false;
    return el.scrollWidth > el.clientWidth;
  }, []);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    setShowCc(false);
    setShowBcc(false);
    setBodyCopied(false);
  };

  if (!currentEmail) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="border border-gray-100 rounded-xl bg-white overflow-hidden flex flex-col shadow-xs"
      style={{ maxHeight }}
    >
      {/* Tabs — only shown when multiple emails */}
      {dedupedEmails.length > 1 && (
        <>
          <div className="flex items-center gap-1 px-3 py-2 flex-shrink-0 overflow-x-auto">
            {dedupedEmails.map((email, i) => (
              <button
                key={i}
                onClick={() => handleTabChange(i)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer truncate max-w-[160px] flex-shrink-0 ${
                  i === activeTab
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
                title={email.tabLabel || `Email ${i + 1}`}
              >
                {truncateLabel(email.tabLabel) || `Email ${i + 1}`}
              </button>
            ))}
          </div>
          {totalCount > MAX_TABS && (
            <p className="text-xs text-gray-500 px-3 pb-1">
              Showing {MAX_TABS} of {totalCount} — narrow your selection to see others.
            </p>
          )}
          <div className="border-b border-gray-100" />
        </>
      )}

      {/* To row */}
      <div className="flex items-center px-3 py-2 border-b border-gray-100 flex-shrink-0 gap-2">
        <span className="text-xs text-gray-700 flex-shrink-0">To</span>
        <div className="flex-1 min-w-0 truncate">
          <span className="text-sm text-gray-900">{currentEmail.to.join(', ')}</span>
        </div>
        {/* Cc / Bcc toggle buttons */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {currentEmail.cc && currentEmail.cc.length > 0 && (
            <button
              onClick={() => setShowCc(!showCc)}
              className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                showCc ? 'text-gray-900 font-medium' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Cc
              <span className="text-[10px] text-gray-800/80 bg-gray-50 border border-gray-100 rounded px-1 min-w-[16px] text-center leading-4">
                {currentEmail.cc.length}
              </span>
            </button>
          )}
          {currentEmail.bcc && currentEmail.bcc.length > 0 && (
            <button
              onClick={() => setShowBcc(!showBcc)}
              className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                showBcc ? 'text-gray-900 font-medium' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Bcc
              <span className="text-[10px] text-gray-800/80 bg-gray-50 border border-gray-100 rounded px-1 min-w-[16px] text-center leading-4">
                {currentEmail.bcc.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Cc row — animated */}
      <AnimatePresence>
        {showCc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="border-b border-gray-100 flex-shrink-0"
          >
            <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto">
              <span className="text-xs text-gray-700 flex-shrink-0">Cc</span>
              <span className="text-sm text-gray-900 whitespace-nowrap">
                {currentEmail.cc?.join(', ') || '—'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bcc row — animated */}
      <AnimatePresence>
        {showBcc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="border-b border-gray-100 flex-shrink-0"
          >
            <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto">
              <span className="text-xs text-gray-700 flex-shrink-0">Bcc</span>
              <span className="text-sm text-gray-900 whitespace-nowrap">
                {currentEmail.bcc?.join(', ') || '—'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subject line */}
      <div
        className="flex items-center px-3 py-2 gap-1.5 border-b border-gray-100 flex-shrink-0 relative"
        onMouseEnter={() => {
          if (isSubjectTruncated()) setShowSubjectTooltip(true);
        }}
        onMouseLeave={() => setShowSubjectTooltip(false)}
      >
        <span className="text-xs text-gray-700 flex-shrink-0">Subject</span>
        <p ref={subjectTextRef} className="flex-1 text-sm text-gray-900 truncate min-w-0">
          {currentEmail.subject}
        </p>

        {/* Tooltip for truncated subject */}
        <AnimatePresence>
          {showSubjectTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-3 right-3 top-full mt-1 z-50 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-sm leading-relaxed"
            >
              {currentEmail.subject}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Email body — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
        <div className="text-sm text-gray-900 leading-relaxed markdown-content">
          {currentEmail.isHtml ? (
            <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentEmail.body}</ReactMarkdown>
          )}
        </div>
      </div>

      {/* Footer CTAs — right-aligned */}
      <div className="flex items-center justify-end gap-1.5 px-3 py-2.5 border-t border-gray-100 flex-shrink-0">
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
        {isCreatingDraft ? (
          <div className="flex items-center gap-2 h-[34px] px-3 rounded-xl border border-gray-200/70 bg-gradient-to-r from-gray-400 via-gray-600 to-gray-400 bg-clip-text text-transparent animate-shimmer">
            <img
              src={GMAIL_ICON_URL}
              alt="Gmail"
              width={16}
              height={16}
              className="flex-shrink-0 opacity-40"
            />
            <span className="text-sm font-medium">Opening in Gmail…</span>
          </div>
        ) : (
          <button
            onClick={() => onOpenInGmail?.(activeTab)}
            className="flex items-center gap-2 h-[34px] px-3 text-sm font-medium text-gray-900 bg-white rounded-xl border border-gray-200/70 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <img
              src={GMAIL_ICON_URL}
              alt="Gmail"
              width={16}
              height={16}
              className="flex-shrink-0"
            />
            Open in Gmail
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default EmailComposer;
