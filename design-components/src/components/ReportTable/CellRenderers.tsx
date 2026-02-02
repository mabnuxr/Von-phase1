import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { DataSourceType } from './ReportTable';

// ============================================================================
// Source Icon Component
// ============================================================================

interface SourceIconProps {
  source: DataSourceType;
  size?: number;
  className?: string;
}

export const SourceIcon: React.FC<SourceIconProps> = ({ source, size = 16, className = '' }) => {
  const iconStyle = { width: size, height: size };

  switch (source) {
    case 'salesforce':
      return (
        <svg
          viewBox="0 0 24 24"
          style={iconStyle}
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 4.5C10 4.5 10.75 3 12.75 3C14.75 3 16 4.5 16.5 5.5C17 4.5 18.5 4 20 5C21.5 6 21.5 8 21 9.5C21.5 10 22 11.5 21 13.5C20 15.5 18 15.5 17 15.5C17 16.5 16 18 14 18C12 18 11 17 10.5 16C9.5 17.5 7.5 18 6 17C4.5 16 4.5 14 5 13C4 12.5 3 11 3.5 9C4 7 6 6.5 7 7C7 5.5 8.5 4 10 4.5Z"
            fill="#00A1E0"
          />
        </svg>
      );
    case 'gong':
      return (
        <svg
          viewBox="0 0 24 24"
          style={iconStyle}
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="9" fill="#7C3AED" />
          <path
            d="M8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'gmail':
      return (
        <svg
          viewBox="0 0 24 24"
          style={iconStyle}
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" fill="#EA4335" />
          <path d="M3 7L12 13L21 7" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'calendar':
      return (
        <svg
          viewBox="0 0 24 24"
          style={iconStyle}
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="3" y="5" width="18" height="16" rx="2" fill="#4285F4" />
          <rect x="3" y="5" width="18" height="4" fill="#1967D2" />
          <rect x="7" y="11" width="2" height="2" fill="white" />
          <rect x="11" y="11" width="2" height="2" fill="white" />
          <rect x="15" y="11" width="2" height="2" fill="white" />
          <rect x="7" y="15" width="2" height="2" fill="white" />
          <rect x="11" y="15" width="2" height="2" fill="white" />
        </svg>
      );
    case 'hubspot':
      return (
        <svg
          viewBox="0 0 24 24"
          style={iconStyle}
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="9" fill="#FF7A59" />
          <circle cx="12" cy="12" r="3" fill="white" />
          <circle cx="12" cy="6" r="1.5" fill="white" />
          <line x1="12" y1="7.5" x2="12" y2="9" stroke="white" strokeWidth="1.5" />
        </svg>
      );
    case 'mixed':
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          style={iconStyle}
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="vonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
          </defs>
          <rect x="3" y="3" width="18" height="18" rx="4" fill="url(#vonGradient)" />
          <path
            d="M8 12L11 15L16 9"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
};

// ============================================================================
// Owner/Contact Cell - Initials in colored circle
// ============================================================================

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-green-600',
  'bg-purple-600',
  'bg-orange-600',
  'bg-pink-600',
  'bg-teal-600',
  'bg-indigo-600',
  'bg-red-600',
  'bg-yellow-600',
  'bg-cyan-600',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

interface OwnerCellProps {
  value: string;
}

export const OwnerCell: React.FC<OwnerCellProps> = ({ value }) => {
  const initials = getInitials(value);
  const colorIndex = hashString(value) % AVATAR_COLORS.length;
  const bgColor = AVATAR_COLORS[colorIndex];

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center justify-center w-6 h-6 rounded-full ${bgColor} text-white text-[10px] font-medium flex-shrink-0`}
      >
        {initials}
      </div>
      <span className="text-gray-900 truncate">{value}</span>
    </div>
  );
};

// ============================================================================
// Multi-Picklist Cell - Multiple chips/tags
// ============================================================================

interface MultiPicklistCellProps {
  value: string | string[];
}

export const MultiPicklistCell: React.FC<MultiPicklistCellProps> = ({ value }) => {
  const items = Array.isArray(value) ? value : value.split(',').map((s) => s.trim());

  return (
    <div className="flex items-center gap-1 overflow-hidden">
      {items.map((item, index) => (
        <span
          key={index}
          className="px-2 py-0.5 text-sm font-medium bg-gray-50 border border-gray-100 shadow-xs rounded-full text-gray-800 whitespace-nowrap flex-shrink-0"
        >
          {item}
        </span>
      ))}
    </div>
  );
};

// ============================================================================
// Sentiment Cell - Color-coded chips
// ============================================================================

type SentimentValue = 'positive' | 'negative' | 'optimistic' | 'neutral' | string;

const SENTIMENT_STYLES: Record<string, string> = {
  positive: 'bg-green-100 text-green-800 border-green-200',
  negative: 'bg-red-100 text-red-800 border-red-200',
  optimistic: 'bg-teal-100 text-teal-800 border-teal-200',
  neutral: 'bg-gray-100 text-gray-800 border-gray-200',
};

interface SentimentCellProps {
  value: SentimentValue;
}

export const SentimentCell: React.FC<SentimentCellProps> = ({ value }) => {
  const normalizedValue = value.toLowerCase();
  const styles = SENTIMENT_STYLES[normalizedValue] || SENTIMENT_STYLES.neutral;

  return (
    <span
      className={`inline-flex px-2 py-0.5 text-sm font-medium border shadow-xs rounded-full ${styles}`}
    >
      {value}
    </span>
  );
};

// ============================================================================
// Boolean Cell - Yes/No with color
// ============================================================================

interface BooleanCellProps {
  value: boolean | string;
}

export const BooleanCell: React.FC<BooleanCellProps> = ({ value }) => {
  const isTrue =
    value === true || value === 'true' || value === 'yes' || value === 'Yes' || value === '1';

  return (
    <span
      className={`inline-flex px-2 py-0.5 text-sm font-medium rounded-full ${
        isTrue
          ? 'bg-green-100 text-green-800 border border-green-200'
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}
    >
      {isTrue ? 'Yes' : 'No'}
    </span>
  );
};

// ============================================================================
// Long Text Cell - Truncated with hover preview
// ============================================================================

interface LongTextCellProps {
  value: string;
  maxLength?: number;
}

export const LongTextCell: React.FC<LongTextCellProps> = ({ value, maxLength = 50 }) => {
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const cellRef = useRef<HTMLDivElement>(null);

  const isLong = value.length > maxLength;
  const displayValue = isLong ? value.slice(0, maxLength) + '...' : value;

  const handleMouseEnter = () => {
    if (isLong && cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + 4,
        left: Math.min(rect.left, window.innerWidth - 320),
      });
      setShowPopover(true);
    }
  };

  const handleMouseLeave = () => {
    setShowPopover(false);
  };

  return (
    <>
      <div
        ref={cellRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="text-gray-900 truncate"
      >
        {displayValue}
      </div>
      {showPopover &&
        createPortal(
          <div
            className="fixed w-80 max-h-48 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 z-[10000] p-3"
            style={{ top: popoverPosition.top, left: popoverPosition.left }}
            onMouseEnter={() => setShowPopover(true)}
            onMouseLeave={() => setShowPopover(false)}
          >
            <p className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-wrap">{value}</p>
          </div>,
          document.body
        )}
    </>
  );
};

// ============================================================================
// Picklist Cell - Single chip
// ============================================================================

interface PicklistCellProps {
  value: string;
}

export const PicklistCell: React.FC<PicklistCellProps> = ({ value }) => {
  return (
    <span className="inline-flex px-2 py-0.5 text-sm font-medium bg-gray-50 border border-gray-100 shadow-xs rounded-full text-gray-800 whitespace-nowrap">
      {value}
    </span>
  );
};

// ============================================================================
// Truncated Text Cell - Generic truncated text with tooltip
// ============================================================================

interface TruncatedTextCellProps {
  value: string | number | null | undefined;
  maxWidth?: number;
  className?: string;
}

export const TruncatedTextCell: React.FC<TruncatedTextCellProps> = ({
  value,
  maxWidth = 200,
  className = '',
}) => {
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const cellRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const displayValue = value == null ? '—' : String(value);

  // Check if text is actually truncated
  React.useEffect(() => {
    if (cellRef.current) {
      setIsTruncated(cellRef.current.scrollWidth > cellRef.current.clientWidth);
    }
  }, [displayValue]);

  const handleMouseEnter = () => {
    if (isTruncated && cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect();
      const tooltipWidth = 320;
      // Position tooltip below the cell, ensuring it doesn't overflow viewport
      setPopoverPosition({
        top: rect.bottom + 4,
        left: Math.min(rect.left, window.innerWidth - tooltipWidth - 16),
      });
      setShowPopover(true);
    }
  };

  const handleMouseLeave = () => {
    setShowPopover(false);
  };

  return (
    <>
      <div
        ref={cellRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`truncate ${className}`}
        style={{ maxWidth }}
      >
        {displayValue}
      </div>
      {showPopover &&
        createPortal(
          <div
            className="fixed max-w-[320px] max-h-48 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 z-[10000] p-3"
            style={{ top: popoverPosition.top, left: popoverPosition.left }}
            onMouseEnter={() => setShowPopover(true)}
            onMouseLeave={() => setShowPopover(false)}
          >
            <p className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
              {displayValue}
            </p>
          </div>,
          document.body
        )}
    </>
  );
};
