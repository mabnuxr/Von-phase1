import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight } from '@phosphor-icons/react';
import type { SourceReference, AIReasoningData } from './ReportTable';
import { LOGO_URL } from '../../constants';
import { VonIcon } from '../VonIcon';

// Source icons - inline SVGs for portability
const SalesforceIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.02 5.64c.72-.78 1.74-1.26 2.88-1.26 1.5 0 2.82.84 3.48 2.1.54-.24 1.14-.36 1.74-.36 2.46 0 4.44 2.04 4.44 4.56s-1.98 4.56-4.44 4.56c-.36 0-.72-.06-1.08-.12-.54 1.26-1.8 2.16-3.24 2.16-.66 0-1.26-.18-1.8-.48-.6 1.38-1.98 2.34-3.54 2.34-1.86 0-3.42-1.32-3.78-3.06-.18.06-.42.06-.6.06-1.86 0-3.36-1.56-3.36-3.48 0-1.38.78-2.58 1.92-3.12-.12-.42-.18-.84-.18-1.32 0-2.52 2.04-4.56 4.56-4.56.96 0 1.86.3 2.58.84z"
      fill="#00A1E0"
    />
  </svg>
);

const GongIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="4" fill="#7B68EE" />
    <path
      d="M12 6C8.69 6 6 8.69 6 12s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
      fill="white"
    />
  </svg>
);

const GmailIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"
      fill="#EA4335"
    />
    <path d="M22 6l-10 7L2 6" stroke="white" strokeWidth="2" fill="none" />
  </svg>
);

const CalendarIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" fill="#4285F4" />
    <rect x="3" y="4" width="18" height="5" fill="#1A73E8" />
    <path d="M7 3v2M17 3v2" stroke="#1A73E8" strokeWidth="2" strokeLinecap="round" />
    <rect x="6" y="12" width="3" height="3" fill="white" />
    <rect x="10.5" y="12" width="3" height="3" fill="white" />
    <rect x="15" y="12" width="3" height="3" fill="white" />
    <rect x="6" y="16" width="3" height="3" fill="white" />
    <rect x="10.5" y="16" width="3" height="3" fill="white" />
  </svg>
);

const HubSpotIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" fill="#FF7A59" />
    <path
      d="M14.5 8.5v2.17c-.47-.27-1.01-.42-1.58-.42-1.76 0-3.17 1.46-3.17 3.25s1.41 3.25 3.17 3.25c.57 0 1.11-.15 1.58-.42V18.5h2v-10h-2zm-1.58 6.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"
      fill="white"
    />
  </svg>
);

const getSourceIcon = (type: SourceReference['type'], size = 16) => {
  switch (type) {
    case 'salesforce':
      return <SalesforceIcon size={size} />;
    case 'gong':
      return <GongIcon size={size} />;
    case 'gmail':
      return <GmailIcon size={size} />;
    case 'calendar':
      return <CalendarIcon size={size} />;
    case 'hubspot':
      return <HubSpotIcon size={size} />;
    default:
      return <SalesforceIcon size={size} />;
  }
};

// ============================================================================
// Source Popover Component
// ============================================================================

interface SourcePopoverProps {
  reasoning: AIReasoningData;
  onClose: () => void;
  position: { top: number; left: number };
}

export const SourcePopover: React.FC<SourcePopoverProps> = ({ reasoning, onClose, position }) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Flatten all source references for simpler display
  const allSourceRefs = reasoning.sourceReferences || [];

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-[10000] overflow-hidden"
      style={{ top: position.top, left: Math.min(position.left, window.innerWidth - 340) }}
    >
      {/* Header with Von logo + opportunity name */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-b border-gray-100">
        <img src={LOGO_URL} alt="Von" className="w-4 h-4 rounded-sm" />
        {reasoning.recordName && (
          <span className="text-sm font-medium text-gray-900 truncate">{reasoning.recordName}</span>
        )}
      </div>

      {/* Reasoning section */}
      {reasoning.reasoning && (
        <div className="px-3 py-2.5 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-700 mb-1.5">AI Reasoning</p>
          <p className="text-sm text-gray-900 leading-relaxed">{reasoning.reasoning}</p>
          {reasoning.confidence !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-700">Confidence:</span>
              <span className="text-sm font-medium text-gray-900">
                {Math.round(reasoning.confidence * 100)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Source references - logo + link directly */}
      <div className="px-3 py-2.5">
        <p className="text-xs font-medium text-gray-700 mb-2">Data Sources</p>

        {allSourceRefs.length > 0 ? (
          <div className="space-y-1.5">
            {allSourceRefs.map((ref, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {getSourceIcon(ref.type, 14)}
                {ref.url ? (
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    <span>{ref.label}</span>
                    <ArrowUpRight size={12} />
                  </a>
                ) : (
                  <span className="text-sm text-gray-900">{ref.label}</span>
                )}
              </div>
            ))}
          </div>
        ) : reasoning.sources && reasoning.sources.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {reasoning.sources.map((source, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full"
              >
                {source}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No sources available</p>
        )}
      </div>
    </div>,
    document.body
  );
};

// ============================================================================
// Von Logo Button for AI Cells
// ============================================================================

interface VonLogoButtonProps {
  reasoning?: AIReasoningData;
  onClick?: () => void;
}

export const VonLogoButton: React.FC<VonLogoButtonProps> = ({ reasoning, onClick }) => {
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else if (buttonRef.current && reasoning) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + 4,
        left: Math.min(rect.left - 240, window.innerWidth - 300),
      });
      setShowPopover(true);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleClick}
        className="ml-1.5 p-1 bg-white shadow-xs hover:bg-gray-100 rounded transition-colors cursor-pointer flex-shrink-0"
        title="View sources"
      >
        <VonIcon size={12} />
      </button>
      {showPopover && reasoning && (
        <SourcePopover
          reasoning={reasoning}
          position={popoverPosition}
          onClose={() => setShowPopover(false)}
        />
      )}
    </>
  );
};

export default SourcePopover;
