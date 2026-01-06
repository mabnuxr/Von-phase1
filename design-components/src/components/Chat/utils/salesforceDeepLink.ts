/**
 * Salesforce Deep Link Utilities
 *
 * Utilities for building and detecting Salesforce record URLs
 */

/**
 * Build a Salesforce Lightning deep link URL for a record
 *
 * @param instanceUrl - The Salesforce instance URL (e.g., "https://mycompany.my.salesforce.com")
 * @param sobjectType - The Salesforce object type (e.g., "Account", "Contact", "Opportunity")
 * @param recordId - The 18-character Salesforce record ID
 * @returns Full URL to the record in Salesforce Lightning, or null if any required parameter is missing
 *
 * @example
 * buildSalesforceDeepLink("https://acme.my.salesforce.com", "Account", "001xx000003DGbYAAW")
 * // Returns: "https://acme.my.salesforce.com/lightning/r/Account/001xx000003DGbYAAW/view"
 */
export function buildSalesforceDeepLink(
  instanceUrl: string | undefined | null,
  sobjectType: string | undefined | null,
  recordId: string | undefined | null
): string | null {
  // Validate all required parameters are present and non-empty
  if (!instanceUrl || !sobjectType || !recordId) {
    return null;
  }

  const baseUrl = instanceUrl.replace(/\/$/, '');
  return `${baseUrl}/lightning/r/${sobjectType}/${recordId}/view`;
}

/**
 * Check if a URL is a Salesforce URL
 *
 * Detects URLs from:
 * - *.salesforce.com (standard instances, My Domain)
 * - *.force.com (custom domains, sites)
 * - *.lightning.force.com (Lightning domains)
 *
 * @param url - URL to check
 * @returns true if the URL is a Salesforce URL
 */
export function isSalesforceUrl(url: string): boolean {
  if (!url) return false;
  // Match domains ending with .salesforce.com, .force.com, or .lightning.force.com
  // The pattern ensures we match the domain boundary (not fakesalesforce.com)
  return /\.(salesforce|force|lightning\.force)\.com(\/|$|:)/.test(url);
}
