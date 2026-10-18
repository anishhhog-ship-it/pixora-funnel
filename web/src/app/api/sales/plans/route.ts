import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { verifySalesStaffAccess, extractAuthToken } from '@/services/salesAuthService';
import { databaseFailure } from '@/services/salesServer';
import { CANONICAL_COMMERCIAL_PLANS, PRICING_PLANS, getPricingPlan, resolvePricingPlanSlug } from '@/config/pricing';

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    const { data: plans, error } = await (supabase as any)
      .from('commercial_plans')
      .select('*')
      .eq('is_active', true)
      .in('slug', PRICING_PLANS.map((plan) => plan.slug))
      .order('display_order', { ascending: true });

    if (!error && Array.isArray(plans)) {
      const bySlug = new Map(plans.map((plan: any) => [plan.slug, plan]));
      const formatted = CANONICAL_COMMERCIAL_PLANS.map((canonical) => ({
        ...canonical,
        ...(bySlug.get(canonical.slug) || {}),
        name: canonical.name,
        description: canonical.description,
        price_paise: canonical.price_paise,
        price_inr: canonical.price_inr,
        billing_interval: canonical.billing_interval,
        duration_years: canonical.duration_years,
        is_lifetime: canonical.is_lifetime,
        includes_nfc: canonical.includes_nfc,
        max_slots: null,
        is_active: true,
        display_order: canonical.display_order,
        features: canonical.features,
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
    const canonicalSlug = resolvePricingPlanSlug(body.slug);
    const canonicalPlan = getPricingPlan(canonicalSlug);
    if (!canonicalPlan || canonicalPlan.slug !== body.slug) {
      return NextResponse.json({ success: false, error: 'Only the two canonical lifetime plans can be configured' }, { status: 400 });
    }
    const supabase = getSupabaseAdminClient();

    const { data: plan, error } = await (supabase as any)
      .from('commercial_plans')
      .upsert({
        name: canonicalPlan.name,
        slug: canonicalPlan.slug,
        description: canonicalPlan.description,
        price_paise: canonicalPlan.price_paise,
        billing_interval: canonicalPlan.billing_interval,
        duration_years: canonicalPlan.duration_years,
        is_lifetime: canonicalPlan.is_lifetime,
        includes_nfc: canonicalPlan.includes_nfc,
        max_slots: null,
        features: canonicalPlan.features,
        display_order: canonicalPlan.display_order,
        is_active: true,
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
