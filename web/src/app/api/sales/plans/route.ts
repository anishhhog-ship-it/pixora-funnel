import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { verifySalesStaffAccess, extractAuthToken } from '@/services/salesAuthService';
import { databaseFailure } from '@/services/salesServer';

const CANONICAL_COMMERCIAL_PLANS = [
  {
    id: 'plan_lifetime_launch',
    name: 'Founder Launch Lifetime Offer',
    slug: 'lifetime_launch_100',
    description: 'Exclusive launch offer for first 100 businesses. Lifetime Review Funnel software access with zero renewal fees.',
    price_paise: 259900,
    price_inr: 2599,
    billing_interval: 'lifetime',
    duration_years: 99,
    is_lifetime: true,
    includes_nfc: false,
    max_slots: 100,
    slots_used: 12,
    is_active: true,
    display_order: 1,
    features: ['Lifetime Review Funnel Software', 'Unlimited Google Reviews Routing', 'Smart AI Review Wizard', 'Custom QR Stand Asset', 'Zero Recurring Fees'],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'plan_2year_software',
    name: 'Standard 2-Year Plan',
    slug: 'standard_2year_software',
    description: 'Full access for 2 full years to Pixora Review Funnel, smart routing, and QR assets.',
    price_paise: 259900,
    price_inr: 2599,
    billing_interval: '2_years',
    duration_years: 2,
    is_lifetime: false,
    includes_nfc: false,
    max_slots: null,
    slots_used: 0,
    is_active: true,
    display_order: 2,
    features: ['2-Year Full Software License', 'Unlimited Table & Counter Scans', 'AI Auto-Reply Generator', 'Dynamic Feedback Routing', 'Priority Support'],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'plan_2year_nfc',
    name: 'Standard 2-Year Plan + NFC Delivery',
    slug: 'standard_2year_nfc',
    description: '2-Year Review Funnel access plus premium custom printed NFC Card & Stand delivered to doorstep.',
    price_paise: 299900,
    price_inr: 2999,
    billing_interval: '2_years',
    duration_years: 2,
    is_lifetime: false,
    includes_nfc: true,
    max_slots: null,
    slots_used: 0,
    is_active: true,
    display_order: 3,
    features: ['2-Year Full Software License', '1x Custom NFC Business Card', '1x Acrylic Table Display Stand', 'Doorstep Express Courier', 'Ready to Tap & Collect Reviews'],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    const { data: plans, error } = await (supabase as any)
      .from('commercial_plans')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (!error && Array.isArray(plans) && plans.length > 0) {
      const formatted = plans.map((p) => ({
        ...p,
        price_inr: p.price_inr ?? (p.price_paise ? Math.round(p.price_paise / 100) : 2599),
      }));
      return NextResponse.json({ success: true, plans: formatted });
    }

    return NextResponse.json({ success: true, plans: CANONICAL_COMMERCIAL_PLANS });
  } catch {
    return NextResponse.json({ success: true, plans: CANONICAL_COMMERCIAL_PLANS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = extractAuthToken(req);
    const session = await verifySalesStaffAccess(token);

    if (!session.isAuthenticated || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Only admins can modify commercial plans' }, { status: 403 });
    }

    const body = await req.json();
    const { name, slug, description, priceInr, billingInterval, durationYears, isLifetime, includesNfc, maxSlots, features, displayOrder } = body;

    const pricePaise = Math.round(Number(priceInr || 2599) * 100);
    const supabase = getSupabaseAdminClient();

    const { data: plan, error } = await (supabase as any)
      .from('commercial_plans')
      .upsert({
        name,
        slug,
        description,
        price_paise: pricePaise,
        billing_interval: billingInterval || '2_years',
        duration_years: durationYears || 2,
        is_lifetime: isLifetime || false,
        includes_nfc: includesNfc || false,
        max_slots: maxSlots || null,
        features: features || [],
        display_order: displayOrder || 1,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'slug' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, plan });
  } catch {
    return databaseFailure();
  }
}
