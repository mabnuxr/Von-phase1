import React, { useState } from 'react';
import { CopyIcon, ArrowSquareOutIcon } from '@phosphor-icons/react';
import { ArtifactCardSkeleton } from './BaseArtifactCard';
import type { EmailDraftArtifact } from './types';

export interface GmailDraftCardProps {
  artifact: EmailDraftArtifact;
  onOpenInGmail?: () => void;
  isGmailConnected?: boolean;
  isGmailEnabled?: boolean;
}

const GmailIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M6 6h36v36H6z" opacity="0" />
    <path fill="#4285F4" d="M45 6H3a3 3 0 0 0-3 3v30a3 3 0 0 0 3 3h42a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3z" opacity="0" />
    <path fill="#EA4335" d="M45 6H3L24 27z" />
    <path fill="#FBBC05" d="M3 6 0 9v30l14-14z" />
    <path fill="#34A853" d="M45 6l3 3v30L34 25z" />
    <path fill="#4285F4" d="M0 39l14-14 10 10 10-10 14 14v3a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3z" />
    <path fill="#C5221F" d="M3 6 0 9l14 16 10-8z" opacity="0" />
  </svg>
);

export const GmailDraftCard: React.FC<GmailDraftCardProps> = ({
  artifact,
  onOpenInGmail,
  isGmailConnected = false,
  isGmailEnabled = true,
}) => {
  const [copiedSubject, setCopiedSubject] = useState(false);

  if (artifact.isPending) {
    return <ArtifactCardSkeleton />;
  }

  const handleCopySubject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(artifact.subject);
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    } catch {
      // ignore
    }
  };

  const openTooltip = !isGmailEnabled
    ? 'Open in Gmail (Coming Soon)'
    : !isGmailConnected
      ? 'Connect Gmail'
      : 'Open in Gmail';

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-xs hover:border-gray-200 transition-colors bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
        <svg
          className="w-3.5 h-3.5 text-gray-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <span className="text-xs font-medium text-gray-500 tracking-wide">Draft Email</span>
      </div>

      {/* Subject */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100">
        <span className="text-xs text-gray-400 shrink-0 w-12">Subject</span>
        <span className="text-sm font-medium text-gray-900 flex-1 min-w-0 truncate">
          {artifact.subject}
        </span>
        <button
          onClick={handleCopySubject}
          className="shrink-0 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer border-none bg-transparent"
          title={copiedSubject ? 'Copied!' : 'Copy subject'}
        >
          <CopyIcon size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 max-h-44 overflow-y-auto not-prose">
        <div className="font-sans text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{artifact.body}</div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-gray-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenInGmail?.();
          }}
          disabled={!isGmailEnabled || !isGmailConnected}
          title={openTooltip}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GmailIcon />
          <span>Open in Gmail</span>
          <ArrowSquareOutIcon size={13} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default GmailDraftCard;
