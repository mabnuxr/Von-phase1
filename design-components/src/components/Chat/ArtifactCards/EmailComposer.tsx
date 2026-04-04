import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
}

export interface EmailComposerProps {
  /** Array of emails — each tab is one email */
  emails: EmailData[];
  /** Max height in pixels — content will shrink-wrap below this (default 480) */
  maxHeight?: number;
  /** Called when user clicks "Open in Gmail" with the index of the active email */
  onOpenInGmail?: (index: number) => void;
}

// ============================================================================
// EmailComposer
// ============================================================================

export const EmailComposer: React.FC<EmailComposerProps> = ({
  emails,
  maxHeight = 480,
  onOpenInGmail,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [bodyCopied, setBodyCopied] = useState(false);
  const [showSubjectTooltip, setShowSubjectTooltip] = useState(false);
  const subjectTextRef = useRef<HTMLParagraphElement>(null);

  // Clamp activeTab when emails array shrinks
  useEffect(() => {
    setActiveTab((prev) => (prev >= emails.length ? Math.max(0, emails.length - 1) : prev));
  }, [emails.length]);

  const currentEmail = emails.length > 0 ? emails[activeTab] : null;

  const handleCopyBody = useCallback(() => {
    if (!currentEmail) return;
    navigator.clipboard.writeText(currentEmail.body);
    setBodyCopied(true);
    setTimeout(() => setBodyCopied(false), 2000);
  }, [currentEmail]);

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
      {emails.length > 1 && (
        <>
          <div className="flex items-center gap-1 px-3 py-2 flex-shrink-0">
            {emails.map((_, i) => (
              <button
                key={i}
                onClick={() => handleTabChange(i)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  i === activeTab
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Email {i + 1}
              </button>
            ))}
          </div>
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
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentEmail.body}</ReactMarkdown>
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
        <button
          onClick={() => onOpenInGmail?.(activeTab)}
          className="flex items-center gap-2 h-[34px] px-3 text-sm font-medium text-gray-900 bg-white rounded-xl border border-gray-200/70 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <img src={GMAIL_ICON_URL} alt="Gmail" width={16} height={16} className="flex-shrink-0" />
          Open in Gmail
        </button>
      </div>
    </motion.div>
  );
};

export default EmailComposer;
