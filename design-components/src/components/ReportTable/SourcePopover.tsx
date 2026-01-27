import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight } from '@phosphor-icons/react';
import type { SourceReference, AIReasoningData } from './ReportTable';
import { LOGO_STATIC_URL } from '../../constants';

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
        <img src={LOGO_STATIC_URL} alt="Von" className="w-4 h-4 rounded-sm" />
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

// Von Minimal Logo component - inline SVG for AI cells
const VonMinimalLogo: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.57031 0.00976562C11.3747 0.202421 14.4003 3.34798 14.4004 7.2002L14.3916 7.5498C14.3088 9.2802 13.6139 10.8497 12.5205 12.0488L12.418 12.1768C12.3818 12.2193 12.3437 12.2617 12.3027 12.3027C12.2209 12.3846 12.1333 12.4559 12.0488 12.5205C10.8497 13.6139 9.2802 14.3088 7.5498 14.3916L7.2002 14.4004C3.34798 14.4003 0.202421 11.3747 0.00976562 7.57031L0 7.2002C4.98797e-05 5.32944 0.71407 3.62479 1.88379 2.34473C1.94851 2.26043 2.01865 2.17666 2.09766 2.09766C2.17973 2.01559 2.26687 1.94274 2.35449 1.87598C3.63351 0.711246 5.33393 5.07565e-05 7.2002 0L7.57031 0.00976562ZM1.5459 5.90137C1.45048 6.31879 1.4004 6.75354 1.40039 7.2002C1.40039 10.4034 3.99702 12.9999 7.2002 13C7.64728 13 8.08216 12.9484 8.5 12.8525C7.09291 12.4323 5.56942 11.5089 4.23047 10.1699C2.89169 8.83108 1.96633 7.30834 1.5459 5.90137ZM5.37598 2.84961C4.32573 2.56213 3.63214 2.69284 3.24414 2.95801C3.1455 3.05003 3.05003 3.1455 2.95801 3.24414C2.69285 3.63214 2.56213 4.32573 2.84961 5.37598C3.17108 6.54998 3.97097 7.92989 5.2207 9.17969C6.47056 10.4295 7.85126 11.2293 9.02539 11.5508C10.0728 11.8374 10.7638 11.7063 11.1523 11.4424C11.2524 11.3491 11.3491 11.2524 11.4424 11.1523C11.7063 10.7638 11.8374 10.0728 11.5508 9.02539C11.2293 7.85126 10.4295 6.47056 9.17969 5.2207C7.92989 3.97097 6.54998 3.17108 5.37598 2.84961ZM7.2002 1.40039C6.75354 1.40041 6.31879 1.45048 5.90137 1.5459C7.30834 1.96633 8.83108 2.89169 10.1699 4.23047C11.5089 5.56942 12.4323 7.09291 12.8525 8.5C12.9484 8.08216 13 7.64728 13 7.2002C12.9999 3.99702 10.4034 1.40039 7.2002 1.40039Z"
      fill="url(#paint0_radial_von_cell)"
    />
    <defs>
      <radialGradient
        id="paint0_radial_von_cell"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(11.1377 1.0752) rotate(120.964) scale(15.3062)"
      >
        <stop stopColor="#FFF3EB" />
        <stop offset="0.26" stopColor="#FF9042" />
        <stop offset="1" stopColor="#854FFF" />
      </radialGradient>
    </defs>
  </svg>
);

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
        <VonMinimalLogo size={12} />
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
