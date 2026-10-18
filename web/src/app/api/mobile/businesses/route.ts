/* The mobile endpoint spans legacy tables that are not present in the stale
 * generated web Database type. Keep the dynamic admin boundary local until
 * the authoritative Supabase types are regenerated. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { extractAuthToken } from '@/services/salesAuthService';

export const dynamic = 'force-dynamic';

/**
 * Mobile-only business resolver.
 *
 * Unlike the legacy dashboard resolver, this endpoint never creates or
 * activates a business as a side effect. It only returns tenants already
 * linked to the authenticated Supabase user. This keeps the native client
 * honest for new accounts and prevents a missing link from becoming a fake
 * production tenant.
 */
export async function GET(req: NextRequest) {
  const token = extractAuthToken(req);
  if (!token) {
    return NextResponse.json({ success: false, error: 'Authorization header required' }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdminClient() as any;
    const { data: authData, error: authError } = await admin.auth.getUser(token);

    if (authError || !authData?.user) {
      return NextResponse.json({ success: false, error: 'Invalid or expired user session' }, { status: 401 });
    }

    const user = authData.user;
    const email = (user.email || '').toLowerCase().trim();
    const candidateIds = new Set<string>();

    const [{ data: owned }, { data: legacyMembers }, { data: profile }] = await Promise.all([
      admin.from('businesses').select('id').eq('owner_id', user.id),
      admin.from('business_members').select('business_id').eq('user_id', user.id),
      admin.from('profiles').select('id').eq('auth_user_id', user.id).maybeSingle(),
    ]);

    for (const row of owned || []) if (row.id) candidateIds.add(row.id);
    for (const row of legacyMembers || []) if (row.business_id) candidateIds.add(row.business_id);

    if (profile?.id) {
      const { data: profileMembers } = await admin
        .from('business_members')
        .select('business_id')
        .eq('user_id', profile.id);
      for (const row of profileMembers || []) if (row.business_id) candidateIds.add(row.business_id);
    }

    // Sales-provisioned accounts historically stored the customer's email on
    // the business before auth_user_id was linked. Email is checked only after
    // the request is authenticated and is never used by the client directly.
    if (email) {
      const { data: emailBusinesses } = await admin
        .from('businesses')
        .select('id')
        .ilike('email', email)
        .eq('status', 'active');
      for (const row of emailBusinesses || []) if (row.id) candidateIds.add(row.id);
    }

    if (candidateIds.size === 0) {
      return NextResponse.json({ success: true, businesses: [], activeSlug: null });
    }

    const { data: businesses, error: businessesError } = await admin
      .from('businesses')
      .select('*')
      .in('id', [...candidateIds])
      .order('created_at', { ascending: false });

    if (businessesError) {
      return NextResponse.json({ success: false, error: businessesError.message }, { status: 500 });
    }

    const results = await Promise.all(
      (businesses || []).map(async (business: any) => {
        const [{ data: funnel }, { data: qrCode }, { data: googleConnection }, { data: membership }] = await Promise.all([
          admin.from('funnels').select('*').eq('business_id', business.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          admin.from('qr_codes').select('*').eq('business_id', business.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
          admin.from('google_connections').select('id, business_id, provider, google_account_id, google_location_id, status, scopes, connected_at, last_synced_at, initial_sync_completed_at, next_sync_at, sync_error').eq('business_id', business.id).maybeSingle(),
          profile?.id
            ? admin.from('business_members').select('role').eq('business_id', business.id).eq('user_id', profile.id).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        return {
          ...business,
          funnel: funnel || null,
          qrCode: qrCode || null,
          googleConnection: googleConnection || null,
          membershipRole: membership?.role || (business.owner_id === user.id ? 'owner' : null),
        };
      })
    );

    return NextResponse.json({
      success: true,
      businesses: results,
      activeSlug: results[0]?.slug || null,
    });
  } catch (error: any) {
    console.error('Mobile business resolver error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Unable to load businesses' }, { status: 500 });
  }
}
