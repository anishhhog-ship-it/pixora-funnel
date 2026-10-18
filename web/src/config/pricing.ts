export type PricingPlanSlug = 'lifetime_software' | 'lifetime_software_nfc';

export interface PricingPlan {
  id: PricingPlanSlug;
  slug: PricingPlanSlug;
  name: string;
  description: string;
  price_paise: number;
  price_inr: number;
  billing_interval: 'lifetime';
  duration_years: 0;
  is_lifetime: true;
  includes_nfc: boolean;
  max_slots: null;
  slots_used: number;
  is_active: true;
  display_order: number;
  features: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'lifetime_software',
    slug: 'lifetime_software',
    name: 'Lifetime Software',
    description: 'Lifetime Pixora Review Funnel software access without NFC hardware.',
    price_paise: 259900,
    price_inr: 2599,
    billing_interval: 'lifetime',
    duration_years: 0,
    is_lifetime: true,
    includes_nfc: false,
    max_slots: null,
    slots_used: 0,
    is_active: true,
    display_order: 1,
    features: [
      'Lifetime Review Funnel Software',
      'Unlimited Google Reviews Routing',
      'Smart AI Review Wizard',
      'Custom QR Stand Asset',
      'No account cap',
    ],
  },
  {
    id: 'lifetime_software_nfc',
    slug: 'lifetime_software_nfc',
    name: 'Lifetime Software + NFC doorstep delivery',
    description: 'Lifetime Pixora Review Funnel software access with NFC hardware delivered to your doorstep.',
    price_paise: 299900,
    price_inr: 2999,
    billing_interval: 'lifetime',
    duration_years: 0,
    is_lifetime: true,
    includes_nfc: true,
    max_slots: null,
    slots_used: 0,
    is_active: true,
    display_order: 2,
    features: [
      'Lifetime Review Funnel Software',
      'Unlimited Google Reviews Routing',
      'Smart AI Review Wizard',
      'Custom NFC Review Card + Stand',
      'Doorstep delivery in India',
      'No account cap',
    ],
  },
];

export const CANONICAL_COMMERCIAL_PLANS = PRICING_PLANS.map((plan) => ({
  ...plan,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}));

export const DEFAULT_PRICING_PLAN_SLUG: PricingPlanSlug = 'lifetime_software';

// These aliases keep the excluded lock flow and existing browser sessions
// compatible while all new pricing surfaces use the canonical lifetime slugs.
const LEGACY_PLAN_ALIASES: Record<string, PricingPlanSlug> = {
  lifetime_launch_100: 'lifetime_software',
  standard_2year_software: 'lifetime_software',
  standard_2year_nfc: 'lifetime_software_nfc',
  plan_2year_software: 'lifetime_software',
  plan_pro_nfc_lifetime: 'lifetime_software_nfc',
};

export function resolvePricingPlanSlug(value: unknown): PricingPlanSlug | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const normalized = value.trim();
  if (PRICING_PLANS.some((plan) => plan.slug === normalized)) {
    return normalized as PricingPlanSlug;
  }
  return LEGACY_PLAN_ALIASES[normalized] || null;
}

export function getPricingPlan(value: unknown): PricingPlan | null {
  const slug = resolvePricingPlanSlug(value);
  return slug ? PRICING_PLANS.find((plan) => plan.slug === slug) || null : null;
}
