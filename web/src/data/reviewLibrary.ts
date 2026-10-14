import { generateCombinatorialReviews } from './reviewCombinator';

export interface QuickReview {
  badge: string;
  badgeColor: string;
  text: string;
  stars: number;
}

/**
 * Generate smart pre-written reviews from the library tailored to the business and category.
 * If customer input is provided, incorporates their highlights.
 */
export function generateSmartReviews(
  count: number = 3,
  businessName: string = 'this business',
  rawCategory: string = '',
  customerInput: string = '',
  _businessId = 'default',
): string[] {
  return generateCombinatorialReviews(count, businessName, rawCategory, customerInput);
}

/**
 * Get ready-made quick reviews with badges from the library.
 */
export async function getQuickReviews(
  businessName: string = 'this business',
  rawCategory: string = '',
  _businessId = 'default',
): Promise<QuickReview[]> {
  const reviews = generateCombinatorialReviews(3, businessName, rawCategory);
  const badges = [
    { badge: 'Top Service', badgeColor: '#059669' },
    { badge: 'Highly Recommended', badgeColor: '#2563EB' },
    { badge: 'Great Experience', badgeColor: '#D97706' },
  ];
  return reviews.map((text, i) => ({
    badge: badges[i]?.badge || 'Verified Guest',
    badgeColor: badges[i]?.badgeColor || '#059669',
    text,
    stars: 5,
  }));
}

export function getUsageStats(_businessId: string): { used: number; available: number; category: string } {
  return { used: 3, available: 64000, category: 'library-curated' };
}
