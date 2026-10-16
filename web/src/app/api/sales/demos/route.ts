import { NextRequest, NextResponse } from 'next/server';
import { requireSalesSession, salesDb, databaseFailure, boundedText, isUuid } from '@/services/salesServer';
import { isAllowedGoogleMapsUrl, isAllowedGoogleReviewUrl, isAllowedReviewDestinationUrl, isHttpsUrl } from '@/services/salesValidation';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://funnel.pixoraautomations.com';
const DEFAULT_CATEGORY = 'General Business';

function slugBase(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48) || 'business';
}

async function uniqueSlug(db: any, name: string) {
  const base = slugBase(name);
  // 1. Try clean business name slug first (no random hashes)
  const { data: d1 } = await db.from('sales_demos').select('id').eq('slug', base).maybeSingle();
  const { data: b1 } = await db.from('businesses').select('id').eq('slug', base).maybeSingle();
  if (!d1 && !b1) return base;

  // 2. If already taken, use clean human suffixes like -2, -3 (NEVER random hex hashes)
  for (let i = 2; i <= 50; i++) {
    const candidate = `${base}-${i}`;
    const { data: dTaken } = await db.from('sales_demos').select('id').eq('slug', candidate).maybeSingle();
    const { data: bTaken } = await db.from('businesses').select('id').eq('slug', candidate).maybeSingle();
    if (!dTaken && !bTaken) return candidate;
  }
  return `${base}-${Date.now().toString().slice(-4)}`;
}

function categoryDefaults(category: string) {
  const normalized = category.trim() || DEFAULT_CATEGORY;
  const lower = normalized.toLowerCase();
  if (lower.includes('restaurant') || lower.includes('food')) {
    return { category: normalized, color: '#0B3D2E', headline: 'How was your dining experience with us?' };
  }
  if (lower.includes('salon') || lower.includes('spa')) {
    return { category: normalized, color: '#7C3AED', headline: 'How was your experience with us?' };
  }
  return { category: normalized, color: '#2563EB', headline: 'How was your experience with us?' };
}

export async function GET(req: NextRequest) {
  const access = await requireSalesSession(req);
  if ('response' in access) return access.response;
  try {
    const { searchParams } = new URL(req.url);
    const db = salesDb();
    let query = db.from('sales_demos').select('*, prospect:prospect_id(id, business_name, contact_name, phone, stage)').order('created_at', { ascending: false });
    if (access.session.role === 'salesperson') query = query.eq('created_by', access.session.staffId);
    const prospectId = searchParams.get('prospectId');
    if (prospectId) {
      if (!isUuid(prospectId)) return NextResponse.json({ success: false, error: 'Invalid prospect ID' }, { status: 400 });
      query = query.eq('prospect_id', prospectId);
    }
    const { data, error } = await query;
    if (error) return databaseFailure();
    return NextResponse.json({ success: true, demos: data || [] });
  } catch { return databaseFailure(); }
}

export async function POST(req: NextRequest) {
  const access = await requireSalesSession(req);
  if ('response' in access) return access.response;
  let businessId: string | null = null;
  const db = salesDb();
  try {
    const body = await req.json();
    const businessName = boundedText(body.businessName, 160);
    if (!businessName) return NextResponse.json({ success: false, error: 'Business name is required' }, { status: 400 });
    const prospectId = body.prospectId == null ? null : body.prospectId;
    if (prospectId && !isUuid(prospectId)) return NextResponse.json({ success: false, error: 'Invalid prospect ID' }, { status: 400 });
    const defaults = categoryDefaults(typeof body.category === 'string' ? body.category : DEFAULT_CATEGORY);
    let reviewUrl = boundedText(body.reviewDestinationUrl, 2000);
    const googleMapsUrl = boundedText(body.googleMapsUrl, 2000);
    const googleReviewUrl = boundedText(body.googleReviewUrl, 2000);
    const googlePlaceId = boundedText(body.googlePlaceId, 200);
    if (googleMapsUrl && !isAllowedGoogleMapsUrl(googleMapsUrl)) {
      return NextResponse.json({ success: false, error: 'Google Maps link is not supported.' }, { status: 400 });
    }
    if (googleReviewUrl && !isAllowedGoogleReviewUrl(googleReviewUrl)) {
      return NextResponse.json({ success: false, error: 'Google review URL is not supported.' }, { status: 400 });
    }

    // If reviewUrl is missing or the generic placeholder https://maps.app.goo.gl/, fetch from prospect
    let prospectData: any = null;
    if (prospectId) {
      const { data: p } = await db.from('prospects').select('google_maps_url, address, city, phone').eq('id', prospectId).maybeSingle();
      if (p) {
        prospectData = p;
        if (p.google_maps_url && (!reviewUrl || reviewUrl === 'https://maps.app.goo.gl/' || reviewUrl === 'https://maps.app.goo.gl' || reviewUrl === 'https://maps.google.com')) {
          reviewUrl = p.google_maps_url;
        }
      }
    }

    if (!reviewUrl || !isHttpsUrl(reviewUrl)) {
      return NextResponse.json({ success: false, error: 'A real Google review URL is required. Generate it from the business Maps link or use the manual review URL fallback.' }, { status: 400 });
    }
    if (!isAllowedReviewDestinationUrl(reviewUrl)) {
      return NextResponse.json({ success: false, error: 'Review destination must be a Google review-writing URL or an existing Google Maps business URL.' }, { status: 400 });
    }

    const config = body.config && typeof body.config === 'object' ? body.config : {};
    // Keep the salesperson-entered contact details in the public-safe demo
    // config as well as the canonical businesses row. Trial demo businesses
    // may not be visible through anonymous RLS until activation.
    const demoAddress = boundedText(body.address || prospectData?.address || config.address, 300);
    const demoCity = boundedText(body.city || prospectData?.city || config.city, 100);
    const demoPhone = boundedText(body.phone || prospectData?.phone || config.phone, 40);
    const publicConfig = {
      ...config,
      ...(demoAddress ? { address: demoAddress } : {}),
      ...(demoCity ? { city: demoCity } : {}),
      ...(demoPhone ? { phone: demoPhone } : {}),
    };
    const color = /^#[0-9a-f]{6}$/i.test(body.primaryColor || '') ? body.primaryColor : defaults.color;
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    // Check if a demo already exists for this lead (prospectId)
    // If yes, REUSE THE SAME SLUG & DEMO so URLs do NOT get numbers like -2, -3 appended!
    let existingDemo = null;
    if (prospectId) {
      const { data: foundDemo } = await db
        .from('sales_demos')
        .select('id, slug, business_id, created_by, status')
        .eq('prospect_id', prospectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (foundDemo?.slug) {
        existingDemo = foundDemo;
      }
    }

    if (existingDemo) {
      const slug = existingDemo.slug;
      businessId = existingDemo.business_id;

      // Update existing business record
      if (businessId) {
        const businessUpdate: Record<string, unknown> = {
          name: businessName,
          category: defaults.category,
          website: reviewUrl,
          primary_color: color,
          secondary_color: '#D4AF37',
          status: 'trial',
          plan_status: 'trial',
          trial_expires_at: expires,
          headline: config.headline || defaults.headline,
          subheadline: config.subheadline || null,
          updated_at: now.toISOString(),
        };
        if (demoAddress) businessUpdate.address = demoAddress;
        if (demoCity) businessUpdate.city = demoCity;
        if (demoPhone) businessUpdate.phone = demoPhone;

        // Do not clear previously confirmed Google data when an older demo edit
        // does not include the new Quick Demo fields.
        if (googlePlaceId) businessUpdate.google_place_id = googlePlaceId;
        if (googleMapsUrl) businessUpdate.google_maps_url = googleMapsUrl;
        if (googleReviewUrl || isAllowedGoogleReviewUrl(reviewUrl)) {
          businessUpdate.google_review_url = googleReviewUrl || reviewUrl;
        }
        await db.from('businesses').update(businessUpdate).eq('id', businessId);
      }

      // Update existing demo record
      const { data: updatedDemo, error: demoUpdateErr } = await db.from('sales_demos').update({
        business_name: businessName,
        category: defaults.category,
        review_destination_url: reviewUrl,
        primary_color: color,
        logo_url: boundedText(body.logoUrl, 2000),
        cover_url: boundedText(body.coverUrl, 2000),
        template_slug: boundedText(body.templateSlug, 80) || 'classic',
        config: publicConfig,
        status: 'active',
        expires_at: expires,
        updated_at: now.toISOString(),
      }).eq('id', existingDemo.id).select().single();

      if (demoUpdateErr) throw new Error('Unable to update demo');

      // Refresh demo activity
      try {
        await db.from('prospects').update({ stage: 'Demo In Progress', updated_at: now.toISOString() }).eq('id', prospectId);
        await db.from('sales_activities').insert({
          prospect_id: prospectId,
          staff_id: access.session.staffId,
          type: 'demo_updated',
          title: 'Review Funnel Updated',
          description: `Updated trial demo on same link /f/${slug}.`,
          metadata: { demoId: existingDemo.id, slug },
        });
      } catch (actErr) {
        console.warn('Unable to record demo update activity:', actErr);
      }

      return NextResponse.json({
        success: true,
        demo: updatedDemo || existingDemo,
        publicFunnelUrl: `/f/${slug}`,
        publicDemoUrl: `/f/${slug}`,
      });
    }

    // New demo generation (first time for this lead):
    const slug = await uniqueSlug(db, businessName);

    // The demo tenant is deliberately ownerless and trial-only. It is the same
    // tenant that the activation RPC later upgrades; no paid entitlement here.
    const businessResult = await db.from('businesses').insert({
      name: businessName, slug, category: defaults.category, website: reviewUrl,
       address: demoAddress || null,
       city: demoCity || null,
       phone: demoPhone || null,
      primary_color: color, secondary_color: '#D4AF37', status: 'trial', plan_status: 'trial', trial_expires_at: expires,
      headline: config.headline || defaults.headline, subheadline: config.subheadline || null,
      menu_enabled: true, products_enabled: true,
      google_place_id: googlePlaceId || null,
      google_review_url: googleReviewUrl || (isAllowedGoogleReviewUrl(reviewUrl) ? reviewUrl : null),
      google_maps_url: googleMapsUrl || null,
    }).select('id,name,slug').single();
    if (businessResult.error || !businessResult.data) return databaseFailure();
    businessId = businessResult.data.id;

    const demoResult = await db.from('sales_demos').insert({
      slug, business_id: businessId, prospect_id: prospectId, created_by: access.session.staffId,
      business_name: businessName, category: defaults.category, review_destination_url: reviewUrl,
      primary_color: color, logo_url: boundedText(body.logoUrl, 2000), cover_url: boundedText(body.coverUrl, 2000),
       template_slug: boundedText(body.templateSlug, 80) || 'classic', config: publicConfig, config_version: 1,
      status: 'active', expires_at: expires,
    }).select().single();
    if (demoResult.error || !demoResult.data) throw new Error('Unable to persist demo');

    const funnel = await db.from('funnels').insert({ business_id: businessId, slug, status: 'active', review_enabled: true, smart_review_enabled: true }).select('id').single();
    if (funnel.error || !funnel.data) throw new Error('Unable to persist demo funnel');
    const qr = await db.from('qr_codes').insert({ business_id: businessId, funnel_id: funnel.data.id, name: `${businessName} Demo QR`, short_code: `px-${crypto.randomUUID().slice(0, 8)}`, destination_url: `${APP_URL}/f/${slug}`, status: 'active' });
    if (qr.error) throw new Error('Unable to persist demo QR');
    // Trial record (best-effort)
    try {
      await db.from('trials').insert({
        business_id: businessId,
        status: 'active',
        started_at: now.toISOString(),
        expires_at: expires,
      });
    } catch (trialErr) {
      console.warn('Unable to persist demo trial record:', trialErr);
    }

    if (prospectId) {
      try {
        await db.from('prospects').update({ stage: 'Demo In Progress', updated_at: now.toISOString() }).eq('id', prospectId);
        await db.from('sales_activities').insert({
          prospect_id: prospectId,
          staff_id: access.session.staffId,
          type: 'demo_created',
          title: 'Review Funnel Created',
          description: `Created trial demo /f/${slug}.`,
          metadata: { demoId: demoResult.data.id, slug },
        });
      } catch (actErr) {
        console.warn('Unable to record demo activity:', actErr);
      }
    }
    return NextResponse.json({ success: true, demo: demoResult.data, publicFunnelUrl: `/f/${slug}`, publicDemoUrl: `/f/${slug}` });
  } catch (error: any) {
    console.error('Demo creation error:', error);
    if (businessId) await db.from('businesses').delete().eq('id', businessId); // best-effort cleanup of an unreferenced trial tenant
    return databaseFailure(error?.message === 'Unable to persist demo' ? 'Unable to persist demo' : 'Unable to create demo');
  }
}

export async function PATCH(req: NextRequest) {
  const access = await requireSalesSession(req);
  if ('response' in access) return access.response;
  try {
    const body = await req.json();
    if (!isUuid(body.id)) return NextResponse.json({ success: false, error: 'Demo ID is required' }, { status: 400 });
    const db = salesDb();
    let owns = db.from('sales_demos').select('id,slug,prospect_id,created_by').eq('id', body.id);
    if (access.session.role === 'salesperson') owns = owns.eq('created_by', access.session.staffId);
    const found = await owns.maybeSingle();
    if (found.error) return databaseFailure();
    if (!found.data) return NextResponse.json({ success: false, error: 'Demo not found' }, { status: 404 });
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.reviewDestinationUrl !== undefined) {
      const url = boundedText(body.reviewDestinationUrl, 2000);
      if (!url || !isHttpsUrl(url)) return NextResponse.json({ success: false, error: 'Review destination must be HTTPS' }, { status: 400 });
      update.review_destination_url = url;
    }
    if (body.primaryColor !== undefined && /^#[0-9a-f]{6}$/i.test(body.primaryColor)) update.primary_color = body.primaryColor;
    if (body.config !== undefined && body.config && typeof body.config === 'object') update.config = body.config;
    if (body.markShared) { update.shared_at = new Date().toISOString(); update.status = 'shared'; }
    const result = await db.from('sales_demos').update(update).eq('id', body.id).select().single();
    if (result.error) return databaseFailure();
    return NextResponse.json({ success: true, demo: result.data, publicFunnelUrl: `/f/${result.data.slug}` });
  } catch { return databaseFailure(); }
}
