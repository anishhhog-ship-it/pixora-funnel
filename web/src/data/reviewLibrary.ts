/**
 * Customer-authored review language helper.
 *
 * This module deliberately does not contain fabricated reviews, ratings,
 * dishes, services, staff names, or experiences. It only cleans and formats
 * facts supplied by the customer. The resulting text remains editable before
 * the customer chooses whether to open Google.
 */

export interface QuickReview {
  badge: string;
  badgeColor: string;
  text: string;
  stars: number;
}

function cleanCustomerInput(input: string): string {
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

function sentenceCase(text: string): string {
  const value = text.trim();
  if (!value) return '';
  return `${value.charAt(0).toUpperCase()}${value.slice(1).replace(/[.!?]+$/, '')}.`;
}

/**
 * Return up to three factual rewrites of the customer's own words.
 * No category or business-specific facts are generated.
 */
export function generateSmartReviews(
  count: number,
  _businessName: string,
  _rawCategory: string,
  customerInput: string,
  _businessId = 'default',
): string[] {
  const input = cleanCustomerInput(customerInput);
  if (!input) return [];

  const primary = sentenceCase(input);
  const alternatives = [
    primary,
    `In my own words: ${primary}`,
    `My experience: ${primary}`,
  ];

  return alternatives.slice(0, Math.max(0, Math.min(count, alternatives.length)));
}

/**
 * Kept as a compatibility helper for older callers. It intentionally returns
 * no ready-made reviews because the customer must provide the factual source.
 */
export async function getQuickReviews(
  _businessName: string,
  _rawCategory: string,
  _businessId = 'default',
): Promise<QuickReview[]> {
  return [];
}

export function getUsageStats(_businessId: string): { used: number; available: number; category: string } {
  return { used: 0, available: 0, category: 'customer-authored' };
}
