import React from 'react';
import { isSalesforceUrl } from './utils/salesforceDeepLink';
export interface SalesforceLinkProps {
  /** The URL to link to */
  href?: string;
  /** The link text/content */
  children?: React.ReactNode;
  /** Called when the link is clicked */
  onLinkClick?: (href: string | undefined, linkText: string) => void;
}

/**
 * Custom link component for Streamdown that styles Salesforce URLs consistently.
 *
 * When a link points to a Salesforce URL (*.salesforce.com, *.force.com, etc.),
 * it renders with special styling and an external link icon.
 *
 * All links open in a new tab with security attributes.
 */
export const SalesforceLink: React.FC<SalesforceLinkProps> = ({ href, children, onLinkClick }) => {
  const isSfLink = href ? isSalesforceUrl(href) : false;

  const handleClick = onLinkClick
    ? () => {
        const text =
          typeof children === 'string'
            ? children
            : React.isValidElement(children)
              ? String(
                  (children as React.ReactElement<{ children?: unknown }>).props?.children ?? ''
                )
              : '';
        onLinkClick(href, text);
      }
    : undefined;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        isSfLink
          ? 'text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1'
          : 'text-indigo-600 hover:text-indigo-800 hover:underline'
      }
      title={isSfLink ? 'Open in Salesforce' : undefined}
      onClick={handleClick}
    >
      {children}
    </a>
  );
};

export default SalesforceLink;
