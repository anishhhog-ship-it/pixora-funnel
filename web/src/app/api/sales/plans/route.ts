import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { verifySalesStaffAccess, extractAuthToken } from '@/services/salesAuthService';
import { databaseFailure } from '@/services/salesServer';

export async function GET(req: NextRequest) {
  try {
    const session = await verifySalesStaffAccess(extractAuthToken(req));
    if (!session.isAuthenticated) return NextResponse.json({ success: false, error: 'Unauthorized sales access' }, { status: 401 });
    // Plan pricing is an internal sales contract; never expose a synthetic
    // fallback when the authoritative table is unavailable.
    const supabase = getSupabaseAdminClient();
    const { data: plans, error } = await (supabase as any)
      .from('commercial_plans')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.warn('Error fetching commercial plans:', error);
      return databaseFailure();
    }

    return NextResponse.json({ success: true, plans: plans || [] });
  } catch {
    return databaseFailure();
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
