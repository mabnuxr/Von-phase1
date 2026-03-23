import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyIcon, EnvelopeSimpleIcon, CheckIcon } from '@phosphor-icons/react';
import { ArtifactCardSkeleton } from './BaseArtifactCard';
import type { EmailDraftArtifact } from './types';

// ============================================================================
// Gmail Icon
// ============================================================================

const GmailIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="52 42 88 66"
    width={size}
    height={(size * 66) / 88}
    className="flex-shrink-0"
  >
    <path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6" />
    <path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15" />
    <path fill="#fbbc04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2" />
    <path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92" />
    <path fill="#c5221f" d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2" />
  </svg>
);

// ============================================================================
// Props
// ============================================================================

export interface GmailDraftCardProps {
  artifact: EmailDraftArtifact;
  onOpenInGmail?: () => void;
  isGmailConnected?: boolean;
  isGmailEnabled?: boolean;
  /** Fixed height in pixels (default 480) */
  height?: number;
}

// ============================================================================
// Component
// ============================================================================

export const GmailDraftCard: React.FC<GmailDraftCardProps> = ({
  artifact,
  onOpenInGmail,
  isGmailConnected = false,
  isGmailEnabled = true,
  height = 480,
}) => {
  const [subjectCopied, setSubjectCopied] = useState(false);
  const [bodyCopied, setBodyCopied] = useState(false);
  const [showSubjectTooltip, setShowSubjectTooltip] = useState(false);
  const [bodyExpanded, setBodyExpanded] = useState(false);
  const subjectTextRef = useRef<HTMLParagraphElement>(null);

  const hasBodyToggle = artifact.bodyPreview !== artifact.bodyFull;
  const displayedBody = hasBodyToggle && !bodyExpanded ? artifact.bodyPreview : artifact.bodyFull;

  const handleCopySubject = useCallback(() => {
    navigator.clipboard.writeText(artifact.subject);
    setSubjectCopied(true);
    setTimeout(() => setSubjectCopied(false), 2000);
  }, [artifact.subject]);

  const handleCopyBody = useCallback(() => {
    navigator.clipboard.writeText(artifact.bodyFull);
    setBodyCopied(true);
    setTimeout(() => setBodyCopied(false), 2000);
  }, [artifact.bodyFull]);

  const isSubjectTruncated = useCallback(() => {
    const el = subjectTextRef.current;
    if (!el) return false;
    return el.scrollWidth > el.clientWidth;
  }, []);

  if (artifact.isPending) {
    return <ArtifactCardSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="border border-gray-100 rounded-xl bg-white overflow-hidden flex flex-col shadow-xs"
      style={{ height }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <EnvelopeSimpleIcon size={14} className="text-gray-700" />
          <span className="text-sm font-medium text-gray-900">Draft Email</span>
        </div>
      </div>

      {/* To row */}
      {artifact.to && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 flex-shrink-0">
          <span className="text-xs text-gray-700 flex-shrink-0">To</span>
          <p className="text-sm text-gray-900 truncate">{artifact.to}</p>
        </div>
      )}

      {/* CC row */}
      {artifact.cc && artifact.cc.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 flex-shrink-0">
          <span className="text-xs text-gray-700 flex-shrink-0">CC</span>
          <p className="text-sm text-gray-900 truncate">{artifact.cc.join(', ')}</p>
        </div>
      )}

      {/* Subject row */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-gray-100 flex-shrink-0 relative"
        onMouseEnter={() => {
          if (isSubjectTruncated()) setShowSubjectTooltip(true);
        }}
        onMouseLeave={() => setShowSubjectTooltip(false)}
      >
        <div className="flex-1 min-w-0 mr-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-700 flex-shrink-0">Subject</span>
            <p ref={subjectTextRef} className="text-sm font-medium text-gray-900 truncate">
              {artifact.subject}
            </p>
          </div>
        </div>
        <button
          onClick={handleCopySubject}
          className="flex items-center justify-center rounded-xl border hover:bg-gray-50 transition-colors cursor-pointer flex-shrink-0 border-gray-100"
          style={{ width: 34, height: 34, minWidth: 34, minHeight: 34 }}
          title="Copy subject"
        >
          {subjectCopied ? (
            <CheckIcon size={16} weight="bold" className="text-emerald-600" />
          ) : (
            <CopyIcon size={16} className="text-gray-700" />
          )}
        </button>

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
              {artifact.subject}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Email body — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
        <span className="text-xs text-gray-700 mb-2 block">Body</span>
        <div className="text-sm text-gray-900 leading-relaxed markdown-content not-prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedBody}</ReactMarkdown>
        </div>
        {hasBodyToggle && (
          <button
            onClick={() => setBodyExpanded((v) => !v)}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
          >
            {bodyExpanded ? 'Show less ▲' : 'Show full email ▼'}
          </button>
        )}
      </div>

      {/* CRM context */}
      {artifact.crmContext && (
        <div className="flex items-center gap-1.5 px-3 py-2 border-t border-gray-100 flex-shrink-0 bg-gray-50/60">
          <span className="text-xs text-gray-500 truncate">{artifact.crmContext}</span>
        </div>
      )}

      {/* Footer CTAs */}
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
          onClick={onOpenInGmail}
          disabled={!isGmailEnabled || !isGmailConnected}
          title={
            !isGmailEnabled
              ? 'Open in Gmail (Coming Soon)'
              : !isGmailConnected
                ? 'Connect Gmail to send'
                : 'Open in Gmail'
          }
          className="flex items-center gap-2 h-[34px] px-3 text-sm font-medium text-gray-900 bg-white rounded-xl border border-gray-200/70 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GmailIcon size={16} />
          Open in Gmail
        </button>
      </div>
    </motion.div>
  );
};

export default GmailDraftCard;
