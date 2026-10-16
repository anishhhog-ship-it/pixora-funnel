import { generateCombinatorialReviews, rankReviewsByKeyword } from './reviewCombinator';
import { supabase } from '@/lib/supabase/client';

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
 * Async version that also queries custom templates stored in Supabase review_category_templates.
 */
export async function generateSmartReviewsAsync(
  count: number = 3,
  businessName: string = 'this business',
  rawCategory: string = '',
  customerInput: string = '',
  _businessId = 'default',
): Promise<string[]> {
  try {
    const baseReviews = generateCombinatorialReviews(count, businessName, rawCategory, customerInput);

    // Attempt to fetch custom templates for this category
    if (rawCategory && typeof window !== 'undefined') {
      const rootWord = rawCategory.toLowerCase().includes('kitchen')
        ? 'kitchen'
        : rawCategory.toLowerCase().includes('sport')
        ? 'sport'
        : rawCategory.split(/[,&]/)[0].trim();

      const { data: customTemplates } = await supabase
        .from('review_category_templates')
        .select('content, category')
        .or(`category.ilike.%${rawCategory}%,category.ilike.%${rootWord}%`)
        .limit(20);

      if (customTemplates && customTemplates.length > 0) {
        const customized = (customTemplates as Array<{ content: string }>).map((t) => t.content.replace(/{biz}/g, businessName));
        // Dynamically rank all templates by customer topic keyword (e.g. Crockery, Gifts, Essentials, etc.)
        const allCandidates = Array.from(new Set([...customized, ...baseReviews]));
        const ranked = rankReviewsByKeyword(allCandidates, customerInput);
        return ranked.slice(0, count);
      }
    }

    return baseReviews;
  } catch {
    return generateCombinatorialReviews(count, businessName, rawCategory, customerInput);
  }
}

/**
 * Get ready-made quick reviews with badges from the library.
 */
export async function getQuickReviews(
  businessName: string = 'this business',
  rawCategory: string = '',
  businessId = 'default',
): Promise<QuickReview[]> {
  const reviews = await generateSmartReviewsAsync(3, businessName, rawCategory, '', businessId);
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

export { generateCategoryReviewPool, CATEGORY_COMBINATOR_FRAGMENTS } from './reviewCombinator';
