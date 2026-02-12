import React from 'react';
import { SmileyIcon, SmileySadIcon, SmileyMehIcon } from '@phosphor-icons/react';
import type { QueryColumn, SentimentType } from '../types';

// ============================================================================
// Deep Link Rendering
// ============================================================================

/**
 * Renders an ID cell value as a clickable deep link if a URL is available.
 */
export function renderLinkedId(
  value: string | number,
  deepLinkUrl: string | number | undefined
): React.ReactNode {
  const strUrl = deepLinkUrl != null ? String(deepLinkUrl) : '';
  if (strUrl && isUrl(strUrl)) {
    return (
      <a
        href={strUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-600 hover:text-indigo-800 hover:underline"
      >
        {String(value)}
      </a>
    );
  }
  return String(value);
}

// ============================================================================
// Value Formatters
// ============================================================================

/**
 * Detect if a string value is a URL
 */
function isUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

/**
 * Format a table cell value with special handling for linked columns.
 * When a linkUrl is provided (from col.linkKey), renders the value as a clickable link.
 * Falls back to formatValue for everything else.
 */
export function formatCellValue(
  value: string | number,
  columnType?: QueryColumn['type'],
  linkUrl?: string | number
): React.ReactNode {
  // Handle linked columns (e.g. ID column linked via deep_link)
  if (linkUrl != null) {
    const strUrl = String(linkUrl);
    if (isUrl(strUrl)) {
      return (
        <a
          href={strUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          {String(value)}
        </a>
      );
    }
  }

  return formatValue(value, columnType);
}

/**
 * Formats a value based on its column type
 *
 * @param value - The value to format
 * @param type - The column type (currency, percentage, number, date, etc.)
 * @returns Formatted string representation
 */
export const formatValue = (value: string | number, type?: QueryColumn['type']): string => {
  if (value === null || value === undefined) return '-';

  switch (type) {
    case 'currency':
      return typeof value === 'number'
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          }).format(value)
        : String(value);
    case 'percentage':
      return typeof value === 'number' ? `${value.toFixed(1)}%` : String(value);
    case 'number':
      return typeof value === 'number'
        ? new Intl.NumberFormat('en-US').format(value)
        : String(value);
    case 'date':
      if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
      return String(value);
    default:
      return String(value);
  }
};

// ============================================================================
// Sentiment Helpers
// ============================================================================

/**
 * Returns the appropriate icon component for a sentiment type
 *
 * @param sentiment - The sentiment type
 * @returns React element with the sentiment icon
 */
export const getSentimentIcon = (sentiment?: SentimentType): React.ReactNode => {
  switch (sentiment) {
    case 'positive':
      return <SmileyIcon size={14} weight="duotone" className="text-emerald-600" />;
    case 'negative':
      return <SmileySadIcon size={14} weight="duotone" className="text-red-500" />;
    case 'neutral':
    default:
      return <SmileyMehIcon size={14} weight="duotone" className="text-gray-500" />;
  }
};

/**
 * Returns the label for a sentiment type
 *
 * @param sentiment - The sentiment type
 * @returns Human-readable sentiment label
 */
export const getSentimentLabel = (sentiment?: SentimentType): string => {
  switch (sentiment) {
    case 'positive':
      return 'Positive';
    case 'negative':
      return 'Negative';
    case 'neutral':
    default:
      return 'Neutral';
  }
};
