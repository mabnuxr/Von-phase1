import React from 'react';
import { SmileyIcon, SmileySadIcon, SmileyMehIcon } from '@phosphor-icons/react';
import type { QueryColumn, SentimentType } from '../types';
import { isSalesforceUrl } from '../../Chat/utils/salesforceDeepLink';

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
 * Format a table cell value with special handling for deep_link columns.
 * Renders Salesforce deep links as clickable "View in Salesforce" links,
 * other URLs as clickable links, and falls back to formatValue for everything else.
 */
export function formatCellValue(
  columnKey: string,
  value: string | number,
  columnType?: QueryColumn['type']
): React.ReactNode {
  const strValue = String(value);

  if (columnKey === 'deep_link' && isUrl(strValue)) {
    if (isSalesforceUrl(strValue)) {
      return (
        <a
          href={strValue}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 hover:underline break-all"
          title="Open in Salesforce"
        >
          View in Salesforce
        </a>
      );
    }
    return (
      <a
        href={strValue}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-600 hover:text-indigo-800 hover:underline break-all"
      >
        {strValue}
      </a>
    );
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
